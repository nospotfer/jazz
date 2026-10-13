'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';
import { AccessibleDialog } from '@/components/ui/accessible-dialog';
import { useAnalyticsConsent } from './use-analytics-consent';
import { isAnalyticsPathAllowed, readAnalyticsConsent } from '@/lib/analytics/consent';
import { clearOptionalAnalyticsStorage } from '@/lib/analytics/storage';

export function PrivacyControls() {
  const { language } = useLanguage();
  const pathname = usePathname();
  const consent = useAnalyticsConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [replay, setReplay] = useState(false);
  useEffect(() => {
    // Read the actual choice rather than the initial server snapshot, so an
    // existing affirmative choice is not cleared during hydration.
    clearOptionalAnalyticsStorage(readAnalyticsConsent());
  }, [consent.analytics, consent.replay]);
  const copy = {
    es: { title: 'Opciones de privacidad', description: 'Tú decides si permites estadísticas de uso y grabaciones de navegación en el inicio. Puedes cambiar tu elección en cualquier momento.', essential: 'Solo necesarias', accept: 'Permitir opcionales', customize: 'Personalizar', save: 'Guardar elección', close: 'Cerrar', reopen: 'Privacidad', analytics: 'Estadísticas y calidad de video', analyticsDescription: 'Mediciones de visitas y del funcionamiento del video.', replay: 'Grabaciones de navegación', replayDescription: 'Interacciones en el inicio para detectar problemas de uso. Los formularios y el contenido del video se ocultan.', blocked: 'Tu navegador ha solicitado desactivar las mediciones opcionales.' },
    en: { title: 'Privacy options', description: 'You choose whether to allow usage statistics and navigation recordings on the homepage. You can change your choice at any time.', essential: 'Necessary only', accept: 'Allow optional', customize: 'Customize', save: 'Save choice', close: 'Close', reopen: 'Privacy', analytics: 'Usage and video quality statistics', analyticsDescription: 'Measurements of visits and video performance.', replay: 'Navigation recordings', replayDescription: 'Homepage interactions to find usability problems. Forms and video content are hidden.', blocked: 'Your browser has requested that optional measurements be disabled.' },
    fr: { title: 'Options de confidentialité', description: 'Vous choisissez d’autoriser les statistiques d’utilisation et les enregistrements de navigation sur l’accueil. Vous pouvez modifier votre choix à tout moment.', essential: 'Nécessaires uniquement', accept: 'Autoriser les options', customize: 'Personnaliser', save: 'Enregistrer le choix', close: 'Fermer', reopen: 'Confidentialité', analytics: 'Statistiques et qualité vidéo', analyticsDescription: 'Mesures des visites et du fonctionnement vidéo.', replay: 'Enregistrements de navigation', replayDescription: 'Interactions sur l’accueil pour détecter les problèmes d’utilisation. Les formulaires et le contenu vidéo sont masqués.', blocked: 'Votre navigateur a demandé la désactivation des mesures facultatives.' },
    pt: { title: 'Opções de privacidade', description: 'Você decide se permite estatísticas de uso e gravações de navegação no início. Pode alterar sua escolha a qualquer momento.', essential: 'Somente necessárias', accept: 'Permitir opcionais', customize: 'Personalizar', save: 'Salvar escolha', close: 'Fechar', reopen: 'Privacidade', analytics: 'Estatísticas e qualidade do vídeo', analyticsDescription: 'Medições de visitas e do funcionamento do vídeo.', replay: 'Gravações de navegação', replayDescription: 'Interações no início para detectar problemas de uso. Os formulários e o conteúdo do vídeo são ocultados.', blocked: 'Seu navegador solicitou desativar as medições opcionais.' },
  }[language];
  const openSettings = () => {
    setAnalytics(consent.analytics);
    setReplay(consent.replay);
    setShowSettings(true);
  };
  const choose = (nextAnalytics: boolean, nextReplay: boolean) => {
    consent.setConsent({ analytics: nextAnalytics, replay: nextReplay });
    setShowSettings(false);
  };

  return <>
    {!consent.hasChoice && isAnalyticsPathAllowed(pathname) ? (
      <section aria-label={copy.title} className="fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-4xl rounded-xl border border-border bg-card p-4 text-foreground shadow-2xl sm:inset-x-6 sm:bottom-5 sm:p-5">
        <p className="text-base font-semibold">{copy.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{consent.blockedByPrivacySignal ? copy.blocked : copy.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button type="button" onClick={() => choose(false, false)} className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-accent sm:px-4">{copy.essential}</button>
          <button type="button" disabled={consent.blockedByPrivacySignal} onClick={() => choose(true, true)} className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50 sm:px-4">{copy.accept}</button>
          <button type="button" onClick={openSettings} className="col-span-2 min-h-11 rounded-lg border border-border bg-background px-4 text-sm font-semibold hover:bg-accent">{copy.customize}</button>
        </div>
      </section>
    ) : (
      <button type="button" onClick={openSettings} className="fixed bottom-3 left-3 z-40 min-h-11 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-md hover:bg-accent">{copy.reopen}</button>
    )}
    {showSettings && <AccessibleDialog label={copy.title} onClose={() => setShowSettings(false)} className="max-w-lg">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card p-4">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <button type="button" onClick={() => setShowSettings(false)} className="min-h-11 rounded-lg px-3 text-sm hover:bg-accent">{copy.close}</button>
      </div>
      <div className="space-y-5 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
        {consent.blockedByPrivacySignal && <p role="status" className="rounded-lg bg-muted p-3 text-sm">{copy.blocked}</p>}
        <label className="flex gap-3 rounded-lg border border-border p-4">
          <input type="checkbox" checked={analytics} onChange={event => setAnalytics(event.target.checked)} disabled={consent.blockedByPrivacySignal} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
          <span><span className="block text-sm font-semibold">{copy.analytics}</span><span className="mt-1 block text-sm text-muted-foreground">{copy.analyticsDescription}</span></span>
        </label>
        <label className="flex gap-3 rounded-lg border border-border p-4">
          <input type="checkbox" checked={replay} onChange={event => setReplay(event.target.checked)} disabled={consent.blockedByPrivacySignal} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
          <span><span className="block text-sm font-semibold">{copy.replay}</span><span className="mt-1 block text-sm text-muted-foreground">{copy.replayDescription}</span></span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => choose(false, false)} className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:bg-accent">{copy.essential}</button>
          <button type="button" onClick={() => choose(analytics, replay)} className="cta-highlight min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold">{copy.save}</button>
        </div>
      </div>
    </AccessibleDialog>}
  </>;
}
