from dataclasses import dataclass
from uuid import UUID

@dataclass
class Profile:
    id: UUID
    external_auth_id: str
    email: str
    role: str

    def __post_init__(self):
        if not isinstance(self.id, UUID):
            self.id = UUID(str(self.id))
