"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import { resetPassword } from "@/shared/lib/api/auth";
import { getApiErrorMessage } from "@/shared/lib/api/error";

function ResetPasswordForm() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await resetPassword({ newPassword });
      toast.success(response.message || "Password has been successfully reset.");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* New Password */}
      <div className="space-y-1.5">
        <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground/80">
          New Password
        </Label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <AppIcon name="lock" icon={Lock} size={16} />
          </div>
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="pl-10 pr-10 h-11 rounded-xl bg-background/60 transition-all duration-200 border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
          >
            {showPassword ? (
              <AppIcon name="eyeOff" icon={EyeOff} size={16} />
            ) : (
              <AppIcon name="eye" icon={Eye} size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/80">
          Confirm Password
        </Label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <AppIcon name="lock" icon={Lock} size={16} />
          </div>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="pl-10 pr-10 h-11 rounded-xl bg-background/60 transition-all duration-200 border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
          >
            {showConfirmPassword ? (
              <AppIcon name="eyeOff" icon={EyeOff} size={16} />
            ) : (
              <AppIcon name="eye" icon={Eye} size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Submit */}
      <Button 
        type="submit" 
        disabled={loading}
        className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Resetting...</span>
          </>
        ) : (
          <>
            <span>Reset Password</span>
            <AppIcon name="arrowRight" icon={ArrowRight} size={16} />
          </>
        )}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <div className="auth-card-header">
        <h2 className="auth-card-title">Reset Password</h2>
        <p className="auth-card-subtitle">Create a new secure password for your account</p>
      </div>

      <Suspense fallback={<div className="flex justify-center p-4">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>

      <p className="auth-card-footer-text">
        Remembered your password?{" "}
        <Link href="/login" prefetch className="auth-card-footer-link">
          Back to Login
        </Link>
      </p>
    </>
  );
}
