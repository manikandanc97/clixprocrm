"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SupportTicketRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/support/tickets/${id}`);
    } else {
      router.replace("/support");
    }
  }, [id, router]);

  return null;
}
