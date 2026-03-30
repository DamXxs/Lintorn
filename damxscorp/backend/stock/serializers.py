# /backend/stock/serializers.py
from rest_framework import serializers
from .models import Piece


class PieceSerializer(serializers.ModelSerializer):
    """
    Sérialise le modèle Piece.

    Les @property (stock_status, marge, marge_pourcentage) sont en lecture seule :
    Django les calcule automatiquement à partir du modèle, on n'a pas besoin
    de les envoyer lors d'une création ou modification.
    """

    # Champs calculés (read_only = on ne peut pas les modifier via l'API)
    stock_status      = serializers.ReadOnlyField()
    stock_disponible  = serializers.ReadOnlyField()  # stock_actuel - stock_suspendu
    marge             = serializers.ReadOnlyField()
    marge_pourcentage = serializers.ReadOnlyField()

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
            'stock_suspendu',   # ← pièces réservées sur des devis en cours
            'stock_disponible', # ← stock_actuel - stock_suspendu (calculé)
            'stock_status',
            'fournisseur',
            'delai_livraison',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification', 'stock_suspendu']
