import { requireRole, getFullUser } from "@/server/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { FarmerProfileForm } from "./profile-form";
import type { farmerProfiles } from "@/server/db/schema";

type FarmerProfile = typeof farmerProfiles.$inferSelect;

export default async function FarmerProfilePage() {
  const user = await requireRole("farmer");
  const data = await getFullUser(Number(user.id));
  const profile = (data?.profile ?? null) as FarmerProfile | null;

  return (
    <div style={{ maxWidth: "40rem" }}>
      <PageHeader title="My profile" subtitle="Keep your details up to date so buyers can trust your listings." />
      <div className="card">
        <FarmerProfileForm
          defaults={{
            fullName: data?.user.fullName ?? "",
            phone: data?.user.phone ?? "",
            lga: profile?.lga,
            ward: profile?.ward,
            farmSizeHectares: profile?.farmSizeHectares,
            primaryCommodities: profile?.primaryCommodities,
            yearsExperience: profile?.yearsExperience,
          }}
        />
      </div>
    </div>
  );
}
