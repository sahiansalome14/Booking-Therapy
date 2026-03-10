# Validan y transforman los datos de entrada antes de pasarlos al Service Layer.
from rest_framework import serializers


# Serializer para el registro de nuevos usuarios
class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True
    )  # write_only: no se devuelve en la respuesta
    role = serializers.ChoiceField(
        choices=[("client", "Client"), ("therapist", "Therapist")]
    )


# Serializer para el inicio de sesión con email y contraseña
class EmailPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# Serializer para la asignación de rol 
class SetRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=[("client", "Client"), ("therapist", "Therapist")]
    )
