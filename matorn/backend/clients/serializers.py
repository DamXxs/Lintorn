# /backend/clients/serializers.py
from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Client.
    
    ModelSerializer = automatiquement lié au modèle Client.
    Il sait déjà quels champs existent grâce au modèle.
    """

    class Meta:
        model = Client          # ← Quel modèle on sérialise
        fields = [              # ← Quels champs on expose à React
            'id',
            'nom',
            'prenom',
            'telephone',
            'email',
            'adresse',
            'notes',
            'date_creation',    # ← Lecture seule (auto_now_add)
        ]
        read_only_fields = ['id', 'date_creation']  # ← React ne peut pas les modifier