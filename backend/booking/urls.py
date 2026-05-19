"""
Configuración de URLs del proyecto principal.
"""

from django.contrib import admin
from django.urls import path, include

# Importa la vista que creamos
from booking.api.views import ProductRecommendationView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # ============================================
    # ENDPOINT PARA RECOMENDACIONES DE PRODUCTOS
    # Integración con Equipo 4 (Tienda de Ropa)
    # ============================================
    path('api/v1/products/recommendations/', 
         ProductRecommendationView.as_view(), 
         name='product-recommendations'),
    
    # Tus otras URLs aquí (si las tienes)
    # path('api/auth/', include('booking.auth_supabase.urls')),
    # path('api/agenda/', include('booking.agenda.urls')),
    # etc.
]
