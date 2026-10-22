'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// The prop comes from getUser on the server. Browser auth events only invalidate
// stale UI; they never authorize API access or select another account's drafts.
export function useNoteOwner(currentUserId: string) {
  const [sessionOwner, setSessionOwner] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      setSessionOwner(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  // A cached server render can describe a previous account. Do not mount any
  // draft-reading surface until the browser has resolved its initial session.
  return sessionOwner === undefined ? null : sessionOwner === currentUserId;
}
