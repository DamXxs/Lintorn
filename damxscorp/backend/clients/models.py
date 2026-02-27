from django.db import models

# =============================================================================
# MODÈLE CLIENT
# =============================================================================
class Client(models.Model):
    """
    Représente un client du garage.
    Un client peut avoir plusieurs véhicules (relation OneToMany).
    """
    
    # Informations de base
    nom = models.CharField(
        max_length=100,
        help_text="Nom de famille du client"
    )
    prenom = models.CharField(
        max_length=100,
        blank=True,  # Pas obligatoire (certains clients = entreprises)
        help_text="Prénom du client"
    )
    
    # Coordonnées
    telephone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Numéro de téléphone"
    )
    email = models.EmailField(
        blank=True,
        help_text="Email du client"
    )

    # Adresse postale
    adresse = models.CharField(
        max_length=255,
        blank=True,
        help_text="Adresse postale complète"
    )
    
    # Métadonnées (pour savoir quand tu as créé le client)
    date_creation = models.DateTimeField(
        auto_now_add=True,  # Se remplit automatiquement à la création
        help_text="Date de création de la fiche client"
    )
    
    # Notes libres (pour infos supplémentaires)
    notes = models.TextField(
        blank=True,
        help_text="Notes sur le client (ex: préfère être appelé le matin)"
    )
    
    class Meta:
        ordering = ['nom', 'prenom']  # Tri par nom puis prénom
        verbose_name = "Client"
        verbose_name_plural = "Clients"
    
    def __str__(self):
        """
        Ce qui s'affiche quand tu fais print(client) ou dans l'admin Django.
        Exemple: "Dupont Jean" ou juste "Dupont" si pas de prénom
        """
        if self.prenom:
            return f"{self.nom} {self.prenom}"
        return self.nom