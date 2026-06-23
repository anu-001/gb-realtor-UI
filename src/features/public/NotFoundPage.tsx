import { Link } from "react-router-dom";
import { PlaceholderPage } from "@/components/feedback/PlaceholderPage";

export default function NotFoundPage() {
  return (
    <PlaceholderPage
      title="Page not found"
      description="This page does not exist."
      action={
        <Link className="text-sm font-semibold text-[var(--color-accent)]" to="/">
          Back to home
        </Link>
      }
    />
  );
}
