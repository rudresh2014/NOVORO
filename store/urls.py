
from django.urls import path

from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    ProductListCreateView,
    ProductDetailView,
    CartView,
    CartItemAddView,
    CartItemDetailView,
)

from .dashboard_views import AdminDashboardView

urlpatterns = [
    path('categories/', CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),

    path('products/', ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),

    path('cart/', CartView.as_view(), name='cart'),
    path('cart/add/', CartItemAddView.as_view(), name='cart-add'),
    path('cart/items/<int:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),

    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
]
