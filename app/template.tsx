"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PUBLIC_AUTH_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/set-password",
]);

export default function BasoulSessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publicAuthPath = PUBLIC_AUTH_PATHS.has(pathname);
  const [ready, setReady] = useState(publicAuthPath);

  useEffect(() => {
    if (publicAuthPath) {
      setReady(true);
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        setReady(false);
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [publicAuthPath, router]);

  if (!ready) {
    return (
      <div className="center-screen" role="status" aria-live="polite">
        <div className="loader"><span>جارٍ تشغيل BASOUL…</span></div>
      </div>
    );
  }

  return children;
}
