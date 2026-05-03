# Migration : ajout du champ fournisseur_ref (FK vers Fournisseur) sur le modèle Piece.
# null=True, blank=True → les pièces existantes sans fournisseur restent valides.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        # On dépend de la migration qui a créé Fournisseur dans l'app fournisseurs
        ('fournisseurs', '0001_initial'),
        # On s'appuie sur la dernière migration du stock
        ('stock', '0002_piece_stock_suspendu'),
    ]

    operations = [
        migrations.AddField(
            model_name='piece',
            name='fournisseur_ref',
            field=models.ForeignKey(
                blank=True,
                help_text="Fiche fournisseur liée (pour la génération de l'email de commande)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='pieces',
                to='fournisseurs.fournisseur',
            ),
        ),
    ]
