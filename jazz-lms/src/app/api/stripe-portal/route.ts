import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Look up or retrieve Stripe customer ID
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    let stripeCustomerId: string | undefined;

    // Search for existing Stripe customer by email
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    });

    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
    } else {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        name: dbUser?.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'https://culturadeljazz.com';

    // Create a Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/dashboard/payment`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.log('[STRIPE_PORTAL_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
