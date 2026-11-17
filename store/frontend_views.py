
from django.shortcuts import render


def home_page(request):
    return render(request, 'store/home.html')


def shop_page(request):
    return render(request, 'store/shop.html')


def product_detail_page(request, pk):
    return render(request, 'store/product_detail.html', {'product_id': pk})


def cart_page(request):
    return render(request, 'store/cart.html')


def checkout_page(request):
    return render(request, 'store/checkout.html')


def orders_page(request):
    return render(request, 'orders/my_orders.html')


def admin_dashboard_page(request):
    return render(request, 'store/admin_dashboard.html')


def admin_products_page(request):
    return render(request, 'store/admin_products.html')


def login_page(request):
    return render(request, 'accounts/login.html')


def register_page(request):
    return render(request, 'accounts/register.html')
