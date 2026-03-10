from rest_framework import serializers

# Inserción de configuración global de la plataforma
from agenda.infrastructure.models import GlobalAgendaConfig
from auth_supabase.infrastructure.models import ProfileModel


# Serializador para representar un espacio de tiempo disponible (slot).
class SlotSerializer(serializers.Serializer):
    """
    Transforma la estructura de un slot calculado a un formato JSON simple.
    """

    start = serializers.CharField()
    end = serializers.CharField()
    date = serializers.DateField()


# Serializador para la disponibilidad recurrente del terapeuta.
class AvailabilitySerializer(serializers.Serializer):
    """
    Mapea los campos internos del modelo a nombres para el frontend.
    """

    day = serializers.IntegerField(source="day_of_week")
    start = serializers.TimeField(source="hora_inicio")
    end = serializers.TimeField(source="hora_fin")


# Serializador para los bloqueos manuales en la agenda.
class BlockSerializer(serializers.Serializer):
    """
    Representa periodos de tiempo donde el terapeuta no está disponible.
    """

    internal_id = serializers.UUIDField(read_only=True)
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    reason = serializers.CharField(required=False, allow_blank=True)


# Serializador detallado para mostrar información de una cita.
class AppointmentSerializer(serializers.Serializer):
    internal_id = serializers.UUIDField(read_only=True)
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    modality = serializers.CharField()
    meeting_link = serializers.URLField(required=False, allow_null=True)

    # Campos de visualización (se pueden pasar en el objeto o contexto)
    therapist_name = serializers.CharField(required=False)
    therapist_email = serializers.EmailField(required=False)
    patient_name = serializers.CharField(required=False)
    patient_email = serializers.EmailField(required=False)
    therapist_location = serializers.CharField(required=False)

    def to_representation(self, instance):
        # Soporte tanto para domain entities como para modelos Django
        data = super().to_representation(instance)

        # Si es un modelo Django, mapear campos que no coinciden o son relacionales
        if hasattr(instance, "therapist") and not data.get("therapist_name"):
            data["therapist_name"] = (
                instance.therapist.user.get_full_name() or instance.therapist.user.email
            )
            data["therapist_email"] = instance.therapist.user.email
            data["therapist_location"] = instance.therapist.location

        if hasattr(instance, "patient") and not data.get("patient_name"):
            data["patient_name"] = (
                instance.patient.user.get_full_name() or instance.patient.user.email
            )
            data["patient_email"] = instance.patient.user.email

        # Asegurar que internal_id se mapee a id para el frontend si es necesario
        data["id"] = data.get("internal_id")
        return data


# Serializador para validar la entrada al crear una nueva cita.
class CreateAppointmentSerializer(serializers.Serializer):
    """
    Define el contrato de datos necesario para procesar una reserva.
    """

    therapist_id = serializers.UUIDField()
    target_date = serializers.DateField()
    start_time = serializers.TimeField()
    modality = serializers.CharField(
        required=False, allow_blank=True, default="VIRTUAL"
    )
    patient_name = serializers.CharField(required=False, allow_blank=True)
    patient_email = serializers.EmailField(required=False)
    patient_phone = serializers.CharField(required=False, allow_blank=True)
    payment_info = serializers.JSONField(required=False)


# Serializador para el listado público de terapeutas.
class TherapistSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    email = serializers.EmailField()
    bio = serializers.CharField(allow_blank=True)
    specialty = serializers.CharField(source="specialization", required=False)
    session_price = serializers.FloatField(source="hourly_rate")
    experience_years = serializers.IntegerField(required=False)
    location = serializers.CharField(allow_blank=True, required=False)
    avatar_url = serializers.URLField(allow_null=True, required=False)

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Mapping para compatibilidad con el frontend
        data["image"] = (
            data.get("avatar_url")
            or f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.get('email')}"
        )
        data["price"] = data.get("session_price")
        data["experience"] = f"{data.get('experience_years', 0)} años"
        data["rating"] = 4.9  # Mock
        data["reviews"] = 124  # Mock

        config = GlobalAgendaConfig.get_config()
        data["session_duration"] = config.duracion_sesion_minutos
        data["currency"] = "COP"

        return data


# Especializado para la actualización parcial de los datos del propio terapeuta.
class TherapistProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileModel
        fields = [
            "bio",
            "specialty",
            "session_price",
            "experience_years",
            "location",
            "avatar_url",
        ]
