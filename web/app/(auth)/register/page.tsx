"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff, User, Building2, Mail, Lock, ArrowRight } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";

import { registerUser, signInWithGoogle, openGoogleAuthPopup, fetchCurrentUser } from "@/shared/lib/api/auth";
import { parseApiErrors } from "@/shared/lib/api/error";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/components/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleLoadingText, setGoogleLoadingText] = useState("Continue with Google");
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Reset loading states on back navigation (bfcache)
  useEffect(() => {
    const handleResetLoading = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setGoogleLoading(false);
        setGoogleLoadingText("Continue with Google");
        setLoading(false);
      }
    };

    window.addEventListener("pageshow", handleResetLoading);

    return () => {
      window.removeEventListener("pageshow", handleResetLoading);
    };
  }, []);

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (generalError) setGeneralError(null);
  };

  /**
   * Synchronous click handler — opens popup immediately in the user gesture call stack
   */
  const handleGoogleLogin = () => {
    const popup = openGoogleAuthPopup();

    if (!popup) {
      toast.error("Google sign-in popup was blocked. Please allow popups for ClixProCRM and try again.");
      return;
    }

    setGoogleLoading(true);
    setGoogleLoadingText("Connecting to Google...");
    void startGoogleOAuth(popup);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startGoogleOAuth = async (popup: Window) => {
    try {
      setGoogleLoading(true);
      setGoogleLoadingText("Connecting to Google...");
      const result = await signInWithGoogle(popup);
      if (result?.success && !result?.redirected) {
        setGoogleLoadingText("Signing in...");
        if (typeof window !== "undefined") {
          localStorage.setItem("has_session", "1");
        }
        await refreshUser();
        try {
          const user = await fetchCurrentUser();
          if (user) {
            setGoogleLoadingText("Opening dashboard...");
            const isSuperAdmin =
              user.role?.toUpperCase() === "SUPER_ADMIN" ||
              user.role?.toUpperCase() === "SUPER ADMIN" ||
              (user as any)?.isSuperAdmin === true;
            if (isSuperAdmin) {
              router.replace("/super-admin");
            } else {
              router.replace("/dashboard");
            }
          } else {
            router.replace("/login");
            setGoogleLoading(false);
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          if (err?.message === "NEEDS_ONBOARDING") {
            setGoogleLoadingText("Opening onboarding...");
            router.replace("/onboarding");
          } else {
            setGoogleLoading(false);
            throw err;
          }
        }
      } else {
        setGoogleLoading(false);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setGoogleLoading(false);
      if (error?.message === "Google sign-in was cancelled.") {
        toast.info("Google sign-in was cancelled.");
      } else {
        toast.error(error.message || "Unable to sign in with Google.");
      }
    }
  };

  /**
   * Handles user registration
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      return;
    }

    try {
      setLoading(true);
      setFieldErrors({});
      setGeneralError(null);

      await registerUser({
        name,
        companyName,
        email,
        password,
      });

      toast.success("Account created successfully!");
      // Automatic login or onboarding redirect handled by auth state
      await refreshUser();
      router.push("/onboarding");
    } catch (error: unknown) {
      const { fieldErrors, generalError } = parseApiErrors(error, "Registration failed");
      setFieldErrors(fieldErrors);
      setGeneralError(generalError);

      setTimeout(() => {
        const firstErrorField = Object.keys(fieldErrors)[0];
        if (firstErrorField) {
          const el = document.getElementById(firstErrorField);
          if (el) el.focus();
        }
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card-header mb-5">
        <h2 className="auth-card-title">Create Account</h2>
        <p className="auth-card-subtitle">Start managing your sales today</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-3.5">
        {/* Row 1: Full Name & Company Name (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground/80">
              Full Name
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <AppIcon name="user" icon={User} size={16} />
              </div>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className={`pl-9.5 h-10 rounded-xl bg-background/60 text-sm transition-all duration-200 border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary ${
                  fieldErrors.name ? "border-destructive focus-visible:ring-destructive/20" : ""
                }`}
                value={name}
                onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                required
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs font-medium text-destructive mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-xs font-semibold text-foreground/80">
              Company Name
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <AppIcon name="companies" icon={Building2} size={16} />
              </div>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Corp"
                className={`pl-9.5 h-10 rounded-xl bg-background/60 text-sm transition-all duration-200 border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary ${
                  fieldErrors.companyName ? "border-destructive focus-visible:ring-destructive/20" : ""
                }`}
                value={companyName}
                onChange={(e) => { setCompanyName(e.target.value); clearFieldError("companyName"); }}
                required
              />
            </div>
            {fieldErrors.companyName && (
              <p className="text-xs font-medium text-destructive mt-1">{fieldErrors.companyName}</p>
            )}
          </div>
        </div>

        {/* Row 2: Email Address (Full Width) */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">
            Email Address
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <AppIcon name="mail" icon={Mail} size={16} />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              className={`pl-9.5 h-10 rounded-xl bg-background/60 text-sm transition-all duration-200 border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary ${
                fieldErrors.email ? "border-destructive focus-visible:ring-destructive/20" : ""
              }`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
              required
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs font-medium text-destructive mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Row 3: Password & Confirm Password (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground/80">
              Password
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <AppIcon name="lock" icon={Lock} size={16} />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 chars"
                className={`pl-9.5 pr-9 h-10 rounded-xl bg-background/60 text-sm transition-all duration-200 border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary ${
                  fieldErrors.password ? "border-destructive focus-visible:ring-destructive/20" : ""
                }`}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
              >
                {showPassword ? (
                  <AppIcon name="eyeOff" icon={EyeOff} size={15} />
                ) : (
                  <AppIcon name="eye" icon={Eye} size={15} />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs font-medium text-destructive mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/80">
              Confirm Password
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <AppIcon name="lock" icon={Lock} size={16} />
              </div>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                className={`pl-9.5 pr-9 h-10 rounded-xl bg-background/60 text-sm transition-all duration-200 border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary ${
                  fieldErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive/20" : ""
                }`}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
              >
                {showConfirmPassword ? (
                  <AppIcon name="eyeOff" icon={EyeOff} size={15} />
                ) : (
                  <AppIcon name="eye" icon={Eye} size={15} />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs font-medium text-destructive mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        {generalError && !fieldErrors.confirmPassword && !fieldErrors.password && (
          <p className="text-xs font-medium text-destructive mt-1">{generalError}</p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full h-10.5 rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <AppIcon name="arrowRight" icon={ArrowRight} size={16} />
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-2.5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/80" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
            <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google Button */}
        <Button
          type="button"
          variant="outline"
          disabled={loading || googleLoading}
          onClick={handleGoogleLogin}
          className="w-full h-10.5 rounded-xl flex items-center justify-center gap-2.5 font-medium border-border hover:bg-muted/40 transition-all duration-200 shadow-sm"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
              <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.58C14.73 18.24 13.47 18.66 12 18.66C9.16 18.66 6.75 16.74 5.88 14.18H2.21V17.03C4.01 20.61 7.7 23 12 23Z" fill="#34A853" />
              <path d="M5.88 14.18C5.66 13.52 5.53 12.78 5.53 12C5.53 11.22 5.66 10.48 5.88 9.82V6.97H2.21C1.46 8.46 1 10.18 1 12C1 13.82 1.46 15.54 2.21 17.03L5.88 14.18Z" fill="#FBBC05" />
              <path d="M12 5.34C13.62 5.34 15.06 5.89 16.2 6.98L19.36 3.82C17.45 2.03 14.96 1 12 1C7.7 1 4.01 3.39 2.21 6.97L5.88 9.82C6.75 7.26 9.16 5.34 12 5.34Z" fill="#EA4335" />
            </svg>
          )}
          <span className="text-foreground text-sm font-medium">
            {googleLoading ? googleLoadingText : "Continue with Google"}
          </span>
        </Button>
      </form>

      <p className="auth-card-footer-text !mt-4 !pt-3">
        Already have an account?{" "}
        <Link href="/login" prefetch className="auth-card-footer-link">
          Sign In
        </Link>
      </p>
    </>
  );
}
