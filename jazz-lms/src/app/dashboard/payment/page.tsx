'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '@/components/providers/language-provider';

interface PurchaseRecord {
  id: string;
  itemType: 'Curso';
  itemTitle: string;
  amount: number;
  createdAt: string;
  currency: string;
}

export default function PaymentPage() {
  const { language } = useLanguage();
  const copy = {
    es: {
      itemTypeCourse: 'Curso',
      title: 'Historial de pagos',
      subtitle: 'Consulta tus registros de pago con fecha, hora e importe',
      records: 'Registros',
      noPurchasesTitle: 'Aún no hay compras',
      noPurchasesDesc: 'Tus registros de pago aparecerán aquí',
    },
    en: {
      itemTypeCourse: 'Course',
      title: 'Payment history',
      subtitle: 'Review your payment records with date, time, and amount',
      records: 'Records',
      noPurchasesTitle: 'No purchases yet',
      noPurchasesDesc: 'Your payment records will appear here',
    },
    fr: {
      itemTypeCourse: 'Cours',
      title: 'Historique des paiements',
      subtitle: 'Consultez vos paiements avec la date, l’heure et le montant',
      records: 'Enregistrements',
      noPurchasesTitle: 'Aucun achat pour le moment',
      noPurchasesDesc: 'Vos enregistrements de paiement apparaîtront ici',
    },
    pt: {
      itemTypeCourse: 'Curso',
      title: 'Histórico de pagamentos',
      subtitle: 'Consulte seus pagamentos com data, horário e valor',
      records: 'Registros',
      noPurchasesTitle: 'Ainda não há compras',
      noPurchasesDesc: 'Seus registros de pagamento aparecerão aqui',
    },
  }[language];
  const dateLocale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US';

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await axios.get('/api/purchases');
        setPurchases(res.data);
      } catch {
        // Silently fail — purchases are optional info
      } finally {
        setIsLoading(false);
      }
    };
    fetchPurchases();
  }, []);

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
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{copy.records}</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                  {purchase.currency === 'EUR' ? '€' : `${purchase.currency} `}
                  {purchase.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
