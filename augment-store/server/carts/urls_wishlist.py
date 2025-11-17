
from django.urls import path
from .views import ListWishListProductsView, AddToWishlistView, RemoveFromWishlistView

app_name = "wishlist"
urlpatterns = [
    path('', ListWishListProductsView.as_view(), name='wishlist_detail'),
    path('add/', AddToWishlistView.as_view(), name='add_to_wishlist'),
    path('remove/', RemoveFromWishlistView.as_view(), name='remove_from_wishlist'),
]
