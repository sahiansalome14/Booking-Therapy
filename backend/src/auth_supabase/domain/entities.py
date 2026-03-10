from dataclasses import dataclass
from uuid import UUID

# Entidad de dominio pura que representa a un usuario registrado en la plataforma.
# Puede representar tanto a un cliente como a un terapeuta, según el campo role.


@dataclass
class Profile:
    id: UUID  # Identificador interno único del sistema 
    external_auth_id: str  # ID proveniente del proveedor de autenticación (Supabase)
    email: str  
    role: str  # client o therapist
    full_name: str = ""  # Nombre completo (opcional, sincronizado desde Supabase)

    def __post_init__(self):
        # Garantiza que el id siempre sea un objeto UUID, incluso si llega como string
        if not isinstance(self.id, UUID):
            self.id = UUID(str(self.id))
