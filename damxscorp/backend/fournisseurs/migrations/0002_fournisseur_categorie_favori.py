# Migration : ajout de categorie et est_favori sur Fournisseur

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fournisseurs', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='fournisseur',
            name='categorie',
            field=models.CharField(
                choices=[
                    ('PNEUS',           'Pneumatiques'),
                    ('PIECES_COMMUNES', 'Pièces communes'),
                    ('PIECES_SPEC',     'Pièces spécifiques'),
                    ('CARROSSERIE',     'Carrosserie'),
                    ('ELECTRICITE',     'Électricité'),
                    ('HUILES',          'Huiles & Liquides'),
                    ('AUTRE',           'Autre'),
                ],
                default='AUTRE',
                help_text='Type de fournisseur (Pneus, Pièces communes, etc.)',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='fournisseur',
            name='est_favori',
            field=models.BooleanField(
                default=False,
                help_text='Fournisseur favori ? Apparaît en premier dans la liste',
            ),
        ),
    ]
