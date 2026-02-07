# /backend/planning/serializers.py
from rest_framework import serializers
from .models import Intervention
from clients.models import Client
from vehicules.models import Vehicule

class InterventionSerializer(serializers.ModelSerializer):
    """
    Serializer pour convertir les objets Intervention en JSON
    """
    # Champs pour RECEVOIR les données (écriture uniquement)
    client_nom = serializers.CharField(write_only=True, required=False, allow_blank=True)
    client_prenom = serializers.CharField(write_only=True, required=False, allow_blank=True)
    client_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    client_email = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    vehicule_plate = serializers.CharField(write_only=True, required=False, allow_blank=True)
    vehicule_brand = serializers.CharField(write_only=True, required=False, allow_blank=True)
    vehicule_model = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Champs pour AFFICHER les données (lecture uniquement)
    client_nom_display = serializers.CharField(source='client.nom', read_only=True)
    client_prenom_display = serializers.CharField(source='client.prenom', read_only=True)
    vehicule_modele = serializers.CharField(source='vehicule.modele', read_only=True, allow_null=True)
    
    # Champs calculés pour FullCalendar
    title = serializers.SerializerMethodField()
    start = serializers.DateTimeField(source='date_debut', read_only=True)
    end = serializers.DateTimeField(source='date_fin', read_only=True)
    
    class Meta:
        model = Intervention
        fields = [
            'id',
            'type_rdv',
            'client',
            'vehicule',
            'date_debut',
            'date_fin',
            'description',
            'statut',
            # Champs calculés (lecture)
            'title',
            'start',
            'end',
            'client_nom_display',
            'client_prenom_display',
            'vehicule_modele',
            # Champs d'entrée (écriture)
            'client_nom',
            'client_prenom',
            'client_phone',
            'client_email',
            'vehicule_plate',
            'vehicule_brand',
            'vehicule_model',
        ]
        extra_kwargs = {
            'client': {'required': False, 'read_only': True},
            'vehicule': {'required': False, 'allow_null': True, 'read_only': True},
            'date_fin': {'required': False, 'allow_null': True},
        }
    
    def create(self, validated_data):
        """
        Création d'une intervention avec création automatique du client/véhicule
        """
        # Extraire les données client
        client_nom = validated_data.pop('client_nom', None)
        client_prenom = validated_data.pop('client_prenom', '')
        client_phone = validated_data.pop('client_phone', '')
        client_email = validated_data.pop('client_email', '')
        
        # Extraire les données véhicule
        vehicule_plate = validated_data.pop('vehicule_plate', None)
        vehicule_brand = validated_data.pop('vehicule_brand', '')
        vehicule_model = validated_data.pop('vehicule_model', '')
        
        # Créer ou récupérer le client
        if client_nom:
            client, created = Client.objects.get_or_create(
                nom=client_nom,
                prenom=client_prenom,
                defaults={
                    'telephone': client_phone,
                    'email': client_email,
                }
            )
            validated_data['client'] = client
            
            # Créer ou récupérer le véhicule (si ATELIER)
            if vehicule_plate and validated_data.get('type_rdv') == 'ATELIER':
                vehicule, created = Vehicule.objects.get_or_create(
                    immatriculation=vehicule_plate,
                    defaults={
                        'marque': vehicule_brand,
                        'modele': vehicule_model,
                        'proprietaire': client,
                    }
                )
                validated_data['vehicule'] = vehicule
        
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """
        Personnaliser l'affichage (renommer les champs pour le frontend)
        """
        data = super().to_representation(instance)
        # Renommer pour la compatibilité frontend
        data['client_nom'] = data.pop('client_nom_display', None)
        data['client_prenom'] = data.pop('client_prenom_display', None)
        return data
    
    def get_title(self, obj):
        """
        Génère le titre pour FullCalendar
        """
        if obj.vehicule:
            return f"{obj.client.nom} - {obj.vehicule.modele}"
        else:
            return f"{obj.client.nom} - {obj.type_rdv}"