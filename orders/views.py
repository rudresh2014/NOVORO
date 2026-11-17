
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

from store.models import Cart, Product
from .models import Order, OrderItem
from .serializers import OrderSerializer


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        shipping_address = request.data.get(
            'shipping_address', ''
        ).strip()

        if not shipping_address:
            return Response(
                {'error': 'Shipping address is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                cart = Cart.objects.select_for_update().get(
                    user=request.user
                )

                cart_items = list(
                    cart.items.select_related('product').all()
                )

                if not cart_items:
                    raise ValidationError('Your cart is empty.')

                total_amount = 0
                order_products = []

                for item in cart_items:
                    product = Product.objects.select_for_update().get(
                        pk=item.product_id
                    )

                    if not product.is_active:
                        raise ValidationError(
                            f'{product.name} is no longer available.'
                        )

                    if item.quantity > product.stock_quantity:
                        raise ValidationError(
                            f'Only {product.stock_quantity} units of '
                            f'{product.name} are available.'
                        )

                    subtotal = product.price * item.quantity
                    total_amount += subtotal

                    order_products.append({
                        'product': product,
                        'quantity': item.quantity,
                        'price': product.price,
                    })

                order = Order.objects.create(
                    user=request.user,
                    shipping_address=shipping_address,
                    total_amount=total_amount,
                    status='PLACED'
                )

                for item in order_products:
                    OrderItem.objects.create(
                        order=order,
                        product=item['product'],
                        quantity=item['quantity'],
                        price_at_purchase=item['price']
                    )

                    item['product'].stock_quantity -= item['quantity']
                    item['product'].save(
                        update_fields=['stock_quantity']
                    )

                cart.items.all().delete()

            return Response(
                {
                    'message': 'Order placed successfully.',
                    'order': OrderSerializer(order).data
                },
                status=status.HTTP_201_CREATED
            )

        except Cart.DoesNotExist:
            return Response(
                {'error': 'Your cart is empty.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class OrderListView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items__product').order_by('-created_at')


class OrderDetailView(RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items__product')


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update(),
                pk=pk,
                user=request.user
            )

            if order.status != 'PLACED':
                return Response(
                    {
                        'error': (
                            'Only orders with PLACED status '
                            'can be cancelled.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            order_items = list(
                order.items.select_related('product').order_by(
                    'product_id'
                )
            )

            for item in order_items:
                product = Product.objects.select_for_update().get(
                    pk=item.product_id
                )
                product.stock_quantity += item.quantity
                product.save(update_fields=['stock_quantity'])

            order.status = 'CANCELLED'
            order.save(update_fields=['status', 'updated_at'])

        return Response(
            {
                'message': 'Order cancelled successfully.',
                'order': OrderSerializer(order).data
            },
            status=status.HTTP_200_OK
        )


class UpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only store admins can update order status.'},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')

        allowed_transitions = {
            'PLACED': 'PACKED',
            'PACKED': 'SHIPPED',
            'SHIPPED': 'DELIVERED',
        }

        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update(),
                pk=pk
            )

            expected_status = allowed_transitions.get(order.status)

            if expected_status is None:
                return Response(
                    {
                        'error': (
                            'This order cannot be modified because '
                            'it is already delivered or cancelled.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if new_status != expected_status:
                return Response(
                    {
                        'error': (
                            f'Invalid status transition. '
                            f'Next allowed status is {expected_status}.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])

        return Response(
            {
                'message': 'Order status updated successfully.',
                'order': OrderSerializer(order).data
            },
            status=status.HTTP_200_OK
        )
