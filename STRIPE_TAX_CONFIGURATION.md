# Configuration de la TVA et des paiements dans Stripe

## Vue d'ensemble

L'application supporte maintenant :
- ✅ TVA automatique à 20%
- ✅ Champ numéro de TVA **toujours visible** sur la page Stripe Checkout
- ✅ Apple Pay et Google Pay
- ✅ Affichage des prix TTC avec détail HT

## 🚀 Guide rapide

### Ce que voit l'utilisateur :

1. **Dans l'application** : Prix TTC affichés (39€ ou 49€) avec le prix HT en petit dessous
2. **Sur la page Stripe Checkout** :
   - Un champ "Numéro de TVA" est TOUJOURS disponible
   - Les entreprises peuvent le remplir, les particuliers peuvent l'ignorer
   - La TVA est calculée automatiquement
   - Apple Pay et Google Pay sont disponibles

### Comment ça fonctionne :

- **Particulier** : Ne remplit pas le champ TVA → paie le prix TTC avec 20% de TVA
- **Entreprise FR** : Remplit le numéro de TVA → paie le prix TTC avec 20% de TVA
- **Entreprise UE** : Remplit le numéro de TVA intra-UE → peut bénéficier de l'autoliquidation (TVA 0%)

## Configuration requise dans Stripe

### 1. Activer Stripe Tax

**Important** : Pour que la TVA soit calculée automatiquement, vous devez activer Stripe Tax.

#### Étapes :

1. Allez sur : https://dashboard.stripe.com/settings/tax
2. Cliquez sur "Activate Stripe Tax"
3. Configurez votre localisation d'entreprise
4. Ajoutez votre numéro de TVA intracommunautaire

#### Configuration pour la France :

- **Pays** : France
- **Taux de TVA standard** : 20%
- **Numéro de TVA** : FR + 11 chiffres (ex: FR12345678901)

### 2. Configurer les prix dans Stripe

Vos prix doivent être configurés **HORS TAXES** dans Stripe. La TVA sera calculée automatiquement.

#### Prix actuels à créer :

**Plan Starter :**
- Prix HT : 32.50 EUR / mois
- Prix TTC (avec TVA 20%) : 39.00 EUR / mois
- ID de prix : `price_1SSyMI14zZqoQtSCb1gqGhke`

**Plan Illimité :**
- Prix HT : 40.83 EUR / mois
- Prix TTC (avec TVA 20%) : 49.00 EUR / mois
- ID de prix : `price_1SSyNh14zZqoQtSCqPL9VwTj`

#### Comment créer un prix :

