from django.urls import path

from .admin_views import AdminCustomerDetailView, AdminCustomerListView, AdminStatsView

urlpatterns = [
    path("stats/", AdminStatsView.as_view(), name="admin_stats"),
    path("customers/", AdminCustomerListView.as_view(), name="admin_customers"),
    path("customers/<int:pk>/", AdminCustomerDetailView.as_view(), name="admin_customer_detail"),
]
