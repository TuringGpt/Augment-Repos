
from rest_framework.permissions import BasePermission
from accounts.models import User

class hasAdminRole(BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.is_authenticated and user.is_admin


class hasMerchantRole(BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.is_authenticated and user.is_merchant


class hasMemberRole(BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.is_authenticated and user.is_member
