# Migration 0002 — Ajout des modèles Departement et Collaborateur
#
# Ce que fait cette migration (dans l'ordre) :
#   1. Crée la table Departement
#   2. Crée la table Collaborateur
#   3. Ajoute une colonne departement_id (nullable) sur Intervention
#   4. Ajoute la table de liaison Intervention <-> Collaborateur (ManyToMany)
#   5. Remplit les départements ATELIER et ACADEMIE depuis les données existantes
#   6. Supprime l'ancien champ type_rdv de Intervention

import django.db.models.deletion
from django.db import migrations, models


# =============================================================================
# FONCTION DE MIGRATION DES DONNÉES
# Appelée par RunPython à l'étape 5.
# apps = snapshot des modèles au moment de cette migration
# =============================================================================
def populate_departements(apps, schema_editor):
    """
    Crée les deux départements par défaut (ATELIER et ACADEMIE)
    et rattache chaque Intervention existante à son département.
    """
    Departement  = apps.get_model('planning', 'Departement')
    Intervention = apps.get_model('planning', 'Intervention')

    # ── Création des départements par défaut ─────────────────────────────────
    atelier = Departement.objects.create(
        code='ATELIER',
        nom='Atelier',
        couleur='#2980b9',
        actif=True,
        ordre=0,
        requiert_vehicule=True,
    )
    academie = Departement.objects.create(
        code='ACADEMIE',
        nom='Académie',
        couleur='#8e44ad',
        actif=True,
        ordre=1,
        requiert_vehicule=False,
    )

    # ── Rattachement des interventions existantes ────────────────────────────
    # On lit l'ancien champ type_rdv pour savoir quel département affecter.
    for intervention in Intervention.objects.all():
        if intervention.type_rdv == 'ACADEMIE':
            intervention.departement = academie
        else:
            # Par défaut (ATELIER ou valeur inconnue) → Atelier
            intervention.departement = atelier
        intervention.save()


def reverse_populate(apps, schema_editor):
    """
    Rollback : on remet le code du département dans type_rdv.
    """
    Intervention = apps.get_model('planning', 'Intervention')
    for intervention in Intervention.objects.all():
        if intervention.departement:
            intervention.type_rdv = intervention.departement.code
        else:
            intervention.type_rdv = 'ATELIER'
        intervention.save()


# =============================================================================
# MIGRATION
# =============================================================================
class Migration(migrations.Migration):

    dependencies = [
        ('planning', '0001_initial'),
    ]

    operations = [

        # ── ÉTAPE 1 : Créer le modèle Departement ───────────────────────────
        migrations.CreateModel(
            name='Departement',
            fields=[
                ('id',                models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code',              models.CharField(max_length=30, unique=True, help_text="Identifiant technique unique, ex: ATELIER, ACADEMIE")),
                ('nom',               models.CharField(max_length=100, help_text="Nom affiché dans l'interface")),
                ('couleur',           models.CharField(max_length=7, default='#2980b9', help_text="Couleur hex, ex: #2980b9")),
                ('actif',             models.BooleanField(default=True)),
                ('ordre',             models.PositiveIntegerField(default=0)),
                ('requiert_vehicule', models.BooleanField(default=True, help_text="Si True, le champ véhicule est demandé dans le formulaire")),
            ],
            options={
                'verbose_name': 'Département',
                'verbose_name_plural': 'Départements',
                'ordering': ['ordre', 'nom'],
            },
        ),

        # ── ÉTAPE 2 : Créer le modèle Collaborateur ─────────────────────────
        migrations.CreateModel(
            name='Collaborateur',
            fields=[
                ('id',     models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom',    models.CharField(max_length=100, help_text="Nom complet du collaborateur")),
                ('couleur',models.CharField(max_length=7, default='#27ae60', help_text="Couleur hex")),
                ('role',   models.CharField(max_length=100, blank=True, help_text="Rôle dans le garage")),
                ('actif',  models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Collaborateur',
                'verbose_name_plural': 'Collaborateurs',
                'ordering': ['nom'],
            },
        ),

        # ── ÉTAPE 3 : Ajouter departement FK (nullable) sur Intervention ────
        migrations.AddField(
            model_name='intervention',
            name='departement',
            field=models.ForeignKey(
                blank=True,
                null=True,
                help_text="Département concerné",
                on_delete=django.db.models.deletion.PROTECT,
                related_name='interventions',
                to='planning.departement',
            ),
        ),

        # ── ÉTAPE 4 : Ajouter la relation ManyToMany Collaborateurs ─────────
        migrations.AddField(
            model_name='intervention',
            name='collaborateurs',
            field=models.ManyToManyField(
                blank=True,
                help_text="Collaborateur(s) assigné(s) à cette intervention",
                related_name='interventions',
                to='planning.collaborateur',
            ),
        ),

        # ── ÉTAPE 5 : Migration des données ─────────────────────────────────
        # Crée ATELIER et ACADEMIE, rattache les interventions existantes
        migrations.RunPython(populate_departements, reverse_code=reverse_populate),

        # ── ÉTAPE 6 : Supprimer l'ancien champ type_rdv ─────────────────────
        migrations.RemoveField(
            model_name='intervention',
            name='type_rdv',
        ),
    ]
