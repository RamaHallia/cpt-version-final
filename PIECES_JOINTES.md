# 📎 Guide des Pièces Jointes par Méthode d'Envoi

## ✅ Mon compte Gmail

**Support : OUI - Vraies pièces jointes**

Les fichiers sont envoyés en tant que **vraies pièces jointes** (attachments) dans l'email.

- ✅ Le destinataire reçoit les fichiers directement attachés à l'email
- ✅ Peut télécharger les fichiers depuis Gmail/Outlook/etc.
- ✅ Aucun lien externe nécessaire
- ✅ Fonctionne même si les liens expirent

**Taille limite :** 25 MB par email (limite Gmail)

---

## ✅ Autre messagerie (SMTP)

**Support : OUI - Vraies pièces jointes** (✨ **NOUVELLEMENT AJOUTÉ**)

Les fichiers sont maintenant envoyés en tant que **vraies pièces jointes** via SMTP.

- ✅ Le destinataire reçoit les fichiers directement attachés à l'email
- ✅ Peut télécharger les fichiers depuis n'importe quel client email
- ✅ Aucun lien externe nécessaire
- ✅ Fonctionne avec Outlook, Yahoo Mail, etc.

**Taille limite :** Dépend de votre serveur SMTP (généralement 10-25 MB)

---

## ❌ Mon application email (Client local)

**Support : NON - Uniquement liens cliquables**

⚠️ **Limitation technique :** Le protocole `mailto:` ne supporte **pas** l'envoi de pièces jointes.

**Ce qui se passe :**
1. Votre application email (Outlook, Thunderbird, etc.) s'ouvre
2. L'email est pré-rempli avec le contenu et des **liens cliquables** vers les fichiers
3. Vous devez **manuellement** joindre les fichiers si vous le souhaitez

**Pourquoi ?**
- C'est une limitation du protocole `mailto:` qui ne peut pas transférer de fichiers
- Tous les logiciels fonctionnent ainsi (ce n'est pas un bug)

**Recommandation :**
Utilisez **"Mon compte Gmail"** ou **"Autre messagerie"** pour envoyer de vraies pièces jointes.

---

## 📊 Tableau Récapitulatif

| Méthode | Vraies PJ | Liens cliquables | Recommandé |
|---------|-----------|------------------|------------|
| **Mon compte Gmail** | ✅ Oui | ✅ Oui (optionnel) | ⭐⭐⭐ |
| **Autre messagerie (SMTP)** | ✅ Oui | ✅ Oui (optionnel) | ⭐⭐⭐ |
| **Mon application email** | ❌ Non | ✅ Oui (obligatoire) | ⭐ |

---

## 🚀 Comment Ça Marche Maintenant

### Pour Gmail et SMTP :
1. Vous ajoutez des pièces jointes dans l'éditeur email
2. Les fichiers sont **automatiquement convertis en base64**
3. Ils sont envoyés comme **vraies pièces jointes** dans l'email
4. Le destinataire les reçoit directement dans sa boîte mail

### Pour Client Email Local :
1. Vous ajoutez des pièces jointes dans l'éditeur email
2. Des **liens cliquables** sont ajoutés dans le corps de l'email
3. Votre application s'ouvre avec le contenu
4. Vous devez manuellement joindre les fichiers si nécessaire

---

## 💡 Astuce

Pour garantir que vos destinataires reçoivent **toujours** les fichiers en pièces jointes, utilisez :
- ✅ **Mon compte Gmail** (le plus simple)
- ✅ **Autre messagerie** avec votre SMTP professionnel

Évitez **Mon application email** si les pièces jointes sont importantes.
