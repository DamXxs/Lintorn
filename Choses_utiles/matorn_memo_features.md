# Matorn — Mémo features post-OR/Factures

## Priorité 1 — Finir les modules en cours
- Ordres de Réparation (OR) → 90% — finir
- Factures → 80% — finir
- Check architecture Django + React avant beta

---

## Priorité 2 — Système de notifications (sobre et ciblé)

### Stock — Workflow de commande automatique
- Déclencheur : passage sous le seuil de rupture au moment où une pièce est utilisée sur un OR ou une facture
- Action : modale qui s'ouvre avec avertissement rupture de stock
- Mail fournisseur pré-rempli (déjà en place) — l'utilisateur ajuste juste la quantité
- Valider → envoie le mail directement au fournisseur lié à la pièce

### Planning — Pulsation rouge sur RDV dépassé
- Déclencheur : statut = "confirmé" ou "clé récupérée" ET heure de début dépassée de +15 min ET pas encore passé en "en cours"
- Visuel : animation CSS pulse rouge sur le bloc du rendez-vous dans le planning
- + une notification dans la cloche cliquable → redirige vers la bonne semaine/jour

### Liaison OR ↔ Planning — Suggestion intelligente (pas automatique)
- Quand un OR passe en "en cours" → alerte discrète React : "Le RDV associé est toujours en statut X, voulez-vous le passer en cours ?"
- Un clic pour confirmer, un clic pour ignorer
- L'humain garde le contrôle — pas d'automatisation forcée

### Corbeille — Notification J-1
- Alerte dans la cloche 24h avant suppression définitive d'un élément en corbeille
- Simple, une ligne, cliquable vers la corbeille

---

## La cloche — centre de notification épuré
- Icône cloche en haut à droite
- Badge avec nombre de non-lues
- Liste déroulante — chaque notif cliquable redirige vers l'élément concerné
- Pas d'onglets, pas de catégories pour la beta — juste les alertes importantes
- Types : rupture stock / RDV dépassé / corbeille J-1

---

## Priorité 3 — Mails et SMS automatiques (après beta)
- Facture impayée depuis X jours → mail + SMS client
- Devis proche expiration → mail + SMS client
- Stack technique : Celery + Redis (scheduler Django) + Twilio (SMS)
- La base mail Django est déjà en place — juste brancher l'automatisme

---

## Déploiement — À préparer avant beta

### Architecture serveur Scalingo
- 1 app React (static hosting — gratuit ou quasi)
- 1 app Django par garage (environnements totalement séparés)
- Branches Git : `main` → Scalingo / `develop` → travail quotidien
- Release command Scalingo : `python manage.py migrate` au démarrage

### Icône PWA (rapide — 30 min)
- Fichier `manifest.json` dans React avec icône Matorn
- Permet d'ajouter l'app sur l'écran d'accueil iPhone/Android comme une vraie app

### Photos sur les OR
- Stockage S3-compatible (pas dans Django directement)
- Utile pour montrer au client l'état des pièces défectueuses
- Vidéos → plus tard

---

## Idées long terme (ne pas oublier)
- Outil de diagnostic IA intégré (après Matorn stable en prod)
- PWA complète
- Notifications push navigateur
- Serveurs propres (très long terme)
