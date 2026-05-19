from rest_framework import serializers

class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
