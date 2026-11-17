from django.shortcuts import render
from django.contrib.auth.decorators import login_required, user_passes_test


def is_store_admin(user):
    return user.is_authenticated and user.role == 'ADMIN'


@login_required
@user_passes_test(is_store_admin)
def admin_orders_page(request):
    return render(request, 'store/admin_orders.html')


@login_required
@user_passes_test(is_store_admin)
def admin_categories_page(request):
    return render(request, 'store/admin_categories.html')


@login_required
@user_passes_test(is_store_admin)
def admin_customers_page(request):
    return render(request, 'store/admin_customers.html')