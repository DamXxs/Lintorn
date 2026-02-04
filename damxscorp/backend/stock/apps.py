from django.apps import AppConfig


class StockConfig(AppConfig):
    """
    Configuration de l'app stock.
    Gère tout ce qui concerne les pièces détachées.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'stock'
    verbose_name = 'Gestion du Stock'