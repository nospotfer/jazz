'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FlaskConical, Loader2, RefreshCcw, ShoppingCart, TriangleAlert } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';

type SandboxCourse = {
  id: string;
  title: string;
  price: number;
  firstLessonId: string | null;
  purchase: {
    providerReferenceId: string | null;
    finalPrice: number | null;
    createdAt: string | null;
  } | null;
};

interface LemonSandboxPanelProps {
  courses: SandboxCourse[];
  localTestCheckoutEnabled: boolean;
}

function isLocalSandboxHost() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

export function LemonSandboxPanel({ courses, localTestCheckoutEnabled }: LemonSandboxPanelProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? '');
  const [isSimulatingPurchase, setIsSimulatingPurchase] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const copy = {
    es: {
      eyebrow: 'QA checkout local',
      title: 'Lemon Sandbox',
      subtitle: 'Un solo panel para simular compra, limpiar estado y validar funcionalidades desbloqueadas después del pago.',
      enabled: 'Checkout local habilitado',
      disabled: 'Checkout local deshabilitado',
      localhostReady: 'Ejecutándose en localhost',
      localhostRequired: 'Este sandbox solo funciona en localhost.',
      setupHint: 'Activa ENABLE_LOCAL_TEST_CHECKOUT=1 en .env.local para usar el flujo sintético.',
      chooseCourse: 'Curso de prueba',
      noCourses: 'No hay cursos publicados disponibles para probar.',
      purchased: 'Comprado',
      notPurchased: 'Sin compra',
      simulatePurchase: 'Simular compra',
      resetPurchases: 'Limpiar compras de prueba',
      refreshing: 'Actualizar estado',
      quickLinks: 'Accesos rápidos después de comprar',
      dashboard: 'Dashboard',
      courses: 'Mis cursos',
      payments: 'Pagamentos',
      openCourse: 'Abrir curso',
      openLesson: 'Abrir primera aula',
      status: 'Estado actual',
      providerReference: 'Referencia',
      boughtAt: 'Comprado en',
      boughtFor: 'Valor',
      localFlowNote: 'La compra sintética usa la misma ruta /api/checkout y el mismo redirect de éxito del dashboard.',
      purchaseCreated: 'Compra de prueba creada. Redirigiendo al flujo de éxito...',
      resetDone: 'Estado de compras de prueba limpiado.',
      actionError: 'No fue posible completar esta acción.',
    },
    en: {
      eyebrow: 'Local checkout QA',
      title: 'Lemon Sandbox',
      subtitle: 'One panel to simulate purchases, clear state, and validate features unlocked after payment.',
      enabled: 'Local checkout enabled',
      disabled: 'Local checkout disabled',
      localhostReady: 'Running on localhost',
      localhostRequired: 'This sandbox only works on localhost.',
      setupHint: 'Set ENABLE_LOCAL_TEST_CHECKOUT=1 in .env.local to use the synthetic flow.',
      chooseCourse: 'Test course',
      noCourses: 'No published courses are available for testing.',
      purchased: 'Purchased',
      notPurchased: 'Not purchased',
      simulatePurchase: 'Simulate purchase',
      resetPurchases: 'Clear test purchases',
      refreshing: 'Refresh state',
      quickLinks: 'Quick links after purchase',
      dashboard: 'Dashboard',
      courses: 'My courses',
      payments: 'Payments',
      openCourse: 'Open course',
      openLesson: 'Open first lesson',
      status: 'Current state',
      providerReference: 'Reference',
      boughtAt: 'Purchased at',
      boughtFor: 'Amount',
      localFlowNote: 'The synthetic purchase uses the same /api/checkout route and the same dashboard success redirect.',
      purchaseCreated: 'Test purchase created. Redirecting into the success flow...',
      resetDone: 'Test purchase state cleared.',
      actionError: 'Unable to complete this action.',
    },
    fr: {
      eyebrow: 'QA checkout local',
      title: 'Lemon Sandbox',
      subtitle: 'Un seul panneau pour simuler un achat, nettoyer l’état et valider les fonctionnalités débloquées après paiement.',
      enabled: 'Checkout local activé',
      disabled: 'Checkout local désactivé',
      localhostReady: 'Exécuté sur localhost',
      localhostRequired: 'Ce sandbox fonctionne uniquement sur localhost.',
      setupHint: 'Définissez ENABLE_LOCAL_TEST_CHECKOUT=1 dans .env.local pour utiliser le flux synthétique.',
      chooseCourse: 'Cours de test',
      noCourses: 'Aucun cours publié disponible pour les tests.',
      purchased: 'Acheté',
      notPurchased: 'Non acheté',
      simulatePurchase: 'Simuler un achat',
      resetPurchases: 'Nettoyer les achats de test',
      refreshing: 'Actualiser l’état',
      quickLinks: 'Accès rapides après achat',
      dashboard: 'Dashboard',
      courses: 'Mes cours',
      payments: 'Paiements',
      openCourse: 'Ouvrir le cours',
      openLesson: 'Ouvrir la première leçon',
      status: 'État actuel',
      providerReference: 'Référence',
      boughtAt: 'Acheté le',
      boughtFor: 'Montant',
      localFlowNote: 'L’achat synthétique utilise la même route /api/checkout et la même redirection de succès du dashboard.',
      purchaseCreated: 'Achat de test créé. Redirection vers le flux de succès...',
      resetDone: 'État des achats de test nettoyé.',
      actionError: 'Impossible de terminer cette action.',
    },
    pt: {
      eyebrow: 'QA checkout local',
      title: 'Lemon Sandbox',
      subtitle: 'Um único painel para simular compra, limpar estado e validar funcionalidades liberadas depois do pagamento.',
      enabled: 'Checkout local habilitado',
      disabled: 'Checkout local desabilitado',
      localhostReady: 'Rodando em localhost',
      localhostRequired: 'Este sandbox só funciona em localhost.',
      setupHint: 'Ative ENABLE_LOCAL_TEST_CHECKOUT=1 no .env.local para usar o fluxo sintético.',
      chooseCourse: 'Curso de teste',
      noCourses: 'Não há cursos publicados disponíveis para teste.',
      purchased: 'Comprado',
      notPurchased: 'Sem compra',
      simulatePurchase: 'Simular compra',
      resetPurchases: 'Limpar compras de teste',
      refreshing: 'Atualizar estado',
      quickLinks: 'Atalhos pós-compra',
      dashboard: 'Dashboard',
      courses: 'Meus cursos',
      payments: 'Pagamentos',
      openCourse: 'Abrir curso',
      openLesson: 'Abrir primeira aula',
      status: 'Estado atual',
      providerReference: 'Referência',
      boughtAt: 'Comprado em',
      boughtFor: 'Valor',
      localFlowNote: 'A compra sintética usa a mesma rota /api/checkout e o mesmo redirect de sucesso do dashboard.',
      purchaseCreated: 'Compra de teste criada. Redirecionando para o fluxo de sucesso...',
      resetDone: 'Estado das compras de teste limpo.',
      actionError: 'Não foi possível concluir essa ação.',
    },
  }[language];

  const dateLocale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US';
  const isLocalhost = isLocalSandboxHost();
  const canRunSandbox = localTestCheckoutEnabled && isLocalhost;

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null,
    [courses, selectedCourseId]
  );

  const handleSimulatePurchase = async () => {
    if (!selectedCourse) return;

    try {
      setIsSimulatingPurchase(true);
      const response = await axios.post('/api/checkout', {
        courseId: selectedCourse.id,
        source: 'dashboard',
        language,
        paymentMethod: 'card',
      });

      if (response.data?.url) {
        toast.success(copy.purchaseCreated);
        window.location.assign(response.data.url);
        return;
      }

      throw new Error('Missing sandbox redirect URL');
    } catch {
      toast.error(copy.actionError);
    } finally {
      setIsSimulatingPurchase(false);
    }
  };

  const handleResetPurchases = async () => {
    try {
      setIsResetting(true);
      const response = await fetch('/api/dev/reset-test-purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Unable to reset purchases');
      }

      toast.success(copy.resetDone);
      router.refresh();
    } catch {
      toast.error(copy.actionError);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <section className="rounded-3xl border border-primary/25 bg-card/80 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">{copy.eyebrow}</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl font-serif font-bold text-foreground">{copy.title}</h1>
            <p className="text-sm leading-6 text-muted-foreground">{copy.subtitle}</p>
            <p className="text-xs text-muted-foreground">{copy.localFlowNote}</p>
          </div>

          <div className="grid gap-2 sm:min-w-72">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground">
              {localTestCheckoutEnabled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <TriangleAlert className="h-4 w-4 text-amber-500" />}
              <span>{localTestCheckoutEnabled ? copy.enabled : copy.disabled}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground">
              {isLocalhost ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <TriangleAlert className="h-4 w-4 text-amber-500" />}
              <span>{isLocalhost ? copy.localhostReady : copy.localhostRequired}</span>
            </div>
          </div>
        </div>
      </section>

      {!localTestCheckoutEnabled ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          {copy.setupHint}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{copy.chooseCourse}</h2>
          </div>

          {courses.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{copy.noCourses}</p>
          ) : (
            <>
              <label className="mt-4 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {copy.chooseCourse}
              </label>
              <select
                value={selectedCourse?.id ?? ''}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>

              {selectedCourse ? (
                <div className="mt-4 rounded-2xl border border-primary/15 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">{selectedCourse.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">€ {selectedCourse.price.toFixed(2)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedCourse.purchase ? 'bg-emerald-500/15 text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                      {selectedCourse.purchase ? copy.purchased : copy.notPurchased}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      onClick={() => void handleSimulatePurchase()}
                      disabled={!canRunSandbox || isSimulatingPurchase || Boolean(selectedCourse.purchase)}
                    >
                      {isSimulatingPurchase ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                      {copy.simulatePurchase}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleResetPurchases()}
                      disabled={!canRunSandbox || isResetting}
                    >
                      {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                      {copy.resetPurchases}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.refresh()}
                    >
                      {copy.refreshing}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{copy.status}</h3>
                {courses.map((course) => (
                  <div key={course.id} className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{course.title}</p>
                        {course.purchase?.providerReferenceId ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {copy.providerReference}: {course.purchase.providerReferenceId}
                          </p>
                        ) : null}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.purchase ? 'bg-emerald-500/15 text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                        {course.purchase ? copy.purchased : copy.notPurchased}
                      </span>
                    </div>

                    {course.purchase?.createdAt ? (
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>
                          {copy.boughtAt}: {new Date(course.purchase.createdAt).toLocaleString(dateLocale)}
                        </span>
                        {typeof course.purchase.finalPrice === 'number' ? (
                          <span>{copy.boughtFor}: € {course.purchase.finalPrice.toFixed(2)}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">{copy.quickLinks}</h2>
          <div className="mt-4 grid gap-3">
            <Link href="/dashboard" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary/40 hover:text-primary">
              {copy.dashboard}
            </Link>
            <Link href="/dashboard/courses" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary/40 hover:text-primary">
              {copy.courses}
            </Link>
            <Link href="/dashboard/payment" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary/40 hover:text-primary">
              {copy.payments}
            </Link>
            {selectedCourse ? (
              <Link href={`/courses/${selectedCourse.id}`} className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary/40 hover:text-primary">
                {copy.openCourse}
              </Link>
            ) : null}
            {selectedCourse?.firstLessonId ? (
              <Link href={`/courses/${selectedCourse.id}/lessons/${selectedCourse.firstLessonId}`} className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary/40 hover:text-primary">
                {copy.openLesson}
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}