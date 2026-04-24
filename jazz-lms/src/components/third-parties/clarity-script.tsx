'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';


const DEFAULT_CLARITY_PROJECT_ID = 'wgmaqx3k1n';

export function ClarityScript() {
  const pathname = usePathname();
  const projectId =
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || DEFAULT_CLARITY_PROJECT_ID;

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
