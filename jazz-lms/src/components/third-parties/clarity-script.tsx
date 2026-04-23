'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

/**
 * Microsoft Clarity heatmap loader.
 *
 * Regras:
 * - So renderiza se `NEXT_PUBLIC_CLARITY_PROJECT_ID` estiver definido (fail-safe).
 * - NUNCA carrega em rotas `/admin/*` — heatmap é apenas para área pública
 *   (landing, cursos, dashboard aluno, auth). Evita gravação de PII de admins.
 */
export function ClarityScript() {
  const pathname = usePathname();
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!projectId) return null;
  if (pathname?.startsWith('/admin')) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
      `}
    </Script>
  );
}
