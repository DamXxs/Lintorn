from django.apps import AppConfig


class VehiculesConfig(AppConfig):
    """
    Configuration de l'app vehicules.
    Gère tout ce qui concerne les véhicules.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'vehicules'
    verbose_name = 'Gestion des Véhicules'