'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Shield, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

interface PurchaseRecord {
  id: string;
  courseTitle: string;
  amount: number;
  date: string;
}

export default function PaymentPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

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

  const handleManagePayments = async () => {
    try {
      setIsPortalLoading(true);
      const res = await axios.post('/api/stripe-portal');
      window.location.assign(res.data.url);
    } catch {
      toast.error(
        'Unable to open payment portal. Please try again later.'
      );
      setIsPortalLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-0.5 sm:px-0 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Payment & Billing
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your payment methods and view purchase history
        </p>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
        <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Secure Payments
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your payment info is encrypted and processed securely via Stripe. We
            never store your full card number.
          </p>
        </div>
      </div>

      {/* Stripe Customer Portal */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Payment Methods
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your cards and billing details through our secure Stripe portal.
        </p>
        <Button
          onClick={handleManagePayments}
          disabled={isPortalLoading}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPortalLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Manage Payment Methods
        </Button>
      </div>

      {/* Purchase History */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Purchase History
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No purchases yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Your course purchases will appear here
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
                    {purchase.courseTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(purchase.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  €{purchase.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
