import 'server-only';
import { NextResponse } from 'next/server';

// Call after verified server authentication and before owner data/access work.
// This optional browser hint rejects stale intent; it never authorizes a user.
export function expectedUserConsistencyResponse(
  request: Request,
  verifiedUserId: string,
): NextResponse | null {
  const hints = new URL(request.url).searchParams.getAll('expectedUserId');
  if (hints.length === 0) return null;
  if (hints.length !== 1 || !hints[0].trim() || hints[0] !== verifiedUserId) {
    return NextResponse.json({ error: 'Session changed' }, { status: 409 });
  }
  return null;
}
