"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createOwnedOrganization, resolveOrganizationAccess } from "@/lib/organizations/onboarding";
import { useLanguage } from "@/components/i18n/language-provider";
import "../login/login.css";

type GeographyCountry = { name: string; code: string; regions: string[] };

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const { locale, text } = useLanguage();
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [countries, setCountries] = useState<GeographyCountry[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [geographyBusy, setGeographyBusy] = useState(true);
  const [citiesBusy, setCitiesBusy] = useState(false);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCode),
    [countries, countryCode],
  );
  const regions = selectedCountry?.regions ?? [];

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace("/login"); return; }
      setContactEmail(data.session.user.email ?? "");
      try {
        const access = await resolveOrganizationAccess();
        if (access.kind === "member") { router.replace("/"); return; }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : text("تعذر التحقق من المؤسسة.", "Unable to verify organization access."));
      } finally { setChecking(false); }
    })();
  }, [router, text]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/geography?level=countries");
        if (!response.ok) throw new Error("geography unavailable");
        const payload = await response.json();
        setCountries(payload.countries ?? []);
      } catch {
        setError(text("تعذر تحميل بيانات الدول حاليًا. حاول مرة أخرى.", "Unable to load country data right now. Please try again."));
      } finally {
        setGeographyBusy(false);
      }
    })();
  }, [text]);

  useEffect(() => {
    setCities([]);
    setCity("");
    if (!selectedCountry) return;
    if (regions.length > 0 && !region) return;

    let cancelled = false;
    void (async () => {
      setCitiesBusy(true);
      try {
        const params = new URLSearchParams({ level: "cities", country: selectedCountry.name });
        if (region) params.set("region", region);
        const response = await fetch(`/api/geography?${params.toString()}`);
        if (!response.ok) throw new Error("cities unavailable");
        const payload = await response.json();
        if (!cancelled) setCities(payload.cities ?? []);
      } catch {
        if (!cancelled) setCities([]);
      } finally {
        if (!cancelled) setCitiesBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCountry, region, regions.length]);

  function changeCountry(nextCode: string) {
    setCountryCode(nextCode);
    setRegion("");
    setCity("");
    setCities([]);
  }

  function changeRegion(nextRegion: string) {
    setRegion(nextRegion);
    setCity("");
    setCities([]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await createOwnedOrganization({ name, legalName, countryCode, region, city, addressLine, phone, contactEmail, taxNumber });
      router.replace("/"); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text("تعذر إنشاء المؤسسة.", "Unable to create organization."));
    } finally { setBusy(false); }
  }

  if (checking) return <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}><section className="basoul-password-card"><p>{text("جارٍ التحقق من مساحة العمل…", "Checking workspace access…")}</p></section></main>;

  return <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}>
    <section className="basoul-password-card" aria-labelledby="organization-onboarding-title">
      <div className="basoul-password-copy">
        <span>BASOUL · ORGANIZATION</span>
        <h1 id="organization-onboarding-title">{text("إنشاء مؤسستك", "Create your organization")}</h1>
        <p>{text("ستصبح المالك الأول للمؤسسة. بيانات مؤسستك وبيانات فريقك ستبقى معزولة عن المؤسسات الأخرى.", "You will become the initial Owner. Your organization and team data remain isolated from every other organization.")}</p>
      </div>
      <form onSubmit={submit} className="basoul-password-form">
        <label><span>{text("اسم المؤسسة", "Organization name")}</span><input required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></label>
        <label><span>{text("الاسم القانوني", "Legal name")}</span><input value={legalName} onChange={(e) => setLegalName(e.target.value)} /></label>
        <label>
          <span>{text("الدولة", "Country")}</span>
          <select required value={countryCode} onChange={(e) => changeCountry(e.target.value)} disabled={geographyBusy || countries.length === 0}>
            {geographyBusy ? <option value="SA">{text("جارٍ تحميل الدول…", "Loading countries…")}</option> : null}
            {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </select>
        </label>
        <label>
          <span>{text("المنطقة / الولاية / المحافظة", "Region / state / province")}</span>
          <select value={region} onChange={(e) => changeRegion(e.target.value)} disabled={!selectedCountry || regions.length === 0}>
            <option value="">{regions.length === 0 ? text("لا يوجد تقسيم إداري مطلوب", "No administrative division required") : text("اختر المنطقة", "Select region")}</option>
            {regions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>{text("المدينة", "City")}</span>
          <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!selectedCountry || citiesBusy || (regions.length > 0 && !region)}>
            <option value="">{citiesBusy ? text("جارٍ تحميل المدن…", "Loading cities…") : text("اختر المدينة", "Select city")}</option>
            {cities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label><span>{text("العنوان", "Address")}</span><input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></label>
        <label><span>{text("الهاتف", "Phone")}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <label><span>{text("بريد المؤسسة", "Organization email")}</span><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></label>
        <label><span>{text("الرقم الضريبي — اختياري", "Tax number — optional")}</span><input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} /></label>
        <button type="submit" disabled={busy || geographyBusy || !name.trim() || countryCode.trim().length !== 2}>{busy ? text("جارٍ إنشاء المؤسسة…", "Creating organization…") : text("إنشاء المؤسسة والمتابعة", "Create organization and continue")}</button>
      </form>
      {error ? <div className="basoul-password-error" role="alert">{error}</div> : null}
    </section>
  </main>;
}
