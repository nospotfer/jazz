import { NextResponse } from 'next/server';

/**
 * Simulated purchase endpoint for localhost testing.
 * In production, this would be handled by the Stripe webhook after payment.
 * 
 * The backend controls which lessons are locked/unlocked.
 * This endpoint simulates a successful payment, returning
 * purchase confirmation that the frontend uses to unlock content.
 */
export async function POST(req: Request) {
  try {
    const { courseId } = await req.json();

    if (!courseId) {
      return new NextResponse('Course ID is required', { status: 400 });
    }

    // Simulate Stripe payment processing delay (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In production: verify Stripe payment, create Purchase record in DB
    // For localhost simulation, we just return success
    const purchaseRecord = {
      id: `purchase-${Date.now()}`,
      courseId,
      userId: 'simulated-user',
      status: 'completed',
      amount: 49.99,
      currency: 'EUR',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      purchase: purchaseRecord,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('[SIMULATE_PURCHASE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * GET endpoint to check purchase/lock status for a course.
 * Returns which lessons are accessible (backend-controlled).
 */
export async function GET() {
  try {
    // In production: check Purchase table for userId + courseId
    // For localhost: return status based on localStorage flag (sent as query param)
    return NextResponse.json({
      hasPurchased: false,
      freePreviewLessons: 1, // Only first lesson is free
    });
  } catch (error) {
    console.error('[PURCHASE_STATUS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
