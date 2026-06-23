import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { RichTextEditorField } from "@/components/ui/RichTextEditorField";
import { RichTextContent } from "@/components/data-display/RichTextContent";
import { StatusBadge } from "@/components/property/StatusBadge";
import { addLeadNote, assignLead, updateLeadStatus } from "@/services/leads.service";
import { listUsers } from "@/services/users.service";
import type { Lead, LeadNote } from "@/types/lead";
import { htmlTextLength } from "@/utils/html-text-length";
import { drawerAnimation } from "@/utils/motion";
import { cn } from "@/utils/cn";

type LeadDetailDrawerProps = {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
};

const noteSchema = z.object({
  note: z
    .string()
    .min(1, "Note cannot be empty")
    .refine((value) => htmlTextLength(value) > 0, { message: "Note cannot be empty" })
    .refine((value) => htmlTextLength(value) <= 2000, { message: "Note must not exceed 2000 characters" }),
});

type NoteFormValues = z.infer<typeof noteSchema>;

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getAssigneeId(assignee: Lead["assignee"]): string {
  if (!assignee || typeof assignee !== "object") return "";
  const id = (assignee as { id?: string }).id;
  return typeof id === "string" ? id : "";
}

function getAssigneeLabel(assignee: Lead["assignee"], fallback = "Agent"): string {
  if (!assignee || typeof assignee !== "object") return fallback;
  const fullName = (assignee as { fullName?: string }).fullName;
  return typeof fullName === "string" && fullName.length > 0 ? fullName : fallback;
}

export function LeadDetailDrawer({ lead, open, onClose }: LeadDetailDrawerProps) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState("new");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["internal-users"],
    queryFn: () => listUsers({ limit: 100 }),
    enabled: open,
    staleTime: 120_000,
  });

  useEffect(() => {
    if (!lead) {
      setNotes([]);
      setAssigneeId("");
      setStatus("new");
      return;
    }

    setNotes([...(lead.notes ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setAssigneeId(getAssigneeId(lead.assignee));
    setStatus(lead.status ?? "new");
  }, [lead]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: "" },
    mode: "onChange",
  });

  const authorLabel = useMemo(() => getAssigneeLabel(lead?.assignee), [lead?.assignee]);

  const statusMutation = useMutation({
    mutationFn: (nextStatus: string) => {
      if (!lead) throw new Error("Missing lead");
      return updateLeadStatus(lead.id, { status: nextStatus as never });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agent-leads"] });
    },
  });

  const assignmentMutation = useMutation({
    mutationFn: (nextAssigneeId: string) => {
      if (!lead) throw new Error("Missing lead");
      return assignLead(lead.id, { assigneeId: nextAssigneeId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agent-leads"] });
    },
  });

  const noteMutation = useMutation({
    mutationFn: async (note: string) => {
      if (!lead) throw new Error("Missing lead");
      return addLeadNote(lead.id, { note });
    },
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (!open) return;

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  if (!open || !lead) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer backdrop"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
      />
      <motion.aside
        {...drawerAnimation}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-[var(--color-surface)] shadow-modal",
          "border-l border-[var(--color-border)]",
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="font-display text-h4 text-[var(--color-text-primary)]">{lead.fullName}</h2>
            <p className="text-caption text-[var(--color-text-secondary)]">{asText(lead.email) ?? lead.phoneNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lead details"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <section className="space-y-3 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Contact Info</p>
              <p className="text-caption text-[var(--color-text-secondary)]">{lead.phoneNumber}</p>
              {asText(lead.email) ? <p className="text-caption text-[var(--color-text-secondary)]">{asText(lead.email)}</p> : null}
              {asText(lead.preferredLocation) ? (
                <p className="text-caption text-[var(--color-text-secondary)]">{asText(lead.preferredLocation)}</p>
              ) : null}
              {lead.propertyId ? (
                <Link to={`/properties/${lead.propertyId}`} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
                  View linked property
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={lead.status} />
              {lead.source ? <StatusBadge status={String(lead.source)} /> : null}
            </div>
          </section>

          <section className="grid gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Status</span>
              <select
                value={status}
                onChange={(event) => {
                  const next = event.target.value;
                  setStatus(next);
                  void statusMutation.mutateAsync(next);
                }}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm outline-none transition focus-visible:border-[var(--color-accent)]"
              >
                {["new", "contacted", "qualified", "converted", "closed", "spam"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Assignee</span>
              <select
                value={assigneeId}
                onChange={(event) => {
                  setAssigneeId(event.target.value);
                  void assignmentMutation.mutateAsync(event.target.value);
                }}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm outline-none transition focus-visible:border-[var(--color-accent)]"
              >
                <option value="">Unassigned</option>
                {(usersQuery.data?.data ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-h4 text-[var(--color-text-primary)]">Notes Timeline</h3>
              <span className="text-caption text-[var(--color-text-secondary)]">{notes.length} notes</span>
            </div>
            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-body text-[var(--color-text-secondary)]">No notes yet.</p>
              ) : (
                notes.map((note, index) => (
                  <article
                    key={note.id}
                    className={cn("space-y-3", index !== notes.length - 1 && "border-b border-[var(--color-border)] pb-4")}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-caption font-medium text-[var(--color-text-primary)]">{(note as LeadNote & { authorName?: string }).authorName ?? authorLabel}</p>
                      <p className="text-caption text-[var(--color-text-secondary)]">{formatTimestamp(note.createdAt)}</p>
                    </div>
                    <RichTextContent html={(note as LeadNote & { content?: string }).content ?? note.note} />
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="space-y-3 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <RichTextEditorField
              name="note"
              control={control}
              label="Add Note"
              placeholder="Add internal notes about this lead. Include call outcomes, preferences discussed, follow-up actions..."
              minHeight={160}
              maxCharacters={2000}
              showAlignment={false}
              toolbarVariant="editorial"
              rules={{ required: "Note cannot be empty" }}
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-input border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || isSaving || noteMutation.isPending}
                onClick={handleSubmit(async (values) => {
                  if (!lead) return;
                  setIsSaving(true);
                  try {
                    const created = await noteMutation.mutateAsync(values.note);
                    setNotes((current) => [created, ...current]);
                    reset({ note: "" });
                  } finally {
                    setIsSaving(false);
                  }
                })}
                className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting || isSaving || noteMutation.isPending ? "Saving..." : "Save Note"}
              </button>
            </div>
          </section>
        </div>
      </motion.aside>
    </div>
  );
}
