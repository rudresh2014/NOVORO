
from django.urls import path
from .admin_views import AdminOrderListView, AdminOrderStatusView

urlpatterns = [
    path('', AdminOrderListView.as_view(), name='admin-order-list'),
    path('<int:pk>/status/', AdminOrderStatusView.as_view(), name='admin-order-status'),
]
