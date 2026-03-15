'use client'

import { CreditCard } from "lucide-react";
import { font } from "@/lib/admin/constants";
import { EmptyState } from "@/components/ui/Card";

export default function BillingView() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: font.serif, fontSize: "1.65rem", color: "#e8edf5", letterSpacing: "-0.02em", fontWeight: 600 }}>Billing</div>
        <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "5px 0 0" }}>Manage your plan, seats, and invoices.</p>
      </div>
      <EmptyState
        Icon={CreditCard}
        title="Billing coming soon"
        body="You'll manage your plan, upgrade seats, and download invoices here. Powered by Stripe."
      />
    </div>
  );
}
