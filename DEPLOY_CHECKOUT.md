# Guide de déploiement du nouveau Checkout

## Modifications apportées

### Edge Function `stripe-checkout`
- ✅ TVA automatique activée (`automatic_tax: true`)
- ✅ Collecte du numéro de TVA activée PAR DÉFAUT (`tax_id_collection: true`)
- ✅ Collecte de l'adresse obligatoire
- ✅ Collecte du téléphone activée
- ✅ Support Apple Pay et Google Pay

### Interface utilisateur
- ✅ Affichage des prix TTC (39€ et 49€)
- ✅ Affichage des prix HT en petit (32.50€ et 40.83€)
- ✅ Information sur la TVA à 20%
- ✅ Mention du support Apple Pay et Google Pay
- ✅ Information claire que le numéro de TVA peut être ajouté sur la page Stripe

## Étapes de déploiement

### 1. Déployer l'Edge Function mise à jour

```bash
npx supabase functions deploy stripe-checkout
```

### 2. Configurer Stripe Tax

⚠️ **OBLIGATOIRE** pour que la TVA fonctionne

1. Allez sur : https://dashboard.stripe.com/settings/tax
2. Cliquez sur "Activate Stripe Tax"
3. Configurez votre entreprise :
   - **Pays** : France
   - **Adresse** : Votre adresse d'entreprise
   - **Numéro de TVA** : FR + 11 chiffres
4. Sauvegardez

### 3. Vérifier/Créer les prix en mode Test

Les prix doivent être configurés **HORS TAXES (HT)** :

**Plan Starter :**
- Prix : 32.50 EUR / mois
- Tax behavior : **Exclusive** (important !)
- Créer sur : https://dashboard.stripe.com/test/products

**Plan Illimité :**
- Prix : 40.83 EUR / mois
- Tax behavior : **Exclusive** (important !)

### 4. Activer Apple Pay (optionnel mais recommandé)

1. Allez sur : https://dashboard.stripe.com/settings/payments
2. Dans "Payment methods", activez "Apple Pay"
3. Ajoutez votre domaine dans "Apple Pay domains"
4. Vérifiez le domaine

### 5. Tester en mode Test

#### Test 1 : Paiement particulier
```
1. Cliquer sur "S'abonner" à un plan
2. Sur Stripe Checkout, ne PAS remplir le champ numéro de TVA
3. Utiliser la carte test : 4242 4242 4242 4242
4. Vérifier la facture : doit afficher HT + TVA (20%) + TTC
```

#### Test 2 : Paiement entreprise
```
1. Cliquer sur "S'abonner" à un plan
2. Sur Stripe Checkout, remplir "Numéro de TVA" : FR12345678901
3. Utiliser la carte test : 4242 4242 4242 4242
4. Vérifier la facture : doit afficher le numéro de TVA
```

#### Test 3 : Apple Pay
```
1. Ouvrir sur Safari (Mac ou iPhone)
2. Cliquer sur "S'abonner"
3. Vérifier que le bouton Apple Pay apparaît
4. Tester le paiement
```

### 6. Passer en production

Une fois tous les tests validés :

1. **Activer Stripe Tax en production**
   - https://dashboard.stripe.com/settings/tax

2. **Créer les prix en production**
   - Mêmes prix HT que en test
   - Tax behavior : Exclusive

3. **Mettre à jour les Price IDs dans le code**
   - Fichier : `src/components/SubscriptionSelection.tsx`
   - Ligne 31-32 : Remplacer par vos Price IDs production

4. **Déployer la nouvelle version**
   ```bash
   npm run build
   # Puis déployez sur votre hébergement
   ```

5. **Vérifier Apple Pay en production**
   - Domaine production vérifié dans Stripe

## Checklist finale

Avant de passer en production :

- [ ] Edge Function `stripe-checkout` déployée
- [ ] Stripe Tax activé en test ET production
- [ ] Prix créés avec "Tax behavior: Exclusive"
- [ ] Tests effectués en mode test (particulier, entreprise, Apple Pay)
- [ ] Price IDs production mis à jour dans le code
- [ ] Application buildée et déployée
- [ ] Domaine vérifié pour Apple Pay
- [ ] Test final en production avec vraie carte (petit montant)

## Vérifications post-déploiement

### Dans l'application
- [ ] Prix TTC affichés correctement (39€ et 49€)
- [ ] Prix HT affichés en dessous
- [ ] Information sur Apple Pay visible

### Sur Stripe Checkout
- [ ] Champ "Numéro de TVA" visible
- [ ] TVA calculée automatiquement
- [ ] Apple Pay disponible (sur appareil compatible)
- [ ] Adresse et téléphone demandés

### Factures
- [ ] Affichage du montant HT
- [ ] Affichage de la TVA (20%)
- [ ] Affichage du total TTC
- [ ] Numéro de TVA présent si renseigné

## Support

En cas de problème :

1. **La TVA n'est pas calculée**
   - Vérifier que Stripe Tax est activé
   - Vérifier que les prix ont "Tax behavior: Exclusive"

2. **Le champ TVA n'apparaît pas**
   - Vérifier que l'Edge Function est déployée
   - Vérifier les logs : `npx supabase functions logs stripe-checkout`

3. **Apple Pay ne s'affiche pas**
   - Vérifier le domaine dans Stripe
   - Tester sur Safari uniquement
   - Vérifier la console navigateur

4. **Les prix affichés sont incorrects**
   - Vérifier les Price IDs dans le code
   - Vérifier que les prix Stripe sont bien en HT

## Notes importantes

⚠️ **Stripe Tax est obligatoire** pour que la TVA soit calculée automatiquement. Sans Stripe Tax, la TVA ne sera PAS appliquée.

⚠️ **Les prix DOIVENT être en HT** avec "Tax behavior: Exclusive". Si les prix sont en TTC, la TVA sera appliquée en plus, ce qui donnera un prix incorrect.

⚠️ **Le numéro de TVA est optionnel**. Les particuliers peuvent l'ignorer. Seules les entreprises doivent le remplir.

✅ **Apple Pay et Google Pay** sont automatiquement disponibles si le navigateur/appareil le supporte. Aucune action nécessaire côté utilisateur.

## Résumé des prix

| Plan      | Prix HT (Stripe) | TVA 20% | Prix TTC (affiché) |
|-----------|------------------|---------|---------------------|
| Starter   | 32.50 €          | 6.50 €  | 39.00 €             |
| Illimité  | 40.83 €          | 8.17 €  | 49.00 €             |

## Liens utiles

- [Stripe Tax](https://dashboard.stripe.com/settings/tax)
- [Stripe Products](https://dashboard.stripe.com/products)
- [Stripe Payment Methods](https://dashboard.stripe.com/settings/payments)
- [Documentation complète](./STRIPE_TAX_CONFIGURATION.md)
