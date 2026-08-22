"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { APP_INFO } from "@/lib/config/app-info";
import { useLanguage } from "@/components/i18n/language-provider";
import "./login.css";

const APPROVED_ASSET_REF = "3122092e9bc18acd696911aeb54eee7a3dcc26e2";
const APPROVED_ASSET_ROOT = `https://raw.githubusercontent.com/Yosseuf3/YOSSEUF--OS/${APPROVED_ASSET_REF}/brand/basoul/assets`;
const BASOUL_SYMBOL = `${APPROVED_ASSET_ROOT}/symbol/BASOUL_Symbol_Master.png`;
const BASOUL_WORDMARK = `${APPROVED_ASSET_ROOT}/wordmark/BASOUL_Wordmark_Master.png`;

export default function PasswordLoginPage() {
  const router = useRouter();
  const { locale, text } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const authMessage = (error: unknown) => {
    const raw = error instanceof Error ? error.message : String(error ?? "");
    const value = raw.toLowerCase();
    if (value.includes("invalid login credentials")) return text("البريد الإلكتروني أو كلمة المرور غير صحيحة.", "The email or password is incorrect.");
    if (value.includes("email not confirmed")) return text("البريد الإلكتروني غير مؤكد بعد.", "The email address has not been confirmed yet.");
    if (value.includes("rate limit")) return text("تمت محاولات كثيرة خلال فترة قصيرة. انتظر قليلًا ثم حاول مرة أخرى.", "Too many attempts in a short period. Wait a moment and try again.");
    if (value.includes("failed to fetch") || value.includes("network")) return text("تعذر الوصول إلى خدمة تسجيل الدخول. تحقق من الاتصال ثم أعد المحاولة.", "Unable to reach the sign-in service. Check your connection and try again.");
    return text("تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.", "Unable to sign in. Check your details and try again.");
  };

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/onboarding");
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.replace("/onboarding");
      router.refresh();
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="basoul-password-page" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="basoul-password-card" aria-labelledby="basoul-login-title">
        <div className="basoul-password-brand" aria-label="BASOUL approved identity">
          <img className="basoul-password-symbol" src={BASOUL_SYMBOL} width="70" height="84" alt="BASOUL symbol" />
          <span>AI-NATIVE ECOSYSTEM</span>
          <img className="basoul-password-wordmark" src={BASOUL_WORDMARK} width="260" height="68" alt="BASOUL" />
        </div>
        <div className="basoul-password-copy">
          <h1 id="basoul-login-title">{text("تسجيل الدخول", "Sign in")}</h1>
          <p>{text("استخدم بريدك وكلمة المرور للوصول إلى مساحة العمل.", "Use your email and password to access your workspace.")}</p>
        </div>
        <form onSubmit={submit} className="basoul-password-form">
          <label><span>{text("البريد الإلكتروني", "Email")}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" required /></label>
          <label><span>{text("كلمة المرور", "Password")}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required minLength={6} /></label>
          <div className="basoul-password-tools"><Link href="/forgot-password">{text("نسيت كلمة المرور؟", "Forgot password?")}</Link></div>
          <button type="submit" disabled={busy || !email.trim() || !password}>{busy ? text("جارٍ تسجيل الدخول…", "Signing in…") : text("تسجيل الدخول", "Sign in")}</button>
        </form>
        {message && <div className="basoul-password-error" role="alert">{message}</div>}
        <div className="basoul-auth-switch">
          <span>{text("مؤسسة جديدة على BASOUL؟", "New organization on BASOUL?")}</span>
          <a className="basoul-signup-cta" href="/signup">{text("إنشاء حساب جديد", "Create new account")}</a>
        </div>
        <small>{APP_INFO.fullLabel}</small>
      </section>
    </main>
  );
}
