# /backend/stock/serializers.py
from rest_framework import serializers
from .models import Piece


class PieceSerializer(serializers.ModelSerializer):
    """
    Sérialise le modèle Piece pour l'API REST.

    Champs calculés (read_only) :
      - stock_status     : OK / ALERTE / RUPTURE
      - stock_disponible : stock_actuel - stock_suspendu
      - marge / marge_pourcentage : calculés depuis les prix

    Champs fournisseur :
      - fournisseur_ref  : ID de la fiche fournisseur liée (pour écriture)
      - fournisseur_nom  : nom calculé depuis fournisseur_ref (lecture seule)
      - fournisseur_email: email calculé depuis fournisseur_ref (lecture seule)
    """

    # Champs calculés depuis les @property du modèle
    stock_status      = serializers.ReadOnlyField()
    stock_disponible  = serializers.ReadOnlyField()
    marge             = serializers.ReadOnlyField()
    marge_pourcentage = serializers.ReadOnlyField()

    # Champs calculés depuis la FK fournisseur_ref
    # Le frontend React reçoit ces infos directement, sans devoir faire
    # une deuxième requête vers /api/fournisseurs/
    fournisseur_nom   = serializers.SerializerMethodField()
    fournisseur_email = serializers.SerializerMethodField()

    class Meta:
        model  = Piece
        fields = [
            'id',
            'reference',
            'nom',
            'description',
            'categorie',
            'prix_achat',
            'prix_vente',
            'marge',
            'marge_pourcentage',
            'stock_actuel',
            'stock_minimum',
            'stock_suspendu',
            'stock_disponible',
            'stock_status',
            'fournisseur_ref',    # ID FK (pour écriture depuis React)
            'fournisseur_nom',    # nom calculé (lecture seule)
            'fournisseur_email',  # email calculé (lecture seule)
            'delai_livraison',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'stock_suspendu',   # géré par les devis, pas manuellement
            'fournisseur_nom',
            'fournisseur_email',
        ]

    def get_fournisseur_nom(self, obj):
        """Retourne le nom depuis la fiche fournisseur liée, sinon None."""
        if obj.fournisseur_ref:
            return obj.fournisseur_ref.nom
        return None

    def get_fournisseur_email(self, obj):
        """Retourne l'email depuis la fiche fournisseur, sinon None."""
        if obj.fournisseur_ref:
            return obj.fournisseur_ref.email
        return None
