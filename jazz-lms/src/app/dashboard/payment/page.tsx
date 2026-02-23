'use client';

import { useState } from 'react';
import { CreditCard, Plus, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expMonth: number;
  expYear: number;
  brand: string;
  isDefault: boolean;
}

export default function PaymentPage() {
  const [cards] = useState<PaymentMethod[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'number') {
      // Format card number with spaces
      const cleaned = value.replace(/\D/g, '').substring(0, 16);
      const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
      setCardForm((prev) => ({ ...prev, number: formatted }));
      return;
    }

    if (name === 'expiry') {
      // Format expiry as MM/YY
      const cleaned = value.replace(/\D/g, '').substring(0, 4);
      if (cleaned.length >= 2) {
        setCardForm((prev) => ({
          ...prev,
          expiry: cleaned.substring(0, 2) + '/' + cleaned.substring(2),
        }));
      } else {
        setCardForm((prev) => ({ ...prev, expiry: cleaned }));
      }
      return;
    }

    if (name === 'cvc') {
      const cleaned = value.replace(/\D/g, '').substring(0, 4);
      setCardForm((prev) => ({ ...prev, cvc: cleaned }));
      return;
    }

    setCardForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would integrate with Stripe
    alert(
      'Payment integration with Stripe will process this card securely. This is a UI preview.'
    );
    setShowAddCard(false);
    setCardForm({ number: '', name: '', expiry: '', cvc: '' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Payment Methods
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your payment methods for course purchases
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

      {/* Saved Cards */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Saved Cards
        </h2>

        {cards.length === 0 && !showAddCard ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              No payment methods saved yet
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Add a card to make purchases easier
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between bg-background border border-border rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {card.brand} •••• {card.last4}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {card.expMonth}/{card.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {card.isDefault && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                      Default
                    </span>
                  )}
                  <button className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showAddCard ? (
          <Button
            onClick={() => setShowAddCard(true)}
            variant="outline"
            className="w-full mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Card
          </Button>
        ) : (
          <form onSubmit={handleAddCard} className="space-y-4 mt-4">
            <div className="bg-background border border-border rounded-lg p-4 space-y-4">
              <div>
                <label
                  htmlFor="number"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Card Number
                </label>
                <input
                  id="number"
                  name="number"
                  type="text"
                  value={cardForm.number}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Cardholder Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={cardForm.name}
                  onChange={handleChange}
                  placeholder="Name on card"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="expiry"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Expiry Date
                  </label>
                  <input
                    id="expiry"
                    name="expiry"
                    type="text"
                    value={cardForm.expiry}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="cvc"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    CVC
                  </label>
                  <input
                    id="cvc"
                    name="cvc"
                    type="text"
                    value={cardForm.cvc}
                    onChange={handleChange}
                    placeholder="123"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddCard(false);
                  setCardForm({ number: '', name: '', expiry: '', cvc: '' });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add Card
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
