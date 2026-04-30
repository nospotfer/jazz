'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  isOpenReplayEnabled,
  startTracker,
  stopTracker,
} from '@/lib/analytics/openreplay';

const EXCLUDED_PREFIXES = ['/admin', '/api'];

function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * OpenReplay provider — renders nothing.
 * - Inicializa o tracker apenas no cliente, quando habilitado por env.
 * - NÃO carrega em rotas /admin/* ou /api/*.
 * - Falha silenciosa: nenhum erro do OpenReplay deve impactar a UI.
 */
export function OpenReplayProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpenReplayEnabled()) return;

    if (isExcludedPath(pathname)) {
      // Caso o usuário tenha entrado primeiro em rota pública e navegado para /admin,
      // paramos o tracker (best effort).
      void stopTracker();
      return;
    }

    void startTracker();
  }, [pathname]);

  return null;
}
