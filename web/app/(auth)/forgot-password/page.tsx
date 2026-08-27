"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import { forgotPassword } from "@/shared/lib/api/auth";
import { getApiErrorMessage } from "@/shared/lib/api/error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email is required");
      return;
    }

    try {
      setLoading(true);
      const response = await forgotPassword({ email });
      // The API is designed to always return a generic success message
      toast.success(response.message || "If an account with that email exists, we have sent a password reset link.");
      setEmail("");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to send reset link"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card-header">
        <h2 className="auth-card-title">Forgot Password</h2>
        <p className="auth-card-subtitle">Enter your email to receive reset instructions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">
            Email Address
          </Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <AppIcon name="mail" icon={Mail} size={16} />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="pl-10 h-11 rounded-xl bg-background/60 transition-all duration-200 border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              required
              disabled={loading}
            />
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
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send Reset Link</span>
              <AppIcon name="arrowRight" icon={ArrowRight} size={16} />
            </>
          )}
        </Button>
      </form>

      <p className="auth-card-footer-text">
        Remember your password?{" "}
        <Link href="/login" prefetch className="auth-card-footer-link">
          Back to Login
        </Link>
      </p>
    </>
  );
}
