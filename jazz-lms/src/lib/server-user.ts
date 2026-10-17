import { cache } from 'react';

import { createClient } from '@/utils/supabase/server';

export const getServerUser = cache(async () => {
  const supabase = createClient();

  try {
    // Session cookies are client-controlled. Validate with Supabase before
    // using the user's identity for database queries or authorization.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return error ? null : user ?? null;
  } catch {
    // A validation failure must never fall back to the cookie's user object.
    return null;
  }
});
