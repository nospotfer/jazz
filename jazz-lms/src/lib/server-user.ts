import { cache } from 'react';

import { createClient } from '@/utils/supabase/server';

export const getServerUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
});