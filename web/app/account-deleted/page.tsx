"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function AccountDeletedPage() {
  const router = useRouter();

  // Defensive session and cache cleanup on page load
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("has_session");
        localStorage.removeItem("orbit_token");
        localStorage.removeItem("orbit_user");
        localStorage.removeItem("orbit_currency");
        localStorage.removeItem("workspace_id");
        sessionStorage.clear();
        document.body.style.removeProperty("pointer-events");
        document.body.style.removeProperty("overflow");
      } catch {}

      try {
        const supabase = createClient();
        supabase.auth.signOut().catch(() => {});
      } catch {}
    }
  }, []);

  const handleBackToLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-primary/20">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-muted/40 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border/80 rounded-2xl p-8 sm:p-10 shadow-2xl relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 border border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Completed Permanently</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-3">
          Account Deleted
        </h1>

        {/* Primary Message */}
        <p className="text-sm font-medium text-foreground/90 leading-relaxed mb-2">
          Your account and workspace data have been permanently deleted.
        </p>

        {/* Secondary Message */}
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-8">
          You have been securely signed out. This data cannot be recovered.
        </p>

        {/* Action Button */}
        <Button
          id="back-to-login-btn"
          onClick={handleBackToLogin}
          className="w-full h-11 rounded-xl text-sm font-semibold gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <span>Back to Login</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        {/* Security Footer Note */}
        <div className="mt-8 pt-6 border-t border-border/60 w-full flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium">
          <span>ClixProCRM · Security & Compliance</span>
        </div>
      </div>
    </div>
  );
}
