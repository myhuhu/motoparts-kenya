from django.urls import path

from .views import ReviewDeleteView, ReviewListCreateView

urlpatterns = [
    path("", ReviewListCreateView.as_view(), name="review_list"),
    path("<int:pk>/", ReviewDeleteView.as_view(), name="review_delete"),
]
