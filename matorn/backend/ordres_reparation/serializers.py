# /backend/ordres_reparation/serializers.py
from rest_framework import serializers
from .models import OrdreReparation, LignePieceUtilisee, LigneIntervention


# ============================================================
# SERIALIZER : LIGNE PIÈCE UTILISÉE
# ============================================================
class LignePieceUtiliseeSerializer(serializers.ModelSerializer):
    """
    Serializer pour une pièce sortie du stock dans un OR.
    
    Utilisé en LECTURE (affichage des pièces de l'OR)
    ET en ÉCRITURE (création/modification depuis React).
    """
    
    # Champs en lecture seule pour afficher les infos de la pièce
    # sans que React ait à faire une requête supplémentaire
    piece_nom = serializers.CharField(source='piece.nom', read_only=True)
    piece_reference = serializers.CharField(source='piece.reference', read_only=True)
    piece_categorie = serializers.CharField(source='piece.categorie', read_only=True)
    
    class Meta:
        model = LignePieceUtilisee
        fields = [
            'id',
            'piece',                  # ID de la pièce (FK)
            'piece_nom',              # nom (lecture)
            'piece_reference',        # référence (lecture)
            'piece_categorie',        # catégorie (lecture)
            'quantite',
            'designation_snapshot',
            'reference_snapshot',
            'cree_le',
        ]
        read_only_fields = ['id', 'cree_le']


# ============================================================
# SERIALIZER : LIGNE INTERVENTION (MAIN D'ŒUVRE)
# ============================================================
class LigneInterventionSerializer(serializers.ModelSerializer):
    """
    Serializer pour une tâche atomique dans un OR.
    """
    
    # Infos type d'intervention (depuis Référentiel)
    type_intervention_label = serializers.CharField(
        source='type_intervention.label',
        read_only=True
    )
    type_intervention_couleur = serializers.CharField(
        source='type_intervention.couleur',
        read_only=True
    )
    type_intervention_icone = serializers.CharField(
        source='type_intervention.icone',
        read_only=True
    )
    
    # Infos mécanicien (depuis Collaborateur)
    mecanicien_nom = serializers.CharField(source='mecanicien.nom', read_only=True)
    mecanicien_couleur = serializers.CharField(source='mecanicien.couleur', read_only=True)
    
    # Champ calculé : durée formatée "1h30"
    duree_formatee = serializers.CharField(read_only=True)
    
    class Meta:
        model = LigneIntervention
        fields = [
            'id',
            'date',
            'type_intervention',           # ID FK
            'type_intervention_label',     # libellé (lecture)
            'type_intervention_couleur',
            'type_intervention_icone',
            'mecanicien',                  # ID FK
            'mecanicien_nom',              # nom (lecture)
            'mecanicien_couleur',
            'duree_minutes',
            'duree_formatee',              # "1h30" (lecture)
            'detail',
            'cree_le',
        ]
        read_only_fields = ['id', 'cree_le', 'duree_formatee']


# ============================================================
# SERIALIZER : OR — VERSION LISTE (allégée)
# ============================================================
class OrdreReparationListSerializer(serializers.ModelSerializer):
    """
    Version allégée pour les listings (page liste des OR).
    Évite de charger toutes les pièces/interventions inutilement.
    """
    
    # Infos client (juste le nécessaire pour l'affichage liste)
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_prenom = serializers.CharField(source='client.prenom', read_only=True)
    
    # Infos véhicule
    vehicule_marque = serializers.CharField(source='vehicule.marque', read_only=True)
    vehicule_modele = serializers.CharField(source='vehicule.modele', read_only=True)
    vehicule_immatriculation = serializers.CharField(
        source='vehicule.immatriculation',
        read_only=True
    )
    
    # Statut lisible (ex: "En cours" au lieu de "EN_COURS")
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    # Compteurs (calculés)
    nombre_pieces = serializers.IntegerField(read_only=True)
    duree_totale_minutes = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = OrdreReparation
        fields = [
            'id',
            'numero',
            'date_ouverture',
            'date_cloture',
            'statut',
            'statut_display',
            'client',
            'client_nom',
            'client_prenom',
            'vehicule',
            'vehicule_marque',
            'vehicule_modele',
            'vehicule_immatriculation',
            'nombre_pieces',
            'duree_totale_minutes',
        ]


# ============================================================
# SERIALIZER : OR — VERSION DÉTAIL (complète avec nested)
# ============================================================
class OrdreReparationDetailSerializer(serializers.ModelSerializer):
    """
    Version complète : OR + toutes ses lignes (pièces + interventions).
    Utilisée pour afficher la fiche complète et pour générer le PDF.
    """
    
    # ===== Lignes imbriquées =====
    # Le related_name='pieces' et 'interventions' du modèle est crucial ici
    pieces = LignePieceUtiliseeSerializer(many=True, read_only=True)
    interventions = LigneInterventionSerializer(many=True, read_only=True)
    
    # ===== Infos client complètes =====
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_prenom = serializers.CharField(source='client.prenom', read_only=True)
    client_telephone = serializers.CharField(source='client.telephone', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    client_adresse = serializers.CharField(source='client.adresse', read_only=True)
    
    # ===== Infos véhicule complètes =====
    vehicule_marque = serializers.CharField(source='vehicule.marque', read_only=True)
    vehicule_modele = serializers.CharField(source='vehicule.modele', read_only=True)
    vehicule_annee = serializers.IntegerField(source='vehicule.annee', read_only=True)
    vehicule_immatriculation = serializers.CharField(
        source='vehicule.immatriculation',
        read_only=True
    )
    vehicule_type = serializers.CharField(source='vehicule.type_vehicule', read_only=True)
    
    # ===== Infos RDV si lié =====
    rdv_description = serializers.CharField(
        source='rdv.description',
        read_only=True,
        allow_null=True
    )
    
    # Statut lisible
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    # Compteurs calculés
    nombre_pieces = serializers.IntegerField(read_only=True)
    duree_totale_minutes = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = OrdreReparation
        fields = [
            # === Identification ===
            'id', 'numero', 'date_ouverture', 'statut', 'statut_display',
            
            # === Relations (IDs pour écriture) ===
            'client', 'vehicule', 'rdv',
            
            # === Client (lecture) ===
            'client_nom', 'client_prenom', 'client_telephone',
            'client_email', 'client_adresse',
            
            # === Véhicule (lecture) ===
            'vehicule_marque', 'vehicule_modele', 'vehicule_annee',
            'vehicule_immatriculation', 'vehicule_type',
            
            # === RDV (lecture) ===
            'rdv_description',
            
            # === Données saisies ===
            'kilometrage_entree', 'description_travaux',
            
            # === Clôture ===
            'date_cloture', 'kilometrage_sortie', 'heure_sortie',
            
            # === Notes internes ===
            'notes_internes',
            
            # === Lignes imbriquées ===
            'pieces', 'interventions',
            
            # === Compteurs ===
            'nombre_pieces', 'duree_totale_minutes',
            
            # === Timestamps ===
            'cree_le', 'modifie_le',
        ]
        read_only_fields = [
            'id', 'numero', 'cree_le', 'modifie_le',
            'nombre_pieces', 'duree_totale_minutes',
        ]