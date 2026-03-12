# /backend/vehicules/serializers.py
from rest_framework import serializers
from .models import Vehicule


class VehiculeSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Vehicule.

    Champs en lecture seule calculés :
      - proprietaire_nom  : "Dupont Jean" (affiché sur la card)
      - proprietaire_id   : ID du client (pour le lien vers la fiche client)
    """

    # Champ calculé : nom complet du propriétaire (lecture seule)
    # SerializerMethodField = on définit la logique dans get_proprietaire_nom()
    proprietaire_nom = serializers.SerializerMethodField()
    proprietaire_id  = serializers.SerializerMethodField()

    class Meta:
        model  = Vehicule
        fields = [
            'id',
            'immatriculation',
            'marque',
            'modele',
            'annee',
            'type_vehicule',
            'proprietaire',       # ID brut (write — pour créer/modifier)
            'proprietaire_nom',   # Nom complet (read — pour afficher)
            'proprietaire_id',    # ID (read — pour le lien)
            'notes',
            'date_creation',
        ]
        read_only_fields = ['id', 'date_creation', 'proprietaire_nom', 'proprietaire_id']

    def get_proprietaire_nom(self, obj):
        """Retourne "Dupont Jean" ou None si pas de propriétaire."""
        if obj.proprietaire:
            prenom = obj.proprietaire.prenom or ''
            return f"{obj.proprietaire.nom} {prenom}".strip()
        return None

    def get_proprietaire_id(self, obj):
        """Retourne l'ID du client propriétaire ou None."""
        if obj.proprietaire:
            return obj.proprietaire.id
        return None