# Migration générée manuellement — remplace l'ancienne qui créait
# CommandeFournisseur et LigneCommande (modèles supprimés).
# Cette version crée uniquement le modèle Fournisseur.

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        # Pas de dépendance : Fournisseur est indépendant
    ]

    operations = [
        migrations.CreateModel(
            name='Fournisseur',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(help_text="Nom de l'entreprise fournisseur (ex: Autodis, LKQ)", max_length=200)),
                ('email', models.EmailField(help_text='Email principal pour les commandes (ex: commandes@fournisseur.fr)', max_length=254)),
                ('telephone', models.CharField(blank=True, help_text='Téléphone du fournisseur', max_length=20)),
                ('contact_nom', models.CharField(blank=True, help_text='Nom du contact commercial (ex: Jean Dupont)', max_length=200)),
                ('adresse', models.TextField(blank=True, help_text='Adresse postale complète')),
                ('actif', models.BooleanField(default=True, help_text="Fournisseur actif ? Si False, il n'apparaît plus dans les listes")),
                ('notes', models.TextField(blank=True, help_text='Notes libres (conditions de paiement, remises, etc.)')),
                ('date_creation', models.DateTimeField(auto_now_add=True, help_text="Date d'ajout du fournisseur")),
                ('date_modification', models.DateTimeField(auto_now=True, help_text='Dernière modification')),
            ],
            options={
                'verbose_name': 'Fournisseur',
                'verbose_name_plural': 'Fournisseurs',
                'ordering': ['nom'],
            },
        ),
    ]
