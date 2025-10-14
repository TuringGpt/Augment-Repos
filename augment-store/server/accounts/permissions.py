
from rest_framework.permissions import BasePermission
from accounts.models import User

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.is_authenticated and user.is_admin


class IsMerchantUser(BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.is_authenticated and user.is_merchant


class IsMemberUser(BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.is_authenticated and user.is_member
