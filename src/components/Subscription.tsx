import { useState, useEffect } from 'react';
import { Crown, Calendar, CreditCard, Download, AlertCircle, CheckCircle, XCircle, Loader, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionProps {
  userId: string;
}

interface SubscriptionData {
  plan_type: 'starter' | 'unlimited';
  is_active: boolean;
  minutes_quota: number | null;
  minutes_used_this_month: number;
  billing_cycle_start: string;
  billing_cycle_end: string;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
}

interface StripeSubscription {
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: number;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export const Subscription = ({ userId }: SubscriptionProps) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [stripeSubscription, setStripeSubscription] = useState<StripeSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (subError) throw subError;
      setSubscription(subData);

      if (subData?.stripe_customer_id) {
        const { data: stripeData, error: stripeError } = await supabase
          .from('stripe_subscriptions')
          .select('status, cancel_at_period_end, current_period_end, payment_method_brand, payment_method_last4')
          .eq('customer_id', subData.stripe_customer_id)
          .maybeSingle();

        if (!stripeError && stripeData) {
          setStripeSubscription(stripeData);
        }
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError('Erreur lors du chargement de l\'abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-billing-portal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            return_url: `${window.location.origin}/#subscription`
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session de facturation');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors de l\'accès au portail de facturation');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-coral-500 mx-auto mb-2" />
          <p className="text-cocoa-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-cocoa-800 mb-2">Aucun abonnement</h3>
          <p className="text-cocoa-600 mb-4">
            Vous n'avez pas encore d'abonnement actif.
          </p>
        </div>
      </div>
    );
  }

  const planNames = {
    starter: 'Starter',
    unlimited: 'Illimité'
  };

  const planPrices = {
    starter: '39€',
    unlimited: '49€'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (!subscription.is_active) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
          <XCircle className="w-4 h-4" />
          Inactif
        </span>
      );
    }

    if (stripeSubscription?.cancel_at_period_end) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
          <AlertCircle className="w-4 h-4" />
          Annulation prévue
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
        <CheckCircle className="w-4 h-4" />
        Actif
      </span>
    );
  };

  const quotaPercentage = subscription.minutes_quota
    ? Math.min((subscription.minutes_used_this_month / subscription.minutes_quota) * 100, 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cocoa-800">Mon Abonnement</h1>
        {getStatusBadge()}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-coral-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-coral-500 to-sunset-500 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-cocoa-800">Plan actuel</h3>
              <p className="text-sm text-cocoa-600">Votre formule d'abonnement</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-gradient-to-r from-coral-500 to-sunset-500 bg-clip-text text-transparent">
                {planNames[subscription.plan_type]}
              </span>
              <span className="text-2xl text-cocoa-600">{planPrices[subscription.plan_type]}/mois</span>
            </div>

            {subscription.minutes_quota ? (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-cocoa-600">Minutes utilisées</span>
                  <span className="font-semibold text-cocoa-800">
                    {subscription.minutes_used_this_month} / {subscription.minutes_quota} min
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      quotaPercentage >= 90
                        ? 'bg-red-500'
                        : quotaPercentage >= 70
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${quotaPercentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-green-600 font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Minutes illimitées
              </p>
            )}
          </div>
        </div>

        <div className="bg-white border-2 border-coral-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-cocoa-800">Période de facturation</h3>
              <p className="text-sm text-cocoa-600">Dates de votre cycle</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-cocoa-600 mb-1">Début du cycle</p>
              <p className="font-semibold text-cocoa-800">
                {formatDate(subscription.billing_cycle_start)}
              </p>
            </div>

            <div>
              <p className="text-sm text-cocoa-600 mb-1">
                {stripeSubscription?.cancel_at_period_end ? 'Date d\'annulation' : 'Prochaine facturation'}
              </p>
              <p className="font-semibold text-cocoa-800">
                {formatDate(subscription.billing_cycle_end)}
              </p>
            </div>

            {stripeSubscription?.cancel_at_period_end && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-700">
                  Votre abonnement sera annulé à la fin de la période en cours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {stripeSubscription && (
        <div className="bg-white border-2 border-coral-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-cocoa-800">Moyen de paiement</h3>
              <p className="text-sm text-cocoa-600">Carte enregistrée</p>
            </div>
          </div>

          {stripeSubscription.payment_method_brand && stripeSubscription.payment_method_last4 ? (
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-gray-100 rounded-lg font-mono">
                {stripeSubscription.payment_method_brand.toUpperCase()} •••• {stripeSubscription.payment_method_last4}
              </div>
            </div>
          ) : (
            <p className="text-cocoa-600">Aucune carte enregistrée</p>
          )}
        </div>
      )}

      <div className="bg-gradient-to-r from-coral-50 to-sunset-50 border-2 border-coral-200 rounded-2xl p-6">
        <h3 className="font-bold text-cocoa-800 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Gestion de l'abonnement
        </h3>

        <p className="text-cocoa-600 mb-4">
          Gérez votre abonnement, téléchargez vos factures, mettez à jour votre moyen de paiement ou annulez votre abonnement depuis le portail Stripe.
        </p>

        <button
          onClick={handleManageBilling}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-coral-500 to-sunset-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Ouverture...</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5" />
              <span>Accéder au portail de facturation</span>
            </>
          )}
        </button>

        <p className="text-xs text-cocoa-500 mt-3">
          Vous serez redirigé vers le portail sécurisé Stripe pour gérer votre abonnement.
        </p>
      </div>
    </div>
  );
};
