export const PLAN_CODES = ["gift", "family"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const FEATURES = [
  "stories",
  "booklets",
  "memoir",
  "exports",
  "print-file",
  "print-checkout",
] as const;
export type Feature = (typeof FEATURES)[number];

const included: Record<PlanCode, readonly Feature[]> = {
  gift: ["stories", "booklets", "memoir", "exports", "print-file"],
  family: ["stories", "booklets", "memoir", "exports", "print-file", "print-checkout"],
};

/** Unknown values stay on the gift plan so a bad row cannot lock an account out. */
export function normalizePlan(value: string | null | undefined): PlanCode {
  return value === "family" ? "family" : "gift";
}

export function planAllows(plan: string | null | undefined, feature: Feature) {
  return included[normalizePlan(plan)].includes(feature);
}

export function billingStatus() {
  const enabled = process.env.STRIPE_BILLING_ENABLED === "true"
    && Boolean(process.env.STRIPE_SECRET_KEY)
    && Boolean(process.env.STRIPE_PRICE_FAMILY);
  return {
    enabled,
    reason: enabled ? "" : "billing-not-enabled",
    currency: "hkd",
  };
}

/**
 * Builds a Stripe Checkout Session body for a later subscription.
 * This version does not send it. Billing stays off unless every switch is set,
 * and even then the app route refuses to post.
 */
export function familyCheckoutRequest(user: { id: string; email: string }, origin: string) {
  const status = billingStatus();
  if (!status.enabled || !process.env.STRIPE_PRICE_FAMILY) {
    return { ready: false as const, reason: "billing-not-enabled" as const };
  }
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": process.env.STRIPE_PRICE_FAMILY,
    "line_items[0][quantity]": "1",
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${origin}/settings?billing=return`,
    cancel_url: `${origin}/settings?billing=cancel`,
    "metadata[userId]": user.id,
    "subscription_data[metadata][userId]": user.id,
  });
  return { ready: true as const, path: "checkout/sessions", body: body.toString() };
}
