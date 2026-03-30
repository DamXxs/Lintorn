# /backend/factures/serializers.py
from rest_framework import serializers
from .models import ParametresFacturation, ForfaitIntervention, Devis, LigneDevis, Facture, LigneFacture


# =============================================================================
# PARAMÈTRES FACTURATION
# =============================================================================

class ParametresFacturationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametresFacturation
        fields = ['id', 'tva_pourcentage', 'numero_devis_actuel', 'numero_facture_actuel', 'updated_at']
        # Les compteurs sont en lecture seule pour éviter les manipulations
        read_only_fields = ['id', 'numero_devis_actuel', 'numero_facture_actuel', 'updated_at']


# =============================================================================
# FORFAITS INTERVENTION
# =============================================================================

class ForfaitInterventionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForfaitIntervention
        fields = ['id', 'nom', 'description', 'prix_forfait', 'actif', 'updated_at']


# =============================================================================
# LIGNES DEVIS
# =============================================================================

class LigneDevisSerializer(serializers.ModelSerializer):
    sous_total = serializers.SerializerMethodField()
    piece_nom = serializers.CharField(source='piece.nom', read_only=True, allow_null=True)

    class Meta:
        model = LigneDevis
        fields = [
            'id', 'devis', 'piece', 'piece_nom',
            'description', 'quantite', 'prix_unitaire', 'sous_total'
        ]
        # 'devis' est en lecture seule car il est fourni via l'URL
        read_only_fields = ['devis']

    def get_sous_total(self, obj):
        return float(obj.sous_total())


class LigneDevisCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création/mise à jour d'une ligne (sans 'devis' requis)"""
    class Meta:
        model = LigneDevis
        fields = ['id', 'piece', 'description', 'quantite', 'prix_unitaire']


# =============================================================================
# DEVIS
# =============================================================================

class DevisListSerializer(serializers.ModelSerializer):
    """Version allégée pour les listes (performances)"""
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_prenom = serializers.CharField(source='client.prenom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Devis
        fields = [
            'id', 'numero', 'client', 'client_nom', 'client_prenom',
            'date_creation', 'date_validite', 'montant_ttc', 'statut', 'statut_display'
        ]


class DevisDetailSerializer(serializers.ModelSerializer):
    """Version complète avec les lignes et infos liées"""
    lignes_devis = LigneDevisSerializer(many=True, read_only=True)
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_prenom = serializers.CharField(source='client.prenom', read_only=True)
    client_telephone = serializers.CharField(source='client.telephone', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    client_adresse = serializers.CharField(source='client.adresse', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    # Infos de l'intervention liée
    intervention_date = serializers.DateTimeField(
        source='intervention.date_debut', read_only=True, allow_null=True
    )
    intervention_description = serializers.CharField(
        source='intervention.description', read_only=True, allow_null=True
    )
    vehicule_info = serializers.SerializerMethodField()

    class Meta:
        model = Devis
        fields = [
            'id', 'numero', 'client', 'client_nom', 'client_prenom',
            'client_telephone', 'client_email', 'client_adresse',
            'intervention', 'intervention_date', 'intervention_description',
            'vehicule_info', 'date_creation', 'date_validite',
            'montant_ht', 'tva', 'montant_ttc', 'statut', 'statut_display',
            'notes', 'lignes_devis'
        ]
        read_only_fields = [
            'numero', 'date_creation', 'montant_ht', 'tva', 'montant_ttc'
        ]

    def get_vehicule_info(self, obj):
        """Retourne les infos du véhicule lié à l'intervention"""
        if obj.intervention and obj.intervention.vehicule:
            v = obj.intervention.vehicule
            return {
                'id': v.id,
                'marque': getattr(v, 'marque', ''),
                'modele': getattr(v, 'modele', ''),
                'immatriculation': getattr(v, 'immatriculation', ''),
            }
        return None


# =============================================================================
# LIGNES FACTURE
# =============================================================================

class LigneFactureSerializer(serializers.ModelSerializer):
    sous_total = serializers.SerializerMethodField()
    piece_nom = serializers.CharField(source='piece.nom', read_only=True, allow_null=True)

    class Meta:
        model = LigneFacture
        fields = [
            'id', 'facture', 'piece', 'piece_nom',
            'description', 'quantite', 'prix_unitaire', 'sous_total'
        ]
        read_only_fields = ['facture']

    def get_sous_total(self, obj):
        return float(obj.sous_total())


class LigneFactureCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneFacture
        fields = ['id', 'piece', 'description', 'quantite', 'prix_unitaire']


# =============================================================================
# FACTURES
# =============================================================================

class FactureListSerializer(serializers.ModelSerializer):
    """Version allégée pour les listes"""
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_prenom = serializers.CharField(source='client.prenom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    solde_restant = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            'id', 'numero', 'client', 'client_nom', 'client_prenom',
            'date_emission', 'date_echeance', 'montant_ttc',
            'montant_paye', 'solde_restant', 'statut', 'statut_display'
        ]

    def get_solde_restant(self, obj):
        return float(obj.solde_restant)


class FactureDetailSerializer(serializers.ModelSerializer):
    """Version complète avec lignes et infos liées"""
    lignes_facture = LigneFactureSerializer(many=True, read_only=True)
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_prenom = serializers.CharField(source='client.prenom', read_only=True)
    client_telephone = serializers.CharField(source='client.telephone', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    client_adresse = serializers.CharField(source='client.adresse', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    solde_restant = serializers.SerializerMethodField()
    devis_numero = serializers.CharField(source='devis.numero', read_only=True, allow_null=True)
    vehicule_info = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            'id', 'numero', 'client', 'client_nom', 'client_prenom',
            'client_telephone', 'client_email', 'client_adresse',
            'devis', 'devis_numero', 'intervention',
            'vehicule_info', 'date_emission', 'date_echeance',
            'montant_ht', 'tva', 'montant_ttc', 'montant_paye',
            'solde_restant', 'statut', 'statut_display', 'notes', 'lignes_facture'
        ]
        read_only_fields = [
            'numero', 'date_emission', 'montant_ht', 'tva', 'montant_ttc'
        ]

    def get_solde_restant(self, obj):
        return float(obj.solde_restant)

    def get_vehicule_info(self, obj):
        """Retourne les infos du véhicule lié à l'intervention"""
        if obj.intervention and obj.intervention.vehicule:
            v = obj.intervention.vehicule
            return {
                'id': v.id,
                'marque': getattr(v, 'marque', ''),
                'modele': getattr(v, 'modele', ''),
                'immatriculation': getattr(v, 'immatriculation', ''),
            }
        return None
