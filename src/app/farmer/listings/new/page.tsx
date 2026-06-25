import { PageHeader } from "@/components/layout/page-header";
import { ListingForm } from "@/components/listings/listing-form";
import { createListing } from "@/server/actions/listings";
import { getCategories } from "@/server/db/queries";

export default async function NewListingPage() {
  const categories = await getCategories();

  return (
    <div style={{ maxWidth: "44rem" }}>
      <PageHeader title="New produce listing" subtitle="Post your harvest so buyers can find and contact you." />
      <div className="card">
        <ListingForm action={createListing} categories={categories} submitLabel="Publish listing" />
      </div>
    </div>
  );
}
