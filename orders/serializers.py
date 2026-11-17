
from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )
    subtotal = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'quantity',
            'price_at_purchase',
            'subtotal'
        ]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    class Meta:
        model = Order
        fields = [
            'id',
            'username',
            'shipping_address',
            'status',
            'total_amount',
            'items',
            'created_at'
        ]
        read_only_fields = fields
