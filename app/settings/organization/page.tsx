"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";
import { loadOrganizationProfileSettings, updateOrganizationProfileSettings } from "@/lib/organizations/settings";
import "../../login/login.css";

type GeographyCountry = { name: string; code: string; regions: string[] };

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const { locale, text } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
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

  const selectedCountry = useMemo(() => countries.find((item) => item.code === countryCode), [countries, countryCode]);
  const regions = selectedCountry?.regions ?? [];

  useEffect(() => {
    void (async () => {
      try {
        const settings = await loadOrganizationProfileSettings();
        if (!settings) { router.replace("/login"); return; }
        setOrganizationId(settings.organizationId);
        setOrganizationName(settings.organizationName);
        setOrganizationSlug(settings.organizationSlug);
        setLegalName(settings.legalName);
        setCountryCode(settings.countryCode || "SA");
        setRegion(settings.region);
        setCity(settings.city);
        setAddressLine(settings.addressLine);
        setPhone(settings.phone);
        setContactEmail(settings.contactEmail);
        setTaxNumber(settings.taxNumber);
      } catch (cause) {
        if (cause instanceof Error && cause.message === "ORGANIZATION_OWNER_REQUIRED") {
          setError(text("إعدادات المؤسسة متاحة لمالك المؤسسة فقط.", "Organization settings are available to the organization Owner only."));
        } else {
          setError(text("تعذر تحميل بيانات المؤسسة.", "Unable to load organization settings."));
        }
      } finally {
        setLoading(false);
      }
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
        setError(text("تعذر تحميل بيانات الدول حاليًا.", "Unable to load country data right now."));
      } finally {
        setGeographyBusy(false);
      }
    })();
  }, [text]);

  useEffect(() => {
    if (!selectedCountry) return;
    if (regions.length > 0 && !region) { setCities([]); return; }
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
    if (busy || !organizationId) return;
    setBusy(true); setMessage(""); setError("");
    try {
      await updateOrganizationProfileSettings({ organizationId, legalName, countryCode, region, city, addressLine, phone, contactEmail, taxNumber });
      setMessage(text("تم حفظ بيانات المؤسسة بنجاح.", "Organization settings saved successfully."));
    } catch {
      setError(text("تعذر حفظ بيانات المؤسسة. تحقق من صلاحيات المالك وحاول مرة أخرى.", "Unable to save organization settings. Verify Owner access and try again."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}><section className="basoul-password-card"><p>{text("جارٍ تحميل بيانات المؤسسة…", "Loading organization settings…")}</p></section></main>;

  return <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}>
    <section className="basoul-password-card" aria-labelledby="organization-settings-title">
      <div className="basoul-password-copy">
        <span>BASOUL · ORGANIZATION SETTINGS</span>
        <h1 id="organization-settings-title">{text("بيانات المؤسسة", "Organization settings")}</h1>
        <p>{text("إدارة البيانات القانونية والعنوانية للمؤسسة. هذه الصفحة متاحة للمالك فقط.", "Manage the organization's legal and address profile. This page is Owner-only.")}</p>
      </div>
      {organizationId ? <form onSubmit={submit} className="basoul-password-form">
        <label><span>{text("اسم المؤسسة", "Organization name")}</span><input value={organizationName} readOnly /></label>
        <label><span>{text("المعرّف", "Slug")}</span><input value={organizationSlug} readOnly /></label>
        <label><span>{text("الاسم القانوني", "Legal name")}</span><input value={legalName} onChange={(e) => setLegalName(e.target.value)} /></label>
        <label><span>{text("الدولة", "Country")}</span><select required value={countryCode} onChange={(e) => changeCountry(e.target.value)} disabled={geographyBusy || countries.length === 0}>{geographyBusy ? <option value={countryCode}>{text("جارٍ تحميل الدول…", "Loading countries…")}</option> : null}{countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
        <label><span>{text("المنطقة / الولاية / المحافظة", "Region / state / province")}</span><select value={region} onChange={(e) => changeRegion(e.target.value)} disabled={!selectedCountry || regions.length === 0}><option value="">{regions.length === 0 ? text("لا يوجد تقسيم إداري مطلوب", "No administrative division required") : text("اختر المنطقة", "Select region")}</option>{regions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span>{text("المدينة", "City")}</span><select value={city} onChange={(e) => setCity(e.target.value)} disabled={!selectedCountry || citiesBusy || (regions.length > 0 && !region)}><option value="">{citiesBusy ? text("جارٍ تحميل المدن…", "Loading cities…") : text("اختر المدينة", "Select city")}</option>{city && !cities.includes(city) ? <option value={city}>{city}</option> : null}{cities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span>{text("العنوان", "Address")}</span><input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></label>
        <label><span>{text("الهاتف", "Phone")}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <label><span>{text("بريد المؤسسة", "Organization email")}</span><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></label>
        <label><span>{text("الرقم الضريبي — اختياري", "Tax number — optional")}</span><input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} /></label>
        <button type="submit" disabled={busy || geographyBusy}>{busy ? text("جارٍ الحفظ…", "Saving…") : text("حفظ بيانات المؤسسة", "Save organization settings")}</button>
        <button type="button" className="basoul-secondary-button" onClick={() => router.replace("/")}>{text("العودة إلى BASOUL", "Back to BASOUL")}</button>
      </form> : null}
      {message ? <div className="basoul-password-success" role="status">{message}</div> : null}
      {error ? <div className="basoul-password-error" role="alert">{error}</div> : null}
    </section>
  </main>;
}
