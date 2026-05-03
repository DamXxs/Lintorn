# /backend/planning/serializers.py
from rest_framework import serializers
from .models import Intervention, Departement, Collaborateur
from clients.models import Client
from vehicules.models import Vehicule


# =============================================================================
# SERIALIZER DÉPARTEMENT
# =============================================================================
class DepartementSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Departement
        fields = ['id', 'code', 'nom', 'couleur', 'actif', 'ordre', 'requiert_vehicule']

    def validate_code(self, value):
        """Le code doit être en majuscules sans espaces."""
        return value.upper().replace(' ', '_')

    def validate(self, data):
        """Règle : il doit toujours rester au moins 1 département actif."""
        if self.instance and data.get('actif') is False:
            actifs = Departement.objects.filter(actif=True).exclude(pk=self.instance.pk)
            if not actifs.exists():
                raise serializers.ValidationError(
                    "Impossible de désactiver ce département : il doit en rester au moins un actif."
                )
        return data


# =============================================================================
# SERIALIZER COLLABORATEUR
# =============================================================================
class CollaborateurSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Collaborateur
        fields = ['id', 'nom', 'couleur', 'role', 'actif']


# =============================================================================
# SERIALIZER INTERVENTION
# =============================================================================
class InterventionSerializer(serializers.ModelSerializer):
    """
    ÉCRITURE (POST/PUT) → React envoie :
      - type_rdv              : code du département ('ATELIER', 'ACADEMIE'…)
      - collaborateurs_ids    : liste d'IDs [1, 2] (optionnel)
      - client_nom/prenom/… et vehicule_immatriculation/…

    LECTURE (GET) → React reçoit :
      - type_rdv              : code du département (backward compat)
      - departement           : objet complet {id, code, nom, couleur, requiert_vehicule}
      - collaborateurs        : liste [{id, nom, couleur}]
      - client_nom, client_prenom, client_phone, client_email
      - vehicule_immatriculation, vehicule_marque, vehicule_modele, vehicule_annee
      - title, start, end     : pour FullCalendar
    """

    # ── ÉCRITURE SEULE ───────────────────────────────────────────────────────
    type_rdv = serializers.CharField(write_only=True, required=False, default='ATELIER')

    collaborateurs_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list,
    )

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

    # ── LECTURE SEULE ────────────────────────────────────────────────────────
    client_nom_display    = serializers.CharField(source='client.nom',       read_only=True)
    client_prenom_display = serializers.CharField(source='client.prenom',    read_only=True)
    client_phone_display  = serializers.CharField(source='client.telephone', read_only=True)
    client_email_display  = serializers.CharField(source='client.email',     read_only=True)

    vehicule_immat_display  = serializers.SerializerMethodField()
    vehicule_marque_display = serializers.SerializerMethodField()
    vehicule_modele_display = serializers.SerializerMethodField()
    vehicule_annee_display  = serializers.SerializerMethodField()

    departement_data    = serializers.SerializerMethodField()
    collaborateurs_data = serializers.SerializerMethodField()

    title = serializers.SerializerMethodField()
    start = serializers.DateTimeField(source='date_debut', read_only=True)
    end   = serializers.DateTimeField(source='date_fin',   read_only=True)

    class Meta:
        model = Intervention
        fields = [
            'id', 'statut', 'date_debut', 'date_fin', 'description',
            'title', 'start', 'end',
            'departement_data', 'collaborateurs_data',
            'client_nom_display', 'client_prenom_display', 'client_phone_display', 'client_email_display',
            'vehicule_immat_display', 'vehicule_marque_display', 'vehicule_modele_display', 'vehicule_annee_display',
            'type_rdv', 'collaborateurs_ids',
            'client_nom', 'client_prenom', 'client_phone', 'client_email', 'client_adresse',
            'vehicule_immatriculation', 'vehicule_marque', 'vehicule_modele_input', 'vehicule_annee_input',
            'type_intervention',
        ]
        extra_kwargs = {
            'client':   {'required': False, 'read_only': True},
            'vehicule': {'required': False, 'read_only': True, 'allow_null': True},
            'date_fin': {'required': False, 'allow_null': True},
            'date_debut': {'required': True},
        }

    # ── SerializerMethodField ────────────────────────────────────────────────

    def get_vehicule_immat_display(self, obj):
        return obj.vehicule.immatriculation if obj.vehicule else ''

    def get_vehicule_marque_display(self, obj):
        return obj.vehicule.marque if obj.vehicule else ''

    def get_vehicule_modele_display(self, obj):
        return obj.vehicule.modele if obj.vehicule else ''

    def get_vehicule_annee_display(self, obj):
        return str(obj.vehicule.annee) if obj.vehicule and obj.vehicule.annee else ''

    def get_departement_data(self, obj):
        if obj.departement:
            return {
                'id':                obj.departement.id,
                'code':              obj.departement.code,
                'nom':               obj.departement.nom,
                'couleur':           obj.departement.couleur,
                'requiert_vehicule': obj.departement.requiert_vehicule,
            }
        return None

    def get_collaborateurs_data(self, obj):
        return [{'id': c.id, 'nom': c.nom, 'couleur': c.couleur} for c in obj.collaborateurs.all()]

    def get_title(self, obj):
        if obj.vehicule:
            return f"{obj.client.nom} - {obj.vehicule.modele}"
        dept_nom = obj.departement.nom if obj.departement else ''
        return f"{obj.client.nom} - {dept_nom}"

    # ── to_representation ────────────────────────────────────────────────────
    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Client
        data['client_nom']    = data.pop('client_nom_display',    '')
        data['client_prenom'] = data.pop('client_prenom_display', '')
        data['client_phone']  = data.pop('client_phone_display',  '')
        data['client_email']  = data.pop('client_email_display',  '')

        # Véhicule
        data['vehicule_immatriculation'] = data.pop('vehicule_immat_display',   '')
        data['vehicule_marque']          = data.pop('vehicule_marque_display',  '')
        data['vehicule_modele']          = data.pop('vehicule_modele_display',  '')
        data['vehicule_annee']           = data.pop('vehicule_annee_display',   '')

        # Département — backward compat : type_rdv = code du département
        dept_data         = data.pop('departement_data', None)
        data['departement'] = dept_data
        data['type_rdv']    = dept_data['code'] if dept_data else 'ATELIER'

        # Collaborateurs
        data['collaborateurs'] = data.pop('collaborateurs_data', [])

        return data

    # ── HELPER ───────────────────────────────────────────────────────────────
    def _resolve_departement(self, code):
        dept = Departement.objects.filter(code=code, actif=True).first()
        if not dept:
            dept = Departement.objects.filter(actif=True).order_by('ordre').first()
        return dept

    # ── CREATE ───────────────────────────────────────────────────────────────
    def create(self, validated_data):
        type_rdv_code      = validated_data.pop('type_rdv', 'ATELIER')
        collaborateurs_ids = validated_data.pop('collaborateurs_ids', [])
        client_nom         = validated_data.pop('client_nom', '')
        client_prenom      = validated_data.pop('client_prenom', '')
        client_phone       = validated_data.pop('client_phone', '')
        client_email       = validated_data.pop('client_email', '')
        client_adresse     = validated_data.pop('client_adresse', '')
        vehicule_immat     = validated_data.pop('vehicule_immatriculation', '')
        vehicule_marque    = validated_data.pop('vehicule_marque', '')
        vehicule_modele    = validated_data.pop('vehicule_modele_input', '')
        vehicule_annee     = validated_data.pop('vehicule_annee_input', '')
        validated_data.pop('type_intervention', '')

        departement = self._resolve_departement(type_rdv_code)
        validated_data['departement'] = departement

        client, _ = Client.objects.get_or_create(
            nom=client_nom.strip(),
            prenom=client_prenom.strip(),
            defaults={'telephone': client_phone, 'email': client_email},
        )
        validated_data['client'] = client

        vehicule = None
        if departement and departement.requiert_vehicule and vehicule_immat:
            annee_int = None
            try:
                annee_int = int(vehicule_annee) if vehicule_annee else None
            except ValueError:
                pass
            vehicule, _ = Vehicule.objects.get_or_create(
                immatriculation=vehicule_immat.strip().upper(),
                defaults={'marque': vehicule_marque, 'modele': vehicule_modele,
                          'annee': annee_int, 'proprietaire': client},
            )
        validated_data['vehicule'] = vehicule

        intervention = super().create(validated_data)

        if collaborateurs_ids:
            intervention.collaborateurs.set(
                Collaborateur.objects.filter(id__in=collaborateurs_ids)
            )
        return intervention

    # ── UPDATE ───────────────────────────────────────────────────────────────
    def update(self, instance, validated_data):
        type_rdv_code      = validated_data.pop('type_rdv', None)
        collaborateurs_ids = validated_data.pop('collaborateurs_ids', None)
        client_nom         = validated_data.pop('client_nom', instance.client.nom)
        client_prenom      = validated_data.pop('client_prenom', instance.client.prenom)
        client_phone       = validated_data.pop('client_phone', instance.client.telephone)
        client_email       = validated_data.pop('client_email', instance.client.email)
        validated_data.pop('client_adresse', '')
        vehicule_immat     = validated_data.pop('vehicule_immatriculation', '')
        vehicule_marque    = validated_data.pop('vehicule_marque', '')
        vehicule_modele    = validated_data.pop('vehicule_modele_input', '')
        vehicule_annee     = validated_data.pop('vehicule_annee_input', '')
        validated_data.pop('type_intervention', '')

        if type_rdv_code:
            instance.departement = self._resolve_departement(type_rdv_code)
        departement = instance.departement

        client, _ = Client.objects.get_or_create(
            nom=client_nom.strip(),
            prenom=client_prenom.strip(),
            defaults={'telephone': client_phone, 'email': client_email},
        )
        instance.client = client

        if departement and departement.requiert_vehicule and vehicule_immat:
            annee_int = None
            try:
                annee_int = int(vehicule_annee) if vehicule_annee else None
            except ValueError:
                pass
            vehicule, _ = Vehicule.objects.get_or_create(
                immatriculation=vehicule_immat.strip().upper(),
                defaults={'marque': vehicule_marque, 'modele': vehicule_modele,
                          'annee': annee_int, 'proprietaire': client},
            )
            instance.vehicule = vehicule
        elif not (departement and departement.requiert_vehicule):
            instance.vehicule = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if collaborateurs_ids is not None:
            instance.collaborateurs.set(
                Collaborateur.objects.filter(id__in=collaborateurs_ids)
            )
        return instance
