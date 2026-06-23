import { useEffect, useRef, useState, type ReactNode } from "react";
import type { KeyboardEvent } from "react";
import DOMPurify from "dompurify";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import {
  AlertCircle,
  Bold,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxCharacters?: number;
  toolbarVariant?: "full" | "minimal" | "editorial";
  showAlignment?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
}

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
};

function ToolbarButton({ active, disabled, onClick, label, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition",
        "hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]",
        active && "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-[var(--color-text-secondary)]",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="h-5 w-px bg-[var(--color-border)]" />;
}

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function RichTextEditor({
  value,
  onChange,
  id,
  placeholder = "Write something...",
  minHeight = 200,
  maxCharacters,
  toolbarVariant = "full",
  showAlignment = false,
  disabled = false,
  error,
  label,
  helperText,
  required,
}: RichTextEditorProps) {
  const [linkValue, setLinkValue] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const previousValue = useRef<string>("");

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Typography,
      Highlight.configure({ multicolor: false }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        emptyEditorClass: "is-editor-empty",
      }),
      CharacterCount.configure(maxCharacters ? { limit: maxCharacters } : {}),
    ],
    content: DOMPurify.sanitize(value),
    onUpdate: ({ editor: currentEditor }) => {
      const html = DOMPurify.sanitize(currentEditor.getHTML());
      previousValue.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const nextValue = DOMPurify.sanitize(value);
    if (nextValue !== previousValue.current && nextValue !== editor.getHTML()) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
      previousValue.current = nextValue;
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const characterCount = editor?.storage.characterCount.characters() ?? 0;
  const maxCount = maxCharacters ?? 0;
  const countWarning = maxCharacters ? characterCount / maxCount > 0.9 : false;
  const helperTextId = id ? `${id}-help` : undefined;
  const errorId = id ? `${id}-error` : undefined;
  const describedBy = [helperText ? helperTextId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
  const isFull = toolbarVariant === "full";
  const isEditorial = toolbarVariant === "editorial";
  const showInlineStyles = toolbarVariant !== "minimal";

  const submitLink = () => {
    if (!editor) return;
    if (!linkValue.trim()) {
      editor.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }

    if (!isUrl(linkValue.trim())) {
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: linkValue.trim() }).run();
    setShowLinkInput(false);
  };

  const handleToolbarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setShowLinkInput(false);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("space-y-2", disabled && "opacity-60")}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)]">
          {label}
          {required ? <span className="ml-1 text-[var(--color-danger)]">*</span> : null}
        </label>
      ) : null}
      {helperText ? (
        <p id={helperTextId} className="text-caption text-[var(--color-text-secondary)]">
          {helperText}
        </p>
      ) : null}

      <div
        className={cn(
          "rounded-input border bg-[var(--color-surface)]",
          error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]",
          !disabled && "focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-accent)_15%,transparent)]",
          disabled && "cursor-not-allowed",
        )}
      >
        <div
          className="flex flex-wrap items-center gap-1 border-b border-[var(--color-border)] px-2 py-2"
          onKeyDown={handleToolbarKeyDown}
        >
          <div className="flex items-center gap-1">
            <ToolbarButton
              label="Bold"
              active={editor.isActive("bold")}
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Italic"
              active={editor.isActive("italic")}
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            {showInlineStyles ? (
              <>
                <ToolbarButton
                  label="Underline"
                  active={editor.isActive("underline")}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  label="Strikethrough"
                  active={editor.isActive("strike")}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                  <Strikethrough className="h-4 w-4" />
                </ToolbarButton>
              </>
            ) : null}
          </div>

          {isFull ? (
            <>
              <ToolbarDivider />
              <div className="flex items-center gap-1">
                <ToolbarButton
                  label="H2"
                  active={editor.isActive("heading", { level: 2 })}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  <span className="text-small font-semibold">H2</span>
                </ToolbarButton>
                <ToolbarButton
                  label="H3"
                  active={editor.isActive("heading", { level: 3 })}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                  <span className="text-small font-semibold">H3</span>
                </ToolbarButton>
                <ToolbarButton
                  label="Paragraph"
                  active={editor.isActive("paragraph")}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().setParagraph().run()}
                >
                  <span className="text-small font-semibold">P</span>
                </ToolbarButton>
              </div>
            </>
          ) : null}

          {toolbarVariant !== "minimal" ? (
            <>
              <ToolbarDivider />
              <div className="flex items-center gap-1">
                <ToolbarButton
                  label="Bullet list"
                  active={editor.isActive("bulletList")}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                  <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  label="Ordered list"
                  active={editor.isActive("orderedList")}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                  <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
              </div>
            </>
          ) : null}

          {showAlignment && isFull ? (
            <>
              <ToolbarDivider />
              <div className="flex items-center gap-1">
                <ToolbarButton
                  label="Align left"
                  active={editor.isActive({ textAlign: "left" })}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().setTextAlign("left").run()}
                >
                  <AlignLeft className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  label="Align center"
                  active={editor.isActive({ textAlign: "center" })}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().setTextAlign("center").run()}
                >
                  <AlignCenter className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  label="Align right"
                  active={editor.isActive({ textAlign: "right" })}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().setTextAlign("right").run()}
                >
                  <AlignRight className="h-4 w-4" />
                </ToolbarButton>
              </div>
            </>
          ) : null}

          {toolbarVariant !== "minimal" ? (
            <>
              <ToolbarDivider />
              <div className="relative flex items-center gap-1">
                <ToolbarButton
                  label="Link"
                  active={editor.isActive("link")}
                  disabled={disabled}
                  onClick={() => {
                    setLinkValue(editor.getAttributes("link").href ?? "");
                    setShowLinkInput((current) => !current);
                  }}
                >
                  <LinkIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  label="Highlight"
                  active={editor.isActive("highlight")}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                >
                  <Highlighter className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  label="Clear formatting"
                  disabled={disabled}
                  onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                >
                  <RemoveFormatting className="h-4 w-4" />
                </ToolbarButton>

                {showLinkInput ? (
                  <div className="absolute left-0 top-full z-10 mt-2 flex w-72 items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-card">
                    <input
                      value={linkValue}
                      onChange={(event) => setLinkValue(event.target.value)}
                      placeholder="Paste URL"
                      className="h-9 flex-1 rounded-sm border border-[var(--color-border)] px-3 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={submitLink}
                      className="inline-flex h-9 items-center rounded-sm bg-[var(--color-accent)] px-3 text-sm font-medium text-white"
                    >
                      Apply
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <EditorContent
          editor={editor}
          id={id}
          aria-label={label ?? placeholder}
          aria-describedby={describedBy}
          className={cn("tiptap-content px-4 py-4 outline-none", disabled && "cursor-not-allowed")}
          style={{ minHeight }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {error ? (
          <p id={errorId} className="inline-flex items-center gap-2 text-caption text-[var(--color-danger)]" role="alert">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        ) : (
          <span />
        )}

        {toolbarVariant !== "minimal" && typeof maxCharacters === "number" ? (
          <p className={cn("text-right text-small text-[var(--color-text-muted)]", countWarning && "text-[var(--color-danger)]")}>
            {characterCount} / {maxCharacters} characters
          </p>
        ) : null}
      </div>
    </div>
  );
}