1. Allez sur : https://dashboard.stripe.com/products
2. Créez un produit ou modifiez un existant
3. Dans "Pricing", cliquez sur "Add another price"
4. **Prix** : Entrez le montant HT (ex: 32.50)
5. **Devise** : EUR
6. **Type** : Récurrent
7. **Période de facturation** : Mensuel
8. **Tax behavior** : "Exclusive" (le prix n'inclut pas la taxe)
9. Sauvegardez et copiez le Price ID

### 3. Activer Apple Pay et Google Pay

Apple Pay et Google Pay sont automatiquement disponibles si :

1. Votre domaine est vérifié dans Stripe
2. Vous utilisez HTTPS
3. Le navigateur/appareil supporte ces méthodes

#### Vérifier votre domaine :

1. Allez sur : https://dashboard.stripe.com/settings/payments
2. Section "Payment methods"
3. Activez "Apple Pay" et "Google Pay"
4. Ajoutez votre domaine dans "Apple Pay on the web domains"

### 4. Activer la collecte de numéro de TVA

Déjà configuré dans le code via :

```typescript
tax_id_collection: {
  enabled: true,
}
```

Cela permet aux entreprises de saisir leur numéro de TVA lors du paiement.

#### Types de numéros de TVA supportés :

- 🇫🇷 France : `eu_vat` (ex: FR12345678901)
- 🇪🇺 UE : Tous les pays de l'UE
- 🇬🇧 UK : `gb_vat`
- 🇨🇭 Suisse : `ch_vat`

### 5. Configuration du portail de facturation

Pour que les factures s'affichent correctement avec la TVA :

1. Allez sur : https://dashboard.stripe.com/test/settings/billing/portal
2. Activez "Customer portal"
3. Cochez "Show tax IDs"
4. Cochez "Allow customers to update their tax ID"

## Fonctionnement dans l'application

### Pour les particuliers (mode par défaut)

1. L'utilisateur voit les prix **TTC** avec la mention "TVA 20% incluse"
2. Lors du checkout, Stripe calcule automatiquement la TVA
3. La facture affiche le montant HT, la TVA, et le total TTC

### Page de paiement Stripe

1. Lors du checkout, Stripe calcule automatiquement la TVA
2. **Un champ "Numéro de TVA" est TOUJOURS disponible** pour les entreprises
3. Si l'utilisateur saisit un numéro de TVA valide et intra-UE, la TVA peut être à 0% (autoliquidation)
4. La facture affiche toujours le montant HT, la TVA, et le total TTC

## Calcul de la TVA

### TVA française (20%)

```
Prix HT    → Prix TTC
32.50 EUR  → 39.00 EUR  (32.50 × 1.20)
40.83 EUR  → 49.00 EUR  (40.83 × 1.20)
```

### Autoliquidation intra-UE

Pour les entreprises avec un numéro de TVA intracommunautaire valide :
- TVA = 0%
- Le client paie le prix HT uniquement
- Le client reverse lui-même la TVA dans son pays

## Configuration de l'Edge Function

L'Edge Function `stripe-checkout` est configurée pour :

```typescript
automatic_tax: {
  enabled: true,  // Active le calcul automatique de la TVA
}
tax_id_collection: {
  enabled: true,  // TOUJOURS activé - champ numéro de TVA toujours disponible
}
billing_address_collection: 'required',  // Requis pour la TVA
```

**Important** : Le champ de numéro de TVA est TOUJOURS affiché sur la page Stripe Checkout, peu importe si l'utilisateur est un particulier ou une entreprise. Cela simplifie l'expérience utilisateur.

## Test en mode Test

### Numéros de TVA de test :

Pour tester le paiement entreprise, utilisez ces numéros :

- **Valide** : `FR12345678901`
- **Invalide** : `FR00000000000`

### Cartes de test :

- **Succès** : `4242 4242 4242 4242`
- **Authentification 3D Secure** : `4000 0027 6000 3184`
- **Échec** : `4000 0000 0000 0002`

## Vérifications post-configuration

### Checklist :

- [ ] Stripe Tax activé
- [ ] Prix configurés en HT
- [ ] Tax behavior = "Exclusive"
- [ ] Apple Pay/Google Pay activés
- [ ] Domaine vérifié pour Apple Pay
- [ ] Portail client configuré
- [ ] Numéros de TVA testés

### Test complet :

1. **Test particulier** :
   - Cliquer sur "S'abonner" sur un plan
   - Vérifier que le prix affiché dans l'app est TTC (39€ ou 49€)
   - Sur la page Stripe, ne PAS remplir le champ numéro de TVA
   - Effectuer un paiement test
   - Vérifier la facture : doit afficher HT + TVA + TTC

2. **Test entreprise** :
   - Cliquer sur "S'abonner" sur un plan
   - Sur la page Stripe, remplir le champ "Numéro de TVA"
   - Effectuer un paiement test avec un numéro de TVA
   - Vérifier la facture : doit afficher le numéro de TVA et la TVA calculée (ou 0% si autoliquidation)

3. **Test Apple Pay** :
   - Ouvrir sur Safari (Mac ou iPhone)
   - Aller sur la page de checkout
   - Vérifier que le bouton Apple Pay s'affiche
   - Tester le paiement

## Dépannage

### La TVA ne s'applique pas

**Cause** : Stripe Tax n'est pas activé

**Solution** :
1. Allez sur https://dashboard.stripe.com/settings/tax
2. Activez Stripe Tax
3. Configurez votre localisation

### Apple Pay ne s'affiche pas

**Cause** : Domaine non vérifié ou navigateur non compatible

**Solution** :
1. Vérifiez le domaine dans Stripe
2. Utilisez Safari ou Chrome
3. Testez sur un appareil Apple

### Les prix affichés sont incorrects

**Cause** : Prix mal configurés dans Stripe

**Solution** :
1. Vérifiez que les prix sont en HT
2. Tax behavior doit être "Exclusive"
3. Mettez à jour les Price IDs dans le code

### Le numéro de TVA n'est pas demandé

**Cause** : `tax_id_collection` n'est pas activé

**Solution** :
1. Vérifiez que la checkbox "Paiement entreprise" est cochée
2. Vérifiez que l'Edge Function est déployée
3. Testez avec les logs de l'Edge Function

## Prix et conversions

### Tableau récapitulatif :

| Plan      | Prix HT  | TVA (20%) | Prix TTC |
|-----------|----------|-----------|----------|
| Starter   | 32.50 €  | 6.50 €    | 39.00 €  |
| Illimité  | 40.83 €  | 8.17 €    | 49.00 €  |

### Formules :

```
Prix TTC = Prix HT × 1.20
Prix HT = Prix TTC ÷ 1.20
TVA = Prix TTC - Prix HT
```

## Mise en production

Avant de passer en production :

1. ✅ Testez tous les scénarios en mode test
2. ✅ Vérifiez les factures générées
3. ✅ Activez Stripe Tax en production
4. ✅ Créez les prix en production
5. ✅ Mettez à jour les Price IDs dans le `.env`
6. ✅ Vérifiez le domaine pour Apple Pay
7. ✅ Testez avec de vraies cartes (en petits montants)

## Ressources

- [Stripe Tax Documentation](https://stripe.com/docs/tax)
- [Stripe Checkout avec Tax](https://stripe.com/docs/payments/checkout/taxes)
- [Apple Pay Configuration](https://stripe.com/docs/apple-pay)
- [Tax ID Collection](https://stripe.com/docs/tax/customer-tax-ids)
