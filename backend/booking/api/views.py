"""
Vistas para la API del proyecto.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from booking.adapters.product_adapter import ProductAdapter


class ProductRecommendationView(APIView):
    """
    Endpoint para obtener recomendaciones de productos
    basadas en el tipo de terapia reservada.
    
    GET /api/v1/products/recommendations/?terapia=yoga&limit=3
    
    Query Parameters:
        - terapia: tipo de terapia (yoga, masaje, acupuntura, reiki, pilates)
        - limit: número máximo de productos (default: 3, max: 10)
    
    Response:
        {
            "status": "success",
            "timestamp": "2026-05-19T14:52:24Z",
            "total_results": 3,
            "products": [...]
        }
    """

    def get(self, request):
        # Obtener parámetros de la query string
        terapia_tipo = request.query_params.get('terapia', 'masaje')
        
        # Validar y procesar el límite
        try:
            limit = int(request.query_params.get('limit', 3))
            # Limitar a máximo 10 productos para no sobrecargar
            limit = min(limit, 10)
        except ValueError:
            limit = 3

        # Usar el adapter para obtener productos
        adapter = ProductAdapter.from_terapia(terapia_tipo, limit)
        result = adapter.fetch_products()

        # Devolver la respuesta (siempre 200 OK, el status está dentro del JSON)
        return Response(result, status=status.HTTP_200_OK)
