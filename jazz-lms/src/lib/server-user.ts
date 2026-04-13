import { cache } from 'react';

import { createClient } from '@/utils/supabase/server';

export const getServerUser = cache(async () => {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    return session.user;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
});