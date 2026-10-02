import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center shadow-elevated">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Access restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your current role does not have permission to open this module.
        </p>
        <Link href="/dashboard" className="mt-6 block">
          <Button className="w-full">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}












