import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { billingStatus, normalizePlan, planAllows } from "@/lib/billing/plans";
import { preparePrintCheckout } from "@/lib/print/catalog";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const billing = billingStatus();
  const printCheckout = preparePrintCheckout({ trim: "a5", cover: "hardcover", paper: "uncoated" });
  return NextResponse.json({
    plan: normalizePlan(user.plan),
    planStatus: user.planStatus || "active",
    billingEnabled: billing.enabled,
    exports: planAllows(user.plan, "exports"),
    printCheckout: {
      ready: printCheckout.ready,
      reason: planAllows(user.plan, "print-checkout") ? printCheckout.reason : "not-on-plan",
    },
  });
}
