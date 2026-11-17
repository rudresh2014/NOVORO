
from django.db import transaction
from django.db.models import ProtectedError, Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError

from .models import Category, Product, Cart, CartItem
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    CartSerializer,
)
from .permissions import IsStoreAdmin


# CATEGORY APIs

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStoreAdmin()]
        return [AllowAny()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsStoreAdmin()]
        return [AllowAny()]

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                "This category contains products and cannot be deleted."
            )


# PRODUCT APIs

class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        if (
            self.request.user.is_authenticated
            and self.request.user.role == 'ADMIN'
        ):
            queryset = Product.objects.all()
        else:
            queryset = Product.objects.filter(is_active=True)

        queryset = queryset.select_related('category')

        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        sort = self.request.query_params.get('sort')

        if category:
            queryset = queryset.filter(category_id=category)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )

        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        if sort == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort == 'newest':
            queryset = queryset.order_by('-created_at')

        return queryset

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStoreAdmin()]
        return [AllowAny()]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        if (
            self.request.user.is_authenticated
            and self.request.user.role == 'ADMIN'
        ):
            return Product.objects.all()

        return Product.objects.filter(is_active=True)

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsStoreAdmin()]
        return [AllowAny()]

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                "This product has past orders. Mark it inactive instead."
            )


# CART API

class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)

        cart = Cart.objects.prefetch_related(
            'items__product'
        ).get(pk=cart.pk)

        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartItemAddView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Quantity must be a valid number.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity < 1:
            return Response(
                {'error': 'Quantity must be at least 1.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        product = get_object_or_404(
            Product,
            id=product_id,
            is_active=True
        )

        if product.stock_quantity < 1:
            return Response(
                {'error': 'This product is out of stock.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart, created = Cart.objects.get_or_create(user=request.user)

        with transaction.atomic():
            item, item_created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )

            if not item_created:
                item.quantity += quantity

            if item.quantity > product.stock_quantity:
                return Response(
                    {
                        'error': (
                            f'Only {product.stock_quantity} units '
                            'are available.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            item.save()

        return Response(
            {
                'message': 'Product added to cart.',
                'cart_item': {
                    'product': product.name,
                    'quantity': item.quantity
                }
            },
            status=status.HTTP_200_OK
        )


class CartItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_item(self, request, pk):
        return get_object_or_404(
            CartItem,
            pk=pk,
            cart__user=request.user
        )

    def patch(self, request, pk):
        item = self.get_item(request, pk)
        quantity = request.data.get('quantity')

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Provide a valid quantity.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity < 1:
            return Response(
                {'error': 'Quantity must be at least 1.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity > item.product.stock_quantity:
            return Response(
                {
                    'error': (
                        f'Only {item.product.stock_quantity} units '
                        'are available.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        item.quantity = quantity
        item.save()

        return Response({
            'message': 'Cart quantity updated.',
            'cart_item': {
                'product': item.product.name,
                'quantity': item.quantity,
                'subtotal': item.subtotal
            }
        })

    def delete(self, request, pk):
        item = self.get_item(request, pk)
        item.delete()

        return Response(
            {'message': 'Product removed from cart.'},
            status=status.HTTP_200_OK
        )
