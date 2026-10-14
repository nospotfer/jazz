'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '@/components/providers/language-provider';
import { createClient } from '@/utils/supabase/client';

interface PurchaseRecord {
  id: string;
  itemType: 'Curso';
  itemTitle: string;
  amount: number | null;
  createdAt: string;
  currency: string;
}

function isPurchaseRecord(value: unknown): value is PurchaseRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && record.itemType === 'Curso' &&
    typeof record.itemTitle === 'string' && typeof record.currency === 'string' &&
    typeof record.createdAt === 'string' && Number.isFinite(Date.parse(record.createdAt)) &&
    (record.amount === null || (typeof record.amount === 'number' && Number.isFinite(record.amount)));
}

export default function PaymentPage() {
  const { language } = useLanguage();
  const copy = {
    es: {
      itemTypeCourse: 'Curso',
      title: 'Historial de pagos',
      subtitle: 'Consulta tus registros de pago con fecha, hora e importe',
      records: 'Registros',
      amountUnavailable: 'Importe no disponible',
      loadError: 'No se pudo cargar tu historial de pagos.',
      retry: 'Reintentar',
      loadingPayments: 'Cargando pagos...',
      noPurchasesTitle: 'Aún no hay compras',
      noPurchasesDesc: 'Tus registros de pago aparecerán aquí',
    },
    en: {
      itemTypeCourse: 'Course',
      title: 'Payment history',
      subtitle: 'Review your payment records with date, time, and amount',
      records: 'Records',
      amountUnavailable: 'Amount unavailable',
      loadError: 'Unable to load your payment history.',
      retry: 'Retry',
      loadingPayments: 'Loading payments...',
      noPurchasesTitle: 'No purchases yet',
      noPurchasesDesc: 'Your payment records will appear here',
    },
    fr: {
      itemTypeCourse: 'Cours',
      title: 'Historique des paiements',
      subtitle: 'Consultez vos paiements avec la date, l’heure et le montant',
      records: 'Enregistrements',
      amountUnavailable: 'Montant indisponible',
      loadError: 'Impossible de charger votre historique des paiements.',
      retry: 'Réessayer',
      loadingPayments: 'Chargement des paiements...',
      noPurchasesTitle: 'Aucun achat pour le moment',
      noPurchasesDesc: 'Vos enregistrements de paiement apparaîtront ici',
    },
    pt: {
      itemTypeCourse: 'Curso',
      title: 'Histórico de pagamentos',
      subtitle: 'Consulte seus pagamentos com data, horário e valor',
      records: 'Registros',
      amountUnavailable: 'Valor indisponível',
      loadError: 'Não foi possível carregar seu histórico de pagamentos.',
      retry: 'Tentar novamente',
      loadingPayments: 'Carregando pagamentos...',
      noPurchasesTitle: 'Ainda não há compras',
      noPurchasesDesc: 'Seus registros de pagamento aparecerão aqui',
    },
  }[language];
  const dateLocale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US';

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [owner, setOwner] = useState<{ id: string | null; epoch: number }>({ id: null, epoch: 0 });
  const ownerRef = useRef({ id: null as string | null, epoch: 0, resolved: false });
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const previous = ownerRef.current;
      // A delayed initial snapshot cannot replace a newer signed-in owner.
      if (event === 'INITIAL_SESSION' && previous.resolved) return;
      const id = session?.user.id ?? null;
      if (previous.resolved && previous.id === id) return;
      const current = { id, epoch: previous.epoch + 1, resolved: true };
      ownerRef.current = current;
      requestRef.current?.abort();
      setPurchases([]);
      setHasLoadError(id === null);
      setIsLoading(id !== null);
      setOwner({ id, epoch: current.epoch });
    });
    return () => {
      active = false;
      subscription.unsubscribe();
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!owner.id) return;
    let active = true;
    const controller = new AbortController();
    requestRef.current = controller;
    const isCurrent = () => active && !controller.signal.aborted &&
      ownerRef.current.id === owner.id && ownerRef.current.epoch === owner.epoch;
    const fetchPurchases = async () => {
      try {
        // The browser session is only a hint. The API verifies cookie-backed
        // identity before its database read and rejects a mismatching hint.
        const res = await axios.get('/api/purchases', {
          params: { expectedUserId: owner.id }, signal: controller.signal,
        });
        if (!isCurrent()) return;
        const records: unknown = res.data;
        if (!Array.isArray(records) || !records.every(isPurchaseRecord)) {
          throw new Error('Invalid payment history response');
        }
        setPurchases(records);
      } catch {
        if (isCurrent()) setHasLoadError(true);
      } finally {
        if (isCurrent()) setIsLoading(false);
      }
    };
    void fetchPurchases();
    return () => {
      active = false;
      controller.abort();
      if (requestRef.current === controller) requestRef.current = null;
    };
  }, [owner, retryAttempt]);

  const retry = () => {
    if (isLoading || !owner.id || ownerRef.current.epoch !== owner.epoch) return;
    setHasLoadError(false);
    setIsLoading(true);
    setRetryAttempt((attempt) => attempt + 1);
  };

  return (
    <div className="max-w-2xl mx-auto px-0.5 sm:px-0 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {copy.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {copy.subtitle}
        </p>
      </div>

      {/* Purchase History */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6" aria-busy={isLoading}>
        <h2 className="text-lg font-semibold text-foreground mb-4">{copy.records}</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-8" role="status" aria-label={copy.loadingPayments}>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : hasLoadError ? (
          <div className="space-y-3 py-8 text-center" role="alert">
            <p className="text-sm text-foreground">{copy.loadError}</p>
            <button type="button" onClick={retry} disabled={!owner.id}
              className="min-h-11 max-w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
              {copy.retry}
            </button>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">{copy.noPurchasesTitle}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {copy.noPurchasesDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-background border border-border rounded-lg p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {purchase.itemTitle}
                  </p>
                  <p className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                    <span>{copy.itemTypeCourse}</span>
                    <span>
                      {new Date(purchase.createdAt).toLocaleDateString(dateLocale)}
                    </span>
                    <span>
                      {new Date(purchase.createdAt).toLocaleTimeString(dateLocale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {purchase.amount === null ? copy.amountUnavailable : (
                    <>
                      {purchase.currency === 'EUR' ? '€' : `${purchase.currency} `}
                      {purchase.amount.toFixed(2)}
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
