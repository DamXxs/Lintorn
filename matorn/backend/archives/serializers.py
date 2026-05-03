"""
Serializer générique pour la vue Archives.

Comme on traite plusieurs types de modèles (Client, Vehicule, etc.),
on a besoin d'un serializer qui sait s'adapter à chacun et renvoyer
un format uniforme au frontend.
"""

from rest_framework import serializers


class ElementArchiveSerializer(serializers.Serializer):
    """
    Serializer générique pour afficher un élément en corbeille ou archives.
    
    Format de sortie uniforme pour le frontend, peu importe le modèle :
    {
        "type": "client",
        "id": 42,
        "libelle_principal": "Dupont Jean",
        "libelle_secondaire": "06.12.34.56.78",
        "deleted_at": "2026-04-25T14:30:00Z",
        "archived_at": null,
        "etat": "corbeille"  # ou "archive"
    }
    """
    type = serializers.CharField()
    id = serializers.IntegerField()
    libelle_principal = serializers.CharField()
    libelle_secondaire = serializers.CharField(allow_blank=True, allow_null=True)
    deleted_at = serializers.DateTimeField(allow_null=True)
    archived_at = serializers.DateTimeField(allow_null=True)
    etat = serializers.CharField()
    
    # Métadonnées utiles
    type_libelle = serializers.CharField()  # "Client", "Véhicule"...


def serialiser_element(obj, type_url, type_libelle):
    """
    Construit le dict standard pour un objet en corbeille/archives.
    
    Chaque modèle a sa propre logique pour générer libelle_principal et secondaire.
    """
    
    # === Logique d'affichage par type ===
    if type_url == 'client':
        libelle_principal = f"{obj.nom} {obj.prenom}".strip()
        libelle_secondaire = obj.telephone or obj.email or ''
    
    elif type_url == 'vehicule':
        libelle_principal = f"{obj.marque} {obj.modele}"
        libelle_secondaire = obj.immatriculation
    
    elif type_url == 'rdv':
        date_str = obj.date_debut.strftime('%d/%m/%Y %H:%M')
        libelle_principal = f"{obj.client.nom} - {date_str}"
        libelle_secondaire = obj.description[:60] if obj.description else ''
    
    elif type_url == 'piece':
        libelle_principal = obj.nom
        libelle_secondaire = obj.reference
    
    elif type_url == 'fournisseur':
        libelle_principal = obj.nom
        libelle_secondaire = obj.email
    
    elif type_url == 'devis':
        libelle_principal = obj.numero
        libelle_secondaire = f"{obj.client.nom} - {obj.montant_ttc}€"
    
    elif type_url == 'facture':
        libelle_principal = obj.numero
        libelle_secondaire = f"{obj.client.nom} - {obj.montant_ttc}€"
    
    else:
        libelle_principal = str(obj)
        libelle_secondaire = ''
    
    # Détermine l'état
    if obj.is_deleted:
        etat = 'corbeille'
    elif obj.is_archived:
        etat = 'archive'
    else:
        etat = 'actif'
    
    return {
        'type': type_url,
        'type_libelle': type_libelle,
        'id': obj.id,
        'libelle_principal': libelle_principal,
        'libelle_secondaire': libelle_secondaire,
        'deleted_at': obj.deleted_at,
        'archived_at': obj.archived_at,
        'etat': etat,
    }