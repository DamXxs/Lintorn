"""
Registre des modèles qui supportent le soft-delete (corbeille + archives).

Pourquoi un registre ?
- Sécurité : on ne veut pas qu'un appel API puisse manipuler N'IMPORTE QUEL modèle
- Centralisation : un seul endroit pour ajouter un nouveau modèle archivable
- Lisibilité : on voit d'un coup d'œil ce qui est archivable

Pour ajouter un nouveau modèle plus tard (ex: OrdreReparation) :
- Hériter du SoftDeleteMixin dans le modèle
- Ajouter une entrée dans MODELES_ARCHIVABLES ci-dessous
"""

# Format : 'cle_url': ('app_label', 'model_name', 'Libellé affiché')
MODELES_ARCHIVABLES = {
    'client':       ('clients',      'client',       'Client'),
    'vehicule':     ('vehicules',    'vehicule',     'Véhicule'),
    'rdv':          ('planning',     'intervention', 'Rendez-vous'),
    'piece':        ('stock',        'piece',        'Pièce'),
    'fournisseur':  ('fournisseurs', 'fournisseur',  'Fournisseur'),
    'devis':        ('factures',     'devis',        'Devis'),
    'facture':      ('factures',     'facture',      'Facture'),
}


def get_model_class(cle_url):
    """
    Retourne la classe du modèle correspondant à la clé URL.
    Lève une ValueError si la clé n'existe pas dans le registre.
    
    Args:
        cle_url (str): Ex: 'client', 'vehicule', 'rdv'
    
    Returns:
        Class: La classe Django du modèle (ex: Client)
    """
    from django.contrib.contenttypes.models import ContentType
    
    if cle_url not in MODELES_ARCHIVABLES:
        raise ValueError(
            f"Le modèle '{cle_url}' n'est pas archivable. "
            f"Modèles disponibles : {list(MODELES_ARCHIVABLES.keys())}"
        )
    
    app_label, model_name, _ = MODELES_ARCHIVABLES[cle_url]
    ct = ContentType.objects.get(app_label=app_label, model=model_name)
    return ct.model_class()


def get_libelle(cle_url):
    """Retourne le libellé affichable pour un modèle."""
    if cle_url in MODELES_ARCHIVABLES:
        return MODELES_ARCHIVABLES[cle_url][2]
    return cle_url