import { supabase } from "@/lib/supabase";

export type OrganizationProfileSettings = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  legalName: string;
  countryCode: string;
  region: string;
  city: string;
  addressLine: string;
  phone: string;
  contactEmail: string;
  taxNumber: string;
};

export async function loadOrganizationProfileSettings(): Promise<OrganizationProfileSettings | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const session = sessionData.session;
  if (!session) return null;

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("organization_id,role,organizations(id,name,slug)")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .limit(1);
  if (membershipError) throw membershipError;

  const membership = memberships?.[0] as unknown as {
    organization_id: string;
    role: string;
    organizations: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
  } | undefined;
  if (!membership) return null;
  if (membership.role !== "owner") throw new Error("ORGANIZATION_OWNER_REQUIRED");

  const organization = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;
  if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");

  const { data: profile, error: profileError } = await supabase
    .from("organization_profiles")
    .select("legal_name,country_code,region,city,address_line,phone,contact_email,tax_number")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();
  if (profileError) throw profileError;

  return {
    organizationId: membership.organization_id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    legalName: profile?.legal_name ?? "",
    countryCode: profile?.country_code ?? "SA",
    region: profile?.region ?? "",
    city: profile?.city ?? "",
    addressLine: profile?.address_line ?? "",
    phone: profile?.phone ?? "",
    contactEmail: profile?.contact_email ?? session.user.email ?? "",
    taxNumber: profile?.tax_number ?? "",
  };
}

export async function updateOrganizationProfileSettings(input: Omit<OrganizationProfileSettings, "organizationName" | "organizationSlug">) {
  const { error } = await supabase
    .from("organization_profiles")
    .update({
      legal_name: input.legalName.trim() || null,
      country_code: input.countryCode.trim().toUpperCase(),
      region: input.region.trim() || null,
      city: input.city.trim() || null,
      address_line: input.addressLine.trim() || null,
      phone: input.phone.trim() || null,
      contact_email: input.contactEmail.trim().toLowerCase() || null,
      tax_number: input.taxNumber.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", input.organizationId);
  if (error) throw error;
}
