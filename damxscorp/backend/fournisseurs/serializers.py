# /backend/fournisseurs/serializers.py
from rest_framework import serializers
from .models import Fournisseur


class FournisseurSerializer(serializers.ModelSerializer):
    """
    Serializer principal pour lire/créer/modifier un fournisseur.
    Le champ nb_pieces est calculé : il compte les pièces liées au fournisseur.
    """

    # Champ calculé : nombre de pièces liées à ce fournisseur
    nb_pieces = serializers.SerializerMethodField()

    class Meta:
        model = Fournisseur
        fields = [
            'id',
            'nom',
            'email',
            'telephone',
            'contact_nom',
            'adresse',
            'categorie',
            'est_favori',
            'actif',
            'notes',
            'nb_pieces',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification', 'nb_pieces']

    def get_nb_pieces(self, obj):
        """Retourne le nombre de pièces liées à ce fournisseur."""
        return obj.pieces.count()


class PieceAlerteSerializer(serializers.Serializer):
    """
    Serializer léger pour les pièces en alerte dans l'email de commande.
    On n'expose que ce qui est utile pour le mail.
    """
    id = serializers.IntegerField()
    reference = serializers.CharField()
    nom = serializers.CharField()
    stock_actuel = serializers.IntegerField()
    stock_minimum = serializers.IntegerField()
    quantite_suggeree = serializers.IntegerField()


class EmailCommandeSerializer(serializers.Serializer):
    """
    Serializer pour la réponse de l'endpoint de génération d'email.
    Le frontend reçoit toutes les données pour pré-remplir le formulaire d'email.
    """
    fournisseur_id = serializers.IntegerField()
    fournisseur_nom = serializers.CharField()
    email_destinataire = serializers.EmailField()
    contact_nom = serializers.CharField(allow_blank=True)
    sujet = serializers.CharField()
    corps = serializers.CharField()
    pieces = PieceAlerteSerializer(many=True)
