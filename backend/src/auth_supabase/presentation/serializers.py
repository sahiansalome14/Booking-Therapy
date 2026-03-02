
from rest_framework import serializers

class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[("client", "Client"), ("therapist", "Therapist")])

class EmailPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class SetRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=[("client", "Client"), ("therapist", "Therapist")])