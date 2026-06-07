# /backend/clients/models.py
from django.db import models
from django.utils import timezone

# IMPORT du Mixin et de l'exception
from mixins.models import SoftDeleteMixin, SuppressionBloqueeError


# =============================================================================
# MODÈLE CLIENT
# =============================================================================
class Client(SoftDeleteMixin):  # ← MODIF : hérite du Mixin
    """
    Représente un client du garage.
    Un client peut avoir plusieurs véhicules (relation OneToMany).
    
    NOUVEAU : Hérite de SoftDeleteMixin → corbeille + archives.
    """
    
    nom = models.CharField(
        max_length=100,
        help_text="Nom de famille du client"
    )
    prenom = models.CharField(
        max_length=100,
        blank=True,
        help_text="Prénom du client"
    )
    
    telephone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Numéro de téléphone"
    )
    email = models.EmailField(
        blank=True,
        help_text="Email du client"
    )
    adresse = models.CharField(
        max_length=255,
        blank=True,
        help_text="Adresse postale complète"
    )
    
    notes = models.TextField(
        blank=True,
        help_text="Notes sur le client"
    )
    
    class Meta:
        ordering = ['nom', 'prenom']
        verbose_name = "Client"
        verbose_name_plural = "Clients"
    
    def __str__(self):
        if self.prenom:
            return f"{self.nom} {self.prenom}"
        return self.nom
    
    # =========================================================================
    # NOUVEAU : Règle métier pour la corbeille
    # =========================================================================
    def check_can_be_deleted(self):
        """
        On REFUSE la suppression si le client a :
        - Des RDV à venir (date_debut >= maintenant, statut != ANNULE)
        - Des factures non entièrement payées (EMISE, IMPAYEE, PARTIELLEMENT_PAYEE)
        
        On vérifie LES DEUX en même temps et on remonte tous les blocages au frontend.
        """
        # Imports locaux pour éviter les imports circulaires
        from planning.models import Intervention
        from factures.models import Facture
        
        # On va accumuler tous les éléments bloquants ici
        elements_bloquants = []
        messages_blocage = []
        
        # === Check 1 : RDV à venir ===
        rdv_a_venir = self.interventions.filter(
            date_debut__gte=timezone.now(),
        ).exclude(
            statut='ANNULE'
        ).select_related('vehicule', 'departement')
        
        nb_rdv = rdv_a_venir.count()
        
        if nb_rdv > 0:
            messages_blocage.append(
                f"{nb_rdv} rendez-vous à venir"
            )
            for rdv in rdv_a_venir[:10]:
                elements_bloquants.append({
                    'type': 'rdv',
                    'id': rdv.id,
                    'date_debut': rdv.date_debut.isoformat(),
                    'description': rdv.description or '(sans description)',
                    'statut': rdv.get_statut_display(),
                    'vehicule_immat': rdv.vehicule.immatriculation if rdv.vehicule else None,
                    'vehicule_marque_modele': (
                        f"{rdv.vehicule.marque} {rdv.vehicule.modele}"
                        if rdv.vehicule else None
                    ),
                })
        
        # === Check 2 : Factures impayées ===
        # Statuts qui bloquent : EMISE, IMPAYEE, PARTIELLEMENT_PAYEE
        # Statut OK pour suppression : PAYEE
        factures_impayees = self.factures.filter(
            statut__in=['EMISE', 'IMPAYEE', 'PARTIELLEMENT_PAYEE']
        )
        
        nb_factures = factures_impayees.count()
        
        if nb_factures > 0:
            messages_blocage.append(
                f"{nb_factures} facture(s) non payée(s)"
            )
            for facture in factures_impayees[:10]:
                elements_bloquants.append({
                    'type': 'facture',
                    'id': facture.id,
                    'numero': facture.numero,
                    'date_emission': facture.date_emission.isoformat(),
                    'date_echeance': facture.date_echeance.isoformat(),
                    'montant_ttc': float(facture.montant_ttc),
                    'montant_paye': float(facture.montant_paye),
                    'solde_restant': float(facture.solde_restant),
                    'statut': facture.get_statut_display(),
                })
        
        # === Si au moins un blocage, on lève l'exception ===
        if messages_blocage:
            message_complet = (
                f"Suppression impossible — Ce client a {' et '.join(messages_blocage)}. "
                f"Veuillez régulariser avant de supprimer la fiche client."
            )
            raise SuppressionBloqueeError(
                message=message_complet,
                elements_bloquants=elements_bloquants,
            )