from django.urls import path
from .admin_views import AdminCustomerListView

urlpatterns = [
    path('', AdminCustomerListView.as_view(), name='admin-customer-list'),
]