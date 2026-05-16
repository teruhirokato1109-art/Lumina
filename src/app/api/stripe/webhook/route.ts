import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  async function updateSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.supabase_user_id;
    if (!userId) return;

    await supabase.from("profiles").update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status === "active" ? "active" : "free",
      subscription_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
    }).eq("id", userId);
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await updateSubscription(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (userId) {
        await supabase.from("profiles").update({
          subscription_status: "free",
          stripe_subscription_id: null,
          subscription_period_end: null,
        }).eq("id", userId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      await supabase.from("profiles").update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
