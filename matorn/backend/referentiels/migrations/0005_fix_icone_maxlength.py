from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Le champ 'icone' était limité à 10 caractères (pensé pour les emojis).
    Le frontend stocke des noms d'icônes comme "AlertTriangle" (13 chars)
    ou "CheckCircle" (11 chars) qui dépassaient la limite et étaient tronqués.
    On passe à 50 caractères pour accommoder tous les noms du catalogue iconUtils.js.
    """

    dependencies = [
        ('referentiels', '0004_typeintervention'),
    ]

    operations = [
        migrations.AlterField(
            model_name='referentiel',
            name='icone',
            field=models.CharField(
                blank=True,
                default='',
                help_text="Nom de l'icône (ex: Car, Wrench, AlertTriangle)",
                max_length=50,
            ),
        ),
    ]
