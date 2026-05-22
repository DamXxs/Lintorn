from django.db import migrations

# Correspondance emoji → nom d'icône attendu par iconUtils.js côté React
EMOJI_TO_NAME = {
    '🚗': 'Car',
    '🏍️': 'Bike',
    '🚜': 'Tractor',
    '🚤': 'Waves',
    '🔧': 'Wrench',
    '🔍': 'Settings',
    '⚫': 'CircleDot',
    '📋': 'Package',
    '❓': 'Package',
    '🔵': 'Package',
    '🟡': 'Fuel',
    '🔴': 'Shield',
    '⚡': 'Zap',
    '⚙️': 'Cog',
    '🚘': 'Car',
    '📦': 'Package',
}

def convert_emoji_to_names(apps, schema_editor):
    Referentiel = apps.get_model('referentiels', 'Referentiel')
    for emoji, name in EMOJI_TO_NAME.items():
        Referentiel.objects.filter(icone=emoji).update(icone=name)

def convert_names_to_emoji(apps, schema_editor):
    """Rollback — remet les emojis d'origine par valeur connue."""
    Referentiel = apps.get_model('referentiels', 'Referentiel')
    VALEUR_TO_EMOJI = {
        'VOITURE':          '🚗',
        'MOTO':             '🏍️',
        'MOTOCULTURE':      '🚜',
        'BATEAU':           '🚤',
        'ENTRETIEN_VP2':    '🔧',
        'ENTRETIEN_VP4':    '🔧',
        'DIAGNOSTIQUE':     '🔍',
        'PNEUMATIQUES':     '⚫',
        'REVISION_COMPLETE':'📋',
        'AUTRE':            '❓',
        'FILTRATION':       '🔵',
        'HUILES':           '🟡',
        'FREINAGE':         '🔴',
        'PNEUMATIQUE':      '⚫',
        'ELECTRICITE':      '⚡',
        'MECANIQUE':        '⚙️',
        'CARROSSERIE':      '🚘',
    }
    for valeur, emoji in VALEUR_TO_EMOJI.items():
        Referentiel.objects.filter(valeur=valeur).update(icone=emoji)


class Migration(migrations.Migration):

    dependencies = [
        ('referentiels', '0005_fix_icone_maxlength'),
    ]

    operations = [
        migrations.RunPython(convert_emoji_to_names, convert_names_to_emoji),
    ]
