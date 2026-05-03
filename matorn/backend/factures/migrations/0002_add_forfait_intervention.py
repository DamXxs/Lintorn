# Migration générée manuellement pour ajouter le modèle ForfaitIntervention
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('factures', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ForfaitIntervention',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(help_text='Nom du forfait (ex: Vidange VP 2L)', max_length=200)),
                ('description', models.TextField(blank=True, help_text='Description détaillée (optionnel)', null=True)),
                ('prix_forfait', models.DecimalField(decimal_places=2, help_text='Prix HT du forfait en euros', max_digits=10)),
                ('actif', models.BooleanField(default=True, help_text="Si False, ce forfait n'apparaît plus dans les devis")),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Forfait Intervention',
                'verbose_name_plural': 'Forfaits Intervention',
                'ordering': ['nom'],
            },
        ),
    ]
