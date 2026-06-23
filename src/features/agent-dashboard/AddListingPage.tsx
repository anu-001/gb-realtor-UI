import { ListingFormStep1 } from "./components/ListingFormStep1";

export default function AddListingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h2 text-[var(--color-text-primary)]">Add Listing</h1>
        <p className="mt-2 text-body text-[var(--color-text-secondary)]">Start with the core property details.</p>
      </div>
      <ListingFormStep1
        submitLabel="Continue"
        onSubmit={async () => {
          return undefined;
        }}
      />
    </div>
  );
}
