
from django.urls import path
from .views import (
    CheckoutView,
    OrderListView,
    OrderDetailView,
    CancelOrderView,
    UpdateOrderStatusView,
)

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('', OrderListView.as_view(), name='order-list'),
    path('<int:pk>/cancel/', CancelOrderView.as_view(), name='order-cancel'),
    path('<int:pk>/update-status/', UpdateOrderStatusView.as_view(), name='order-update-status'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
