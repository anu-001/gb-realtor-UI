import { ListingFormStep1 } from "./components/ListingFormStep1";

export default function EditListingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Edit Listing</h1>
        <p className="mt-2 text-body text-[var(--color-text-secondary)]">Update the listing details and description.</p>
      </div>
      <ListingFormStep1
        initialValues={{
          title: "Modern apartment in Lekki",
          description: "<p>Beautiful property with modern finishes and excellent light.</p>",
        }}
        submitLabel="Save Changes"
        onSubmit={async () => {
          return undefined;
        }}
      />
    </div>
  );
}
