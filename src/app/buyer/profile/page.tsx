import { requireRole, getFullUser } from "@/server/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { BuyerProfileForm } from "./profile-form";
import type { buyerProfiles } from "@/server/db/schema";

type BuyerProfile = typeof buyerProfiles.$inferSelect;

export default async function BuyerProfilePage() {
  const user = await requireRole("buyer");
  const data = await getFullUser(Number(user.id));
  const profile = (data?.profile ?? null) as BuyerProfile | null;

  return (
    <div style={{ maxWidth: "40rem" }}>
      <PageHeader title="My profile" subtitle="Tell farmers about your business and what you buy." />
      <div className="card">
        <BuyerProfileForm
          defaults={{
            fullName: data?.user.fullName ?? "",
            phone: data?.user.phone ?? "",
            businessName: profile?.businessName,
            businessType: profile?.businessType,
            deliveryAddress: profile?.deliveryAddress,
            preferredCommodities: profile?.preferredCommodities,
          }}
        />
      </div>
    </div>
  );
}
