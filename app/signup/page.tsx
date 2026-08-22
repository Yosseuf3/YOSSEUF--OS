"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { APP_INFO } from "@/lib/config/app-info";
import { useLanguage } from "@/components/i18n/language-provider";
import "../login/login.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

export default function SignupPage() {
  const router = useRouter();
  const { locale, text } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/onboarding");
    });
  }, [router]);

  function authMessage(cause: unknown) {
    const raw = cause instanceof Error ? cause.message : String(cause ?? "");
    const value = raw.toLowerCase();
    if (value.includes("already registered") || value.includes("already exists")) return text("يوجد حساب بهذا البريد بالفعل. استخدم تسجيل الدخول أو استعادة كلمة المرور.", "An account already exists for this email. Sign in or reset your password.");
    if (value.includes("password")) return text("كلمة المرور لا تحقق متطلبات الأمان المطلوبة.", "The password does not meet the required security rules.");
    if (value.includes("rate limit")) return text("تمت محاولات كثيرة خلال فترة قصيرة. انتظر قليلًا ثم حاول مرة أخرى.", "Too many attempts in a short period. Wait a moment and try again.");
    return text("تعذر إنشاء الحساب حاليًا. حاول مرة أخرى.", "Unable to create the account right now. Please try again.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError(text("كلمتا المرور غير متطابقتين.", "Passwords do not match."));
      return;
    }

    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({ email: normalizedEmail, password });
      if (signUpError) throw signUpError;

      if (data.session) {
        router.replace("/onboarding");
        router.refresh();
        return;
      }

      setSuccess(text(
        "إذا كان هذا بريداً جديداً، فتحقق من صندوق الوارد والرسائل غير المرغوب فيها لإكمال التأكيد. إذا كان لديك حساب بالفعل، استخدم تسجيل الدخول أو استعادة كلمة المرور. بعد الدخول، ستتم معالجة أي دعوة قائمة أولاً، وإلا ستبدأ إعداد مؤسستك.",
        "If this is a new email, check your inbox and spam folder to complete confirmation. If you already have an account, sign in or reset your password. After sign-in, any existing invitation is resolved first; otherwise you will start organization setup.",
      ));
      setPassword("");
      setConfirmPassword("");
    } catch (cause) {
      setError(authMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="basoul-password-card" aria-labelledby="basoul-signup-title">
        <div className="basoul-password-brand" aria-label="BASOUL approved identity">
          <img className="basoul-password-symbol" src={BASOUL_SYMBOL} width="70" height="84" alt="BASOUL symbol" />
          <span>AI-NATIVE ECOSYSTEM</span>
          <img className="basoul-password-wordmark" src={BASOUL_WORDMARK} width="260" height="68" alt="BASOUL" />
        </div>
        <div className="basoul-password-copy">
          <h1 id="basoul-signup-title">{text("إنشاء حساب", "Create account")}</h1>
          <p>{text("أنشئ هويتك في BASOUL. إنشاء المؤسسة خطوة مستقلة تتم بعد التحقق من الدعوات والعضويات.", "Create your BASOUL identity. Organization creation is a separate step after invitations and memberships are resolved.")}</p>
        </div>
        <form onSubmit={submit} className="basoul-password-form">
          <label><span>{text("البريد الإلكتروني", "Email")}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" required /></label>
          <label><span>{text("كلمة المرور", "Password")}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={8} /></label>
          <label><span>{text("تأكيد كلمة المرور", "Confirm password")}</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} /></label>
          <button type="submit" disabled={busy || !email.trim() || !password || !confirmPassword}>{busy ? text("جارٍ إنشاء الحساب…", "Creating account…") : text("إنشاء الحساب", "Create account")}</button>
        </form>
        {error ? <div className="basoul-password-error" role="alert">{error}</div> : null}
        {success ? <div className="basoul-password-success" role="status">{success}</div> : null}
        <div className="basoul-auth-switch">{text("لديك حساب بالفعل؟", "Already have an account?")} <Link className="basoul-password-link" href="/login">{text("تسجيل الدخول", "Sign in")}</Link></div>
        <small>{APP_INFO.fullLabel}</small>
      </section>
    </main>
  );
}
