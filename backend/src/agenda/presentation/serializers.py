from rest_framework import serializers

class SlotSerializer(serializers.Serializer):
    start = serializers.CharField()
    end = serializers.CharField()
    date = serializers.DateField()

class AvailabilitySerializer(serializers.Serializer):
    day = serializers.IntegerField(source='day_of_week')
    start = serializers.TimeField(source='hora_inicio')
    end = serializers.TimeField(source='hora_fin')

class BlockSerializer(serializers.Serializer):
    internal_id = serializers.UUIDField(read_only=True)
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    reason = serializers.CharField(required=False, allow_blank=True)

class AppointmentSerializer(serializers.Serializer):
    internal_id = serializers.UUIDField(read_only=True)
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    status = serializers.CharField()
    therapist_name = serializers.CharField(source='therapist.user.email', read_only=True)
    patient_name = serializers.CharField(source='patient.user.email', read_only=True)

class CreateAppointmentSerializer(serializers.Serializer):
    therapist_id = serializers.UUIDField()
    target_date = serializers.DateField()
    start_time = serializers.TimeField()
