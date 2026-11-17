
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum

from accounts.models import User
from store.models import Product
from orders.models import Order
from orders.serializers import OrderSerializer
from store.permissions import IsStoreAdmin


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsStoreAdmin]

    def get(self, request):
        total_orders = Order.objects.count()

        total_revenue = (
            Order.objects
            .exclude(status='CANCELLED')
            .aggregate(total=Sum('total_amount'))['total']
            or 0
        )

        low_stock_products = Product.objects.filter(
            is_active=True,
            stock_quantity__lt=5
        ).count()

        total_customers = User.objects.filter(
            role='CUSTOMER'
        ).count()

        recent_orders = (
            Order.objects
            .select_related('user')
            .prefetch_related('items__product')
            .order_by('-created_at')[:5]
        )

        return Response({
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'low_stock_products': low_stock_products,
            'total_customers': total_customers,
            'recent_orders': OrderSerializer(
                recent_orders,
                many=True
            ).data
        })
