"""
Adaptador para consumir la API de productos del Equipo 4 (Tienda de Ropa).
Implementa el patrón Adapter para desacoplar la lógica de consumo.
"""

import requests
from typing import Dict, List, Optional
from django.conf import settings


class ProductAdapter:
    """
    Adapter para consumir la API de productos del Equipo 4.
    """

    BASE_URL = "http://54.157.70.228"
    ENDPOINT = "/api/v1/products/"

    # Mapeo de categorías según el tipo de terapia
    CATEGORY_MAPPING = {
        "yoga": "deportiva",
        "pilates": "deportiva",
        "masaje": "loungewear",
        "masaje terapeutico": "loungewear",
        "acupuntura": "confort",
        "reiki": "confort",
    }

    def __init__(self, category: str, limit: int = 3):
        """
        Inicializa el adapter con la categoría y límite.

        Args:
            category: Categoría de producto (deportiva, loungewear, confort)
            limit: Número máximo de productos a retornar (default: 3)
        """
        self.category = category
        self.limit = limit

    @classmethod
    def from_terapia(cls, terapia_tipo: str, limit: int = 3):
        """
        Crea un adapter a partir del tipo de terapia reservada.

        Args:
            terapia_tipo: Tipo de terapia (yoga, masaje, acupuntura, etc.)
            limit: Número máximo de productos (default: 3)

        Returns:
            ProductAdapter: Instancia del adapter con la categoría mapeada
        """
        terapia_normalizada = terapia_tipo.lower().strip()
        category = cls.CATEGORY_MAPPING.get(terapia_normalizada, "loungewear")
        return cls(category=category, limit=limit)

    def fetch_products(self) -> Dict:
        """
        Consulta la API del Equipo 4 y retorna los productos.

        Returns:
            Dict con el formato estandarizado del contrato
        """
        url = f"{self.BASE_URL}{self.ENDPOINT}"
        params = {
            "category": self.category,
            "limit": self.limit
        }

        print(f"[ProductAdapter] Consultando: {url} con params={params}")

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            # Validar que la respuesta tiene la estructura esperada
            if data.get("status") == "success":
                return self._format_response(data)
            else:
                return self._error_response(
                    "API_RESPONSE_ERROR",
                    data.get("message", "Error en la API externa")
                )

        except requests.exceptions.ConnectionError:
            return self._error_response(
                "CONNECTION_ERROR",
                "No se pudo conectar con el servicio de productos"
            )
        except requests.exceptions.Timeout:
            return self._error_response(
                "TIMEOUT_ERROR",
                "El servicio de productos no respondió a tiempo"
            )
        except requests.exceptions.RequestException as e:
            return self._error_response("REQUEST_ERROR", str(e))

    def _format_response(self, data: Dict) -> Dict:
        """
        Formatea la respuesta de la API externa al contrato esperado.
        """
        products = data.get("products", [])

        return {
            "status": "success",
            "timestamp": data.get("timestamp"),
            "total_results": len(products),
            "products": [
                {
                    "product_id": p.get("product_id"),
                    "name": p.get("name"),
                    "description": p.get("description"),
                    "category": p.get("category"),
                    "unit_price": p.get("unit_price"),
                    "currency": p.get("currency", "COP"),
                    "cover_image_url": p.get("cover_image_url"),
                    "purchase_url": p.get("purchase_url"),
                    "is_eco_friendly": p.get("is_eco_friendly", False)
                }
                for p in products
            ]
        }

    def _error_response(self, code: str, message: str) -> Dict:
        """
        Retorna una respuesta de error según el contrato.
        """
        return {
            "status": "error",
            "code": code,
            "message": message,
            "products": []
        }
