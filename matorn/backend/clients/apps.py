from django.apps import AppConfig


class ClientsConfig(AppConfig):
    """
    Configuration de l'app clients.
    Gère tout ce qui concerne les clients du garage.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'clients'
    verbose_name = 'Gestion des Clients'