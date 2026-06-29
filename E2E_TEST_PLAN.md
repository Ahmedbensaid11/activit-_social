# Plan de Validation Bout-en-Bout (E2E)

Ce document décrit le plan de test manuel pour valider l'intégration de toutes les fonctionnalités des Sprints 1 à 8.

---

## 🛠️ Scénario de Test Principal

### Étape 1 : Création du Type d'Activité (Admin)
1. Se connecter avec un compte administrateur (`admin@tunisietelecom.tn`).
2. Accéder à l'onglet **Types d'activités** via la barre de navigation latérale.
3. Cliquer sur **Créer un type**.
4. Définir le nom (ex: "Excursion"), renseigner les champs personnalisés dynamiques (ex: "Nombre de nuits", "Options transport") et enregistrer.
5. *Vérification :* Le nouveau type d'activité apparaît dans la liste. Le journal d'audit (`/admin/audit`) a enregistré l'action `ACTIVITY_TYPE_CREATE`.

### Étape 2 : Création de l'Activité (Admin)
1. Accéder à l'onglet **Gérer Activités**.
2. Cliquer sur **Créer une activité**.
3. Remplir le formulaire (Sélectionner le type créé, titre "Excursion Djerba", description, lieu, date, capacité max, etc.).
4. Enregistrer.
5. *Vérification :* L'activité apparaît dans le tableau de gestion. L'action `ACTIVITY_CREATE` est présente dans le journal d'audit.

### Étape 3 : Inscription (Employé)
1. Se déconnecter de la session admin et se connecter en tant qu'employé (ex: `a.bensaid24303@pi.tn`).
2. Accéder au **Catalogue**.
3. Rechercher "Excursion Djerba" dans le catalogue.
4. Cliquer sur **S'inscrire**, remplir les champs optionnels demandés par le type d'activité, et soumettre.
5. *Vérification :* Le statut de l'inscription passe à `En attente` (PENDING). L'employé reçoit une notification in-app dans le menu cloche.

### Étape 4 : Validation de la Demande d'Inscription (Admin)
1. Re-connexion en admin.
2. Accéder à l'onglet **Gérer Inscriptions**.
3. Localiser la demande de l'employé pour "Excursion Djerba".
4. Cliquer sur le bouton d'action **Approuver**.
5. *Vérification :*
   - L'inscription passe au statut `APPROUVEE`.
   - L'employé reçoit instantanément une notification en temps réel (WebSocket) et un e-mail HTML d'approbation contenant son QR Code unique.
   - L'action `REGISTRATION_APPROVE` est enregistrée dans le journal d'audit MongoDB.

### Étape 5 : Téléchargement et Validation du QR Code
1. Se connecter à nouveau en tant qu'employé.
2. Accéder à l'onglet **Mes Inscriptions**.
3. Localiser l'inscription approuvée et cliquer sur **Télécharger le QR Code**.
4. Se connecter en administrateur, accéder à l'onglet **Scanner QR Code** et utiliser la caméra (ou le simulateur de validation) pour scanner le QR Code.
5. *Vérification :* L'application affiche un message de succès confirmant la validation de la présence de l'employé à l'événement.

### Étape 6 : Demande de Ticket Pluxee (Employé)
1. Se connecter en tant qu'employé.
2. Accéder à l'onglet **Demande Ticket** (Vouchers Pluxee).
3. Soumettre une demande pour le mois en cours (choisir le nombre de tickets, offre, téléverser un justificatif).
4. Soumettre la demande.
5. *Vérification :*
   - La demande est enregistrée avec le statut `PENDING`.
   - Soumettre une seconde demande pour le même mois doit renvoyer une erreur de quota (1 demande max par mois).

### Étape 7 : Approbation du Ticket & Journal d'Audit (Admin)
1. Se connecter en administrateur.
2. Accéder à l'onglet **Gérer Tickets**.
3. Approuver la demande de ticket restaurant de l'employé.
4. *Vérification :*
   - Le statut passe à `APPROVED`.
   - L'employé reçoit une notification in-app cloche + temps réel WebSocket : `"Votre demande de recharge ticket ... a été approuvée."`
   - Accéder à l'onglet **Journal d'Audit** et vérifier que la transaction est répertoriée sous l'action `TICKET_APPROVED` avec le détail complet des paramètres.
5. Cliquer sur **Exporter CSV** pour télécharger l'historique complet.

---

## 🌓 Dark Mode & Traduction (RTL/LTR)
1. Cliquer sur le bouton **Lune/Soleil** dans le header de l'application : l'intégralité du thème bascule en mode sombre (les couleurs de fond passent au gris foncé, le texte en blanc/gris clair et les bordures s'adaptent). Le choix est persisté au rechargement.
2. Cliquer sur le sélecteur de langue **AR / FR** :
   - Choisir **AR** : L'interface bascule en arabe, l'alignement de la page s'inverse en mode RTL (de droite à gauche), et la barre latérale se positionne automatiquement à droite de l'écran.
   - Choisir **FR** : L'interface revient à gauche (LTR) en français.
