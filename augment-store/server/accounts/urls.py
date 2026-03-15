from django.urls import path
from .views import UserProfileView, AdminUserListView, AdminUserUpdateView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<uuid:pk>/', AdminUserUpdateView.as_view(), name='admin_user_update'),
]

