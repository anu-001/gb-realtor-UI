import { Link } from "react-router-dom";
import { PropertyCreateForm } from "./components/PropertyCreateForm";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAppSelector } from "@/store";
import { canCreateListing } from "@/utils/agent-access";
import { resolveWorkspaceRole } from "@/utils/auth-role";

export default function AddListingPage() {
  const auth = useAppSelector((state) => state.auth);
  const role = resolveWorkspaceRole(auth.user, auth.accessToken) ?? auth.user?.role ?? auth.user?.roles?.[0]?.code ?? null;
  const allowed = canCreateListing(role);

  if (!allowed) {
    return (
      <EmptyState
        heading="Access denied"
        message="Your role does not allow creating listings."
        action={
          <Link
            to="/agent/listings"
            className="inline-flex h-11 items-center justify-center rounded-input bg-[var(--color-accent)] px-4 text-sm font-medium text-white"
          >
            Back to listings
          </Link>
        }
      />
    );
  }

  return <PropertyCreateForm />;
}
