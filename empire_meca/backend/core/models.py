from django.db import models

# =============================================================================
# MODÈLE CLIENT
# =============================================================================
class Client(models.Model):
    """
    Représente un client du garage.
    Un client peut avoir plusieurs véhicules (relation OneToMany).
    """
    
    # Informations de base
    nom = models.CharField(
        max_length=100,
        help_text="Nom de famille du client"
    )
    prenom = models.CharField(
        max_length=100,
        blank=True,  # Pas obligatoire (certains clients = entreprises)
        help_text="Prénom du client"
    )
    
    # Coordonnées
    telephone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Numéro de téléphone"
    )
    email = models.EmailField(
        blank=True,
        help_text="Email du client"
    )
    
    # Métadonnées (pour savoir quand tu as créé le client)
    date_creation = models.DateTimeField(
        auto_now_add=True,  # Se remplit automatiquement à la création
        help_text="Date de création de la fiche client"
    )
    
    # Notes libres (pour infos supplémentaires)
    notes = models.TextField(
        blank=True,
        help_text="Notes sur le client (ex: préfère être appelé le matin)"
    )
    
    class Meta:
        ordering = ['nom', 'prenom']  # Tri par nom puis prénom
        verbose_name = "Client"
        verbose_name_plural = "Clients"
    
    def __str__(self):
        """
        Ce qui s'affiche quand tu fais print(client) ou dans l'admin Django.
        Exemple: "Dupont Jean" ou juste "Dupont" si pas de prénom
        """
        if self.prenom:
            return f"{self.nom} {self.prenom}"
        return self.nom


# =============================================================================
# MODÈLE VÉHICULE
# =============================================================================
class Vehicule(models.Model):
    """
    Représente un véhicule.
    Un véhicule appartient à UN client (mais peut changer de propriétaire).
    """
    
    # Identification du véhicule
    immatriculation = models.CharField(
        max_length=20,
        unique=True,  # Pas 2 véhicules avec la même plaque !
        help_text="Plaque d'immatriculation (ex: AB-123-CD)"
    )
    marque = models.CharField(
        max_length=50,
        help_text="Marque du véhicule (ex: Peugeot, Renault)"
    )
    modele = models.CharField(
        max_length=50,
        help_text="Modèle du véhicule (ex: 308, Clio)"
    )
    annee = models.IntegerField(
        null=True,
        blank=True,
        help_text="Année de mise en circulation"
    )
    
    # RELATION avec Client (ForeignKey = clé étrangère)
    # null=True, blank=True = un véhicule peut temporairement ne pas avoir de proprio
    # on_delete=SET_NULL = si tu supprimes le client, le véhicule reste mais sans proprio
    proprietaire = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicules',  # Permet de faire client.vehicules.all()
        help_text="Propriétaire actuel du véhicule"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date d'ajout du véhicule dans la base"
    )
    
    # Notes (pour infos spécifiques au véhicule)
    notes = models.TextField(
        blank=True,
        help_text="Notes sur le véhicule (ex: pneus neige l'hiver)"
    )
    
    class Meta:
        ordering = ['marque', 'modele']
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"
    
    def __str__(self):
        """
        Affichage : "Peugeot 308 (AB-123-CD)"
        """
        return f"{self.marque} {self.modele} ({self.immatriculation})"


# =============================================================================
# MODÈLE INTERVENTION
# =============================================================================
class Intervention(models.Model):
    """
    Représente un rendez-vous / intervention dans le planning.
    """
    # CHOIX pour le type de RDV (NOUVEAU !)
    TYPE_CHOICES = [
        ('ATELIER', 'Atelier (Mécanique)'),
        ('ACADEMIE', 'Académie (Cours)'),
    ]

    # CHOIX pour le statut (tuple de tuples)
    STATUT_CHOICES = [
        ('PLANIFIE', 'Planifié'),
        ('EN_COURS', 'En cours'),
        ('TERMINE', 'Terminé'),
        ('ANNULE', 'Annulé'),
    ]
    
    # NOUVEAU CHAMP : Type de RDV
    type_rdv = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='ATELIER',
        help_text="Type de rendez-vous (Atelier ou Académie)"
    )

    # RELATIONS (les liens vers Client et Véhicule)
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,  # Si tu supprimes le client, ses rdv disparaissent
        related_name='interventions',
        help_text="Client concerné par cette intervention"
    )
    vehicule = models.ForeignKey(
        Vehicule,
        on_delete=models.CASCADE,  # Si tu supprimes le véhicule, ses rdv disparaissent
        related_name='interventions',
        help_text="Véhicule concerné par cette intervention",
        null=True,
        blank=True
    )
    
    # Date et heure
    date_debut = models.DateTimeField(
        help_text="Date et heure du début de l'intervention"
    )
    date_fin = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date et heure de fin (optionnel, peut être calculé)"
    )
    
    # Description de l'intervention
    description = models.TextField(
        blank=True,
        help_text="Travaux à effectuer (ex: Vidange + filtre à huile)"
    )
    
    # Statut
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='PLANIFIE',
        help_text="État actuel de l'intervention"
    )
    
    # Rappel (pour ton système de notifications)
    rappel_envoye = models.BooleanField(
        default=False,
        help_text="True si le rappel a déjà été envoyé"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date de création du rendez-vous"
    )
    date_modification = models.DateTimeField(
        auto_now=True,  # Se met à jour automatiquement à chaque sauvegarde
        help_text="Dernière modification"
    )
    
    class Meta:
        ordering = ['-date_debut']  # Tri par date décroissante (plus récent en premier)
        verbose_name = "Intervention"
        verbose_name_plural = "Interventions"
    
    def __str__(self):
        """
        Affichage : "Dupont Jean - Peugeot 308 - 25/01/2025"
        OU "Dupont Jean - Académie - 25/01/2025" si pas de véhicule
        """
        if self.vehicule:
            return f"{self.client} - {self.vehicule.modele} - {self.date_debut.strftime('%d/%m/%Y')}"
        else:
            return f"{self.client} - {self.type_rdv} - {self.date_debut.strftime('%d/%m/%Y')}"
        
    @property
    def titre_calendrier(self):
        """
        Propriété calculée pour l'affichage dans FullCalendar.
        """
        if self.vehicule:
            return f"{self.client.nom} - {self.vehicule.modele}"
        else:
            return f"{self.client.nom} - {self.type_rdv}"

            # =============================================================================
# MODÈLE PIÈCE
# =============================================================================
class Piece(models.Model):
    """
    Représente une pièce détachée en stock.
    """
    
    # CHOIX pour les catégories
    CATEGORIE_CHOICES = [
        ('FILTRATION', 'Filtration'),
        ('HUILES', 'Huiles & Liquides'),
        ('FREINAGE', 'Freinage'),
        ('PNEUMATIQUE', 'Pneumatiques'),
        ('ELECTRICITE', 'Électricité'),
        ('MECANIQUE', 'Mécanique'),
        ('CARROSSERIE', 'Carrosserie'),
        ('AUTRE', 'Autre'),
    ]
    
    # Identification de la pièce
    reference = models.CharField(
        max_length=50,
        unique=True,
        help_text="Référence unique de la pièce (ex: FLT-OIL-001)"
    )
    nom = models.CharField(
        max_length=200,
        help_text="Nom de la pièce (ex: Filtre à huile)"
    )
    description = models.TextField(
        blank=True,
        help_text="Description détaillée (compatibilité, specs, etc.)"
    )
    
    # Catégorie
    categorie = models.CharField(
        max_length=20,
        choices=CATEGORIE_CHOICES,
        default='AUTRE',
        help_text="Catégorie de la pièce"
    )
    
    # Prix
    prix_achat = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Prix d'achat HT chez le fournisseur"
    )
    prix_vente = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Prix de vente TTC au client"
    )
    
    # Stock
    stock_actuel = models.IntegerField(
        default=0,
        help_text="Quantité actuellement en stock"
    )
    stock_minimum = models.IntegerField(
        default=5,
        help_text="Seuil d'alerte (si stock < seuil → alerte)"
    )
    
    # Fournisseur
    fournisseur = models.CharField(
        max_length=200,
        blank=True,
        help_text="Nom du fournisseur principal"
    )
    delai_livraison = models.IntegerField(
        default=2,
        help_text="Délai de livraison en jours"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date d'ajout de la pièce dans le système"
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        help_text="Dernière modification"
    )
    
    class Meta:
        ordering = ['categorie', 'nom']
        verbose_name = "Pièce"
        verbose_name_plural = "Pièces"
    
    def __str__(self):
        """
        Affichage : "FLT-OIL-001 - Filtre à huile"
        """
        return f"{self.reference} - {self.nom}"
    
    @property
    def stock_status(self):
        """
        Retourne le statut du stock : OK, ALERTE, ou RUPTURE
        """
        if self.stock_actuel == 0:
            return "RUPTURE"
        elif self.stock_actuel < self.stock_minimum:
            return "ALERTE"
        else:
            return "OK"
    
    @property
    def marge(self):
        """
        Calcule la marge en euros
        """
        return self.prix_vente - self.prix_achat
    
    @property
    def marge_pourcentage(self):
        """
        Calcule la marge en pourcentage
        """
        if self.prix_achat > 0:
            return ((self.prix_vente - self.prix_achat) / self.prix_achat) * 100
        return 0


