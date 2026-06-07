# Le mixin a été déplacé dans l'app mixins/.
# Re-export pour ne pas casser d'éventuels imports existants.
from mixins.models import SoftDeleteMixin, SuppressionBloqueeError  # noqa: F401
