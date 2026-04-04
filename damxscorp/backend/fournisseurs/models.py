# /backend/fournisseurs/models.py
from django.db import models


class Fournisseur(models.Model):
    """
    Représente un fournisseur de pièces détachées.
    Chaque pièce en stock peut être liée à un fournisseur via une FK.
    Ce modèle sert aussi à générer les emails de commande automatiques
    quand le stock d'une pièce passe sous le seuil minimum.
    """

    CATEGORIE_CHOICES = [
        ('PNEUS',            'Pneumatiques'),
        ('PIECES_COMMUNES',  'Pièces communes'),
        ('PIECES_SPEC',      'Pièces spécifiques'),
        ('CARROSSERIE',      'Carrosserie'),
        ('ELECTRICITE',      'Électricité'),
        ('HUILES',           'Huiles & Liquides'),
        ('AUTRE',            'Autre'),
    ]

    nom = models.CharField(
        max_length=200,
        help_text="Nom de l'entreprise fournisseur (ex: Autodis, LKQ)"
    )
    email = models.EmailField(
        help_text="Email principal pour les commandes (ex: commandes@fournisseur.fr)"
    )
    telephone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Téléphone du fournisseur"
    )
    contact_nom = models.CharField(
        max_length=200,
        blank=True,
        help_text="Nom du contact commercial (ex: Jean Dupont)"
    )
    adresse = models.TextField(
        blank=True,
        help_text="Adresse postale complète"
    )
    categorie = models.CharField(
        max_length=20,
        choices=CATEGORIE_CHOICES,
        default='AUTRE',
        help_text="Type de fournisseur (Pneus, Pièces communes, etc.)"
    )
    est_favori = models.BooleanField(
        default=False,
        help_text="Fournisseur favori ? Apparaît en premier dans la liste"
    )
    actif = models.BooleanField(
        default=True,
        help_text="Fournisseur actif ? Si False, il n'apparaît plus dans les listes"
    )
    notes = models.TextField(
        blank=True,
        help_text="Notes libres (conditions de paiement, remises, etc.)"
    )
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date d'ajout du fournisseur"
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        help_text="Dernière modification"
    )

    class Meta:
        ordering = ['nom']
        verbose_name = "Fournisseur"
        verbose_name_plural = "Fournisseurs"

    def __str__(self):
        return self.nom

    @property
    def pieces_en_alerte(self):
        """
        Retourne les pièces liées à ce fournisseur dont le stock est faible.
        C'est ce qu'on met dans l'email de commande.
        """
        return self.pieces.filter(stock_actuel__lt=models.F('stock_minimum'))