# =============================================================================
# MODÈLE COMMANDE FOURNISSEUR
# =============================================================================
class CommandeFournisseur(models.Model):
    """
    Représente une commande passée auprès d'un fournisseur.
    """
    
    # CHOIX pour le statut
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('ENVOYEE', 'Envoyée'),
        ('EN_ATTENTE', 'En attente de livraison'),
        ('LIVREE', 'Livrée'),
        ('ANNULEE', 'Annulée'),
    ]
    
    # Informations de base
    numero_commande = models.CharField(
        max_length=50,
        unique=True,
        help_text="Numéro de commande (ex: CMD-2026-001)"
    )
    fournisseur = models.CharField(
        max_length=200,
        help_text="Nom du fournisseur"
    )
    
    # Dates
    date_commande = models.DateField(
        help_text="Date de la commande"
    )
    date_livraison_prevue = models.DateField(
        null=True,
        blank=True,
        help_text="Date de livraison prévue"
    )
    date_livraison_reelle = models.DateField(
        null=True,
        blank=True,
        help_text="Date de livraison réelle"
    )
    
    # Statut
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='BROUILLON',
        help_text="État de la commande"
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        help_text="Notes ou commentaires sur la commande"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date de création de la commande"
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        help_text="Dernière modification"
    )
    
    class Meta:
        ordering = ['-date_commande']
        verbose_name = "Commande Fournisseur"
        verbose_name_plural = "Commandes Fournisseurs"
    
    def __str__(self):
        """
        Affichage : "CMD-2026-001 - Garage Center - Envoyée"
        """
        return f"{self.numero_commande} - {self.fournisseur} - {self.get_statut_display()}"


# =============================================================================
# MODÈLE LIGNE DE COMMANDE (pour lier Commande ↔ Pièce)
# =============================================================================
class LigneCommande(models.Model):
    """
    Représente une ligne dans une commande (1 pièce + quantité).
    """
    
    # Relations
    commande = models.ForeignKey(
        CommandeFournisseur,
        on_delete=models.CASCADE,
        related_name='lignes',
        help_text="Commande à laquelle appartient cette ligne"
    )
    piece = models.ForeignKey(
        Piece,
        on_delete=models.CASCADE,
        help_text="Pièce commandée"
    )
    
    # Quantité
    quantite = models.IntegerField(
        default=1,
        help_text="Quantité commandée"
    )
    
    # Prix au moment de la commande (peut être différent du prix actuel)
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Prix unitaire au moment de la commande"
    )
    
    class Meta:
        verbose_name = "Ligne de commande"
        verbose_name_plural = "Lignes de commande"
    
    def __str__(self):
        return f"{self.piece.nom} x{self.quantite}"
    
    @property
    def total(self):
        """
        Calcule le total de la ligne (quantité × prix unitaire)
        """
        return self.quantite * self.prix_unitaire