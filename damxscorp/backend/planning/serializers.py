# /backend/planning/serializers.py
from rest_framework import serializers
from .models import Intervention
from clients.models import Client
from vehicules.models import Vehicule


class InterventionSerializer(serializers.ModelSerializer):
    """
    Serializer pour les interventions.

    LECTURE (GET) → renvoie tous les champs dont React a besoin
    ÉCRITURE (POST/PUT) → accepte les données du formulaire React
    """

    # =========================================================================
    # CHAMPS EN ÉCRITURE SEULE (ce que React envoie → Django)
    # Ces champs sont utilisés pour créer/modifier client et véhicule
    # =========================================================================
    client_nom     = serializers.CharField(write_only=True, required=True)
    client_prenom  = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    client_phone   = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    client_email   = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    client_adresse = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')

    vehicule_immatriculation = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    vehicule_marque          = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    vehicule_modele_input    = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    vehicule_annee_input     = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    type_intervention        = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')

    # =========================================================================
    # CHAMPS EN LECTURE SEULE (ce que Django renvoie → React)
    # Ces champs lisent directement dans les relations client/véhicule
    # =========================================================================

    # Client
    client_nom_display     = serializers.CharField(source='client.nom',       read_only=True)
    client_prenom_display  = serializers.CharField(source='client.prenom',    read_only=True)
    client_phone_display   = serializers.CharField(source='client.telephone', read_only=True)
    client_email_display   = serializers.CharField(source='client.email',     read_only=True)

    # Véhicule (peut être null si ACADEMIE)
    vehicule_immat_display  = serializers.SerializerMethodField()
    vehicule_marque_display = serializers.SerializerMethodField()
    vehicule_modele_display = serializers.SerializerMethodField()
    vehicule_annee_display  = serializers.SerializerMethodField()

    # Champs pour FullCalendar
    title = serializers.SerializerMethodField()
    start = serializers.DateTimeField(source='date_debut', read_only=True)
    end   = serializers.DateTimeField(source='date_fin',   read_only=True)

    class Meta:
        model = Intervention
        fields = [
            'id',
            'type_rdv',
            'statut',
            'date_debut',
            'date_fin',
            'description',

            # Champs FullCalendar
            'title',
            'start',
            'end',

            # Lecture client
            'client_nom_display',
            'client_prenom_display',
            'client_phone_display',
            'client_email_display',

            # Lecture véhicule
            'vehicule_immat_display',
            'vehicule_marque_display',
            'vehicule_modele_display',
            'vehicule_annee_display',

            # Écriture client
            'client_nom',
            'client_prenom',
            'client_phone',
            'client_email',
            'client_adresse',

            # Écriture véhicule
            'vehicule_immatriculation',
            'vehicule_marque',
            'vehicule_modele_input',
            'vehicule_annee_input',
            'type_intervention',
        ]
        extra_kwargs = {
            'client':    {'required': False, 'read_only': True},
            'vehicule':  {'required': False, 'read_only': True, 'allow_null': True},
            'date_fin':  {'required': False, 'allow_null': True},
            'date_debut':{'required': True},
        }

    # =========================================================================
    # MÉTHODES pour les champs SerializerMethodField (véhicule nullable)
    # =========================================================================

    def get_vehicule_immat_display(self, obj):
        return obj.vehicule.immatriculation if obj.vehicule else ''

    def get_vehicule_marque_display(self, obj):
        return obj.vehicule.marque if obj.vehicule else ''

    def get_vehicule_modele_display(self, obj):
        return obj.vehicule.modele if obj.vehicule else ''

    def get_vehicule_annee_display(self, obj):
        return str(obj.vehicule.annee) if obj.vehicule and obj.vehicule.annee else ''

    def get_title(self, obj):
        """Titre affiché dans FullCalendar"""
        if obj.vehicule:
            return f"{obj.client.nom} - {obj.vehicule.modele}"
        return f"{obj.client.nom} - {obj.type_rdv}"

    # =========================================================================
    # to_representation : renomme les champs _display → noms simples pour React
    # =========================================================================
    def to_representation(self, instance):
        """
        Appelé à chaque GET. On renomme les champs _display en noms simples
        pour que React reçoive exactement les clés qu'il attend.
        """
        data = super().to_representation(instance)

        # Client : renommage _display → nom simple
        data['client_nom']    = data.pop('client_nom_display',    '')
        data['client_prenom'] = data.pop('client_prenom_display', '')
        data['client_phone']  = data.pop('client_phone_display',  '')
        data['client_email']  = data.pop('client_email_display',  '')

        # Véhicule : renommage _display → nom simple
        data['vehicule_immatriculation'] = data.pop('vehicule_immat_display',   '')
        data['vehicule_marque']          = data.pop('vehicule_marque_display',  '')
        data['vehicule_modele']          = data.pop('vehicule_modele_display',  '')
        data['vehicule_annee']           = data.pop('vehicule_annee_display',   '')

        return data

    # =========================================================================
    # CREATE : appelé lors d'un POST
    # =========================================================================
    def create(self, validated_data):
        """
        Crée l'intervention + le client + le véhicule si nécessaire.
        """
        # --- Extraire les données client ---
        client_nom     = validated_data.pop('client_nom', '')
        client_prenom  = validated_data.pop('client_prenom', '')
        client_phone   = validated_data.pop('client_phone', '')
        client_email   = validated_data.pop('client_email', '')
        client_adresse = validated_data.pop('client_adresse', '')

        # --- Extraire les données véhicule ---
        vehicule_immat  = validated_data.pop('vehicule_immatriculation', '')
        vehicule_marque = validated_data.pop('vehicule_marque', '')
        vehicule_modele = validated_data.pop('vehicule_modele_input', '')
        vehicule_annee  = validated_data.pop('vehicule_annee_input', '')
        validated_data.pop('type_intervention', '')  # Stocké en description pour l'instant

        # --- Créer ou récupérer le client ---
        client, _ = Client.objects.get_or_create(
            nom=client_nom.strip(),
            prenom=client_prenom.strip(),
            defaults={
                'telephone': client_phone,
                'email':     client_email,
            }
        )
        validated_data['client'] = client

        # --- Créer ou récupérer le véhicule (ATELIER uniquement) ---
        vehicule = None
        if validated_data.get('type_rdv') == 'ATELIER' and vehicule_immat:
            annee_int = None
            if vehicule_annee:
                try:
                    annee_int = int(vehicule_annee)
                except ValueError:
                    pass

            vehicule, _ = Vehicule.objects.get_or_create(
                immatriculation=vehicule_immat.strip().upper(),
                defaults={
                    'marque':       vehicule_marque,
                    'modele':       vehicule_modele,
                    'annee':        annee_int,
                    'proprietaire': client,
                }
            )
        validated_data['vehicule'] = vehicule

        return super().create(validated_data)

    # =========================================================================
    # UPDATE : appelé lors d'un PUT
    # =========================================================================
    def update(self, instance, validated_data):
        """
        Met à jour l'intervention + le client + le véhicule.
        """
        # --- Extraire les données client ---
        client_nom     = validated_data.pop('client_nom', instance.client.nom)
        client_prenom  = validated_data.pop('client_prenom', instance.client.prenom)
        client_phone   = validated_data.pop('client_phone', instance.client.telephone)
        client_email   = validated_data.pop('client_email', instance.client.email)
        validated_data.pop('client_adresse', '')

        # --- Extraire les données véhicule ---
        vehicule_immat  = validated_data.pop('vehicule_immatriculation', '')
        vehicule_marque = validated_data.pop('vehicule_marque', '')
        vehicule_modele = validated_data.pop('vehicule_modele_input', '')
        vehicule_annee  = validated_data.pop('vehicule_annee_input', '')
        validated_data.pop('type_intervention', '')

        # --- Mettre à jour le client ---
        client, _ = Client.objects.get_or_create(
            nom=client_nom.strip(),
            prenom=client_prenom.strip(),
            defaults={
                'telephone': client_phone,
                'email':     client_email,
            }
        )
        instance.client = client

        # --- Mettre à jour le véhicule ---
        type_rdv = validated_data.get('type_rdv', instance.type_rdv)
        if type_rdv == 'ATELIER' and vehicule_immat:
            annee_int = None
            if vehicule_annee:
                try:
                    annee_int = int(vehicule_annee)
                except ValueError:
                    pass

            vehicule, _ = Vehicule.objects.get_or_create(
                immatriculation=vehicule_immat.strip().upper(),
                defaults={
                    'marque':       vehicule_marque,
                    'modele':       vehicule_modele,
                    'annee':        annee_int,
                    'proprietaire': client,
                }
            )
            instance.vehicule = vehicule
        else:
            instance.vehicule = None

        # --- Mettre à jour les autres champs ---
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance