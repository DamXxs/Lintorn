# Generated manually — adds VIN (Vehicle Identification Number) to Vehicule

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vehicules', '0003_vehicule_archived_at_vehicule_deleted_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicule',
            name='vin',
            field=models.CharField(
                blank=True,
                help_text='Numéro de châssis (VIN — Vehicle Identification Number)',
                max_length=17,
                null=True,
            ),
        ),
    ]
