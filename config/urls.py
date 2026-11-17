from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from store.frontend_views import (
    home_page,
    shop_page,
    product_detail_page,
    cart_page,
    checkout_page,
    orders_page,
    admin_dashboard_page,
    admin_products_page,
    login_page,
    register_page,
)

from store.admin_pages import (
    admin_orders_page,
    admin_categories_page,
    admin_customers_page,
)


admin.site.site_header = "NOVORA | Store Management"
admin.site.site_title = "NOVORA Admin"
admin.site.index_title = "Store Administration Dashboard"


urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # APIs
    path('api/accounts/', include('accounts.urls')),
    path('api/store/', include('store.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/admin/orders/', include('orders.admin_urls')),
    path('api/admin/customers/', include('accounts.admin_urls')),

    # Customer pages
    path('', home_page, name='home'),
    path('shop/', shop_page, name='shop'),
    path('product/<int:pk>/', product_detail_page, name='product-detail-page'),
    path('cart/', cart_page, name='cart-page'),
    path('checkout/', checkout_page, name='checkout-page'),
    path('orders/', orders_page, name='orders-page'),
    path('login/', login_page, name='login-page'),
    path('register/', register_page, name='register-page'),

    # Admin pages
    path('dashboard/', admin_dashboard_page, name='admin-dashboard-page'),
    path('dashboard/products/', admin_products_page, name='admin-products-page'),
    path('dashboard/orders/', admin_orders_page, name='admin-orders-page'),
    path('dashboard/categories/', admin_categories_page, name='admin-categories-page'),
    path('dashboard/customers/', admin_customers_page, name='admin-customers-page'),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )