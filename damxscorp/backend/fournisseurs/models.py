# /backend/fournisseurs/models.py
from django.db import models


class Fournisseur(models.Model):
    """
    Représente un fournisseur de pièces détachées.
    Chaque pièce en stock peut être liée à un fournisseur via une FK.
    Ce modèle sert aussi à générer les emails de commande automatiques
    quand le stock d'une pièce passe sous le seuil minimum.
    """

    # Les catégories sont maintenant gérées dynamiquement via les Référentiels
    # (catégorie CATEGORIE_FOURNISSEUR dans la table referentiels_referentiel)
    # Ce champ accepte n'importe quelle valeur — la validation se fait côté frontend.
    # Valeurs par défaut gardées ici pour référence / compatibilité avec l'existant.
    CATEGORIES_DEFAUT = [
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
        max_length=50,          # élargi pour les valeurs custom via référentiels
        blank=True,
        default='AUTRE',
        help_text="Catégorie du fournisseur — valeur libre, gérée via les Référentiels"
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
