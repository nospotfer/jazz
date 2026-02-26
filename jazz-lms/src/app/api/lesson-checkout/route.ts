import { NextResponse } from 'next/server';

// Individual lesson purchases are no longer available.
// The course is sold as a complete package.
export async function POST() {
  return new NextResponse(
    'Individual lesson purchases are no longer available. Please purchase the full course.',
    { status: 410 }
  );
}
