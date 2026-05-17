from infrastructure.persistence.models import Profile, GlobalAgendaConfig

def get_profile_by_internal_id(db, internal_id: str):
    return db.query(Profile).filter(Profile.internal_id == internal_id).first()


def get_profile_by_external_auth_id(db, external_auth_id: str):
    return db.query(Profile).filter(Profile.external_auth_id == external_auth_id).first()


def get_or_create_config(db) -> GlobalAgendaConfig:
    config = db.query(GlobalAgendaConfig).filter_by(id=1).first()
    if not config:
        config = GlobalAgendaConfig(id=1)
        db.add(config)
        db.commit()
    return config


def resolve_therapist(db, therapist_id: str):
    """Busca terapeuta por internal_id o external_auth_id."""
    t = get_profile_by_internal_id(db, therapist_id)
    if not t:
        t = get_profile_by_external_auth_id(db, therapist_id)
    return t
