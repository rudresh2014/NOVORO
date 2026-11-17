
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Order
from .serializers import OrderSerializer


class AdminOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        orders = Order.objects.select_related('user').prefetch_related(
            'items__product'
        ).order_by('-created_at')

        return Response(OrderSerializer(orders, many=True).data)


class AdminOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        transitions = {
            'PLACED': 'PACKED',
            'PACKED': 'SHIPPED',
            'SHIPPED': 'DELIVERED',
        }

        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update(), pk=pk
            )

            if transitions.get(order.status) != new_status:
                return Response(
                    {'message': 'Invalid order status transition.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])

        return Response({
            'message': 'Order status updated successfully.',
            'order': OrderSerializer(order).data
        })
