# /backend/referentiels/serializers.py
from rest_framework import serializers
from .models import Referentiel


class ReferentielSerializer(serializers.ModelSerializer):

    class Meta:
        model = Referentiel
        fields = [
            'id',
            'categorie',
            'valeur',
            'label',
            'icone',
            'couleur',
            'ordre',
            'actif',
        ]
        read_only_fields = ['id']