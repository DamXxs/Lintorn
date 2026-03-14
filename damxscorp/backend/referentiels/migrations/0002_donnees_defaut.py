# /backend/referentiels/migrations/0002_donnees_defaut.py
from django.db import migrations

# ── Données par défaut pour les 3 catégories ─────────────────────────────────
DONNEES_DEFAUT = [

    # TYPES DE VÉHICULES
    {'categorie': 'TYPE_VEHICULE', 'valeur': 'VOITURE',     'label': 'Voiture',      'icone': '🚗', 'ordre': 1},
    {'categorie': 'TYPE_VEHICULE', 'valeur': 'MOTO',        'label': 'Moto',         'icone': '🏍️', 'ordre': 2},
    {'categorie': 'TYPE_VEHICULE', 'valeur': 'MOTOCULTURE', 'label': 'Motoculture',  'icone': '🚜', 'ordre': 3},
    {'categorie': 'TYPE_VEHICULE', 'valeur': 'BATEAU',      'label': 'Bateau',       'icone': '🚤', 'ordre': 4},

    # TYPES D'INTERVENTIONS
    {'categorie': 'TYPE_INTERVENTION', 'valeur': 'ENTRETIEN_VP2',    'label': 'Entretien VP2 (Petite vidange)', 'icone': '🔧', 'ordre': 1},
    {'categorie': 'TYPE_INTERVENTION', 'valeur': 'ENTRETIEN_VP4',    'label': 'Entretien VP4 (Grosse vidange)', 'icone': '🔧', 'ordre': 2},
    {'categorie': 'TYPE_INTERVENTION', 'valeur': 'DIAGNOSTIQUE',     'label': 'Diagnostique',                   'icone': '🔍', 'ordre': 3},
    {'categorie': 'TYPE_INTERVENTION', 'valeur': 'PNEUMATIQUES',     'label': 'Pneumatiques',                   'icone': '⚫', 'ordre': 4},
    {'categorie': 'TYPE_INTERVENTION', 'valeur': 'REVISION_COMPLETE','label': 'Révision complète',              'icone': '📋', 'ordre': 5},
    {'categorie': 'TYPE_INTERVENTION', 'valeur': 'AUTRE',            'label': 'Autre',                          'icone': '❓', 'ordre': 6},

    # CATÉGORIES DE STOCK
    {'categorie': 'CATEGORIE_STOCK', 'valeur': 'FILTRATION',   'label': 'Filtration',        'icone': '🔵', 'ordre': 1},
    {'categorie': 'CATEGORIE_STOCK', 'valeur': 'HUILES',       'label': 'Huiles & Liquides', 'icone': '🟡', 'ordre': 2},
    {'categorie': 'CATEGORIE_STOCK', 'valeur': 'FREINAGE',     'label': 'Freinage',          'icone': '🔴', 'ordre': 3},
    {'categorie': 'CATEGORIE_STOCK', 'valeur': 'PNEUMATIQUE',  'label': 'Pneumatiques',      'icone': '⚫', 'ordre': 4},
    {'categorie': 'CATEGORIE_STOCK', 'valeur': 'ELECTRICITE',  'label': 'Électricité',       'icone': '⚡', 'ordre': 5},
    {'categorie': 'CATEGORIE_STOCK', 'valeur': 'MECANIQUE',    'label': 'Mécanique',         'icone': '⚙️', 'ordre': 6},
    {'categorie': 'CATEGORIE_STOCK', 'valeur': 'CARROSSERIE',  'label': 'Carrosserie',       'icone': '🚘', 'ordre': 7},
    {'categorie': 'CATEGORIE_STOCK', 'valeur': 'AUTRE',        'label': 'Autre',             'icone': '📦', 'ordre': 8},
]


def creer_donnees_defaut(apps, schema_editor):
    """Insère les valeurs par défaut si elles n'existent pas déjà."""
    Referentiel = apps.get_model('referentiels', 'Referentiel')
    for data in DONNEES_DEFAUT:
        Referentiel.objects.get_or_create(
            categorie=data['categorie'],
            valeur=data['valeur'],
            defaults={
                'label':  data['label'],
                'icone':  data['icone'],
                'ordre':  data['ordre'],
                'actif':  True,
                'couleur': '',
            }
        )


def supprimer_donnees_defaut(apps, schema_editor):
    """Rollback : supprime les données insérées."""
    Referentiel = apps.get_model('referentiels', 'Referentiel')
    valeurs = [d['valeur'] for d in DONNEES_DEFAUT]
    Referentiel.objects.filter(valeur__in=valeurs).delete()


class Migration(migrations.Migration):

    # Dépend de la migration initiale (0001) qu'on créera avec makemigrations
    dependencies = [
        ('referentiels', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(creer_donnees_defaut, supprimer_donnees_defaut),
    ]