from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserProfileSerializer, UpdateUserProfileSerializer
from core.optimization import AutoOptimizeMixin


class UserProfileView(AutoOptimizeMixin, RetrieveUpdateAPIView):
    """
    View for retrieving and updating the authenticated user's profile.

    GET: Retrieve the current user's profile information
    PATCH/PUT: Update the current user's profile information
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    auto_select_related = ['profile_image', 'preferred_currency']
    queryset = User.objects.all()

    def get_object(self):
        """Return the current authenticated user from the optimized queryset"""
        from django.shortcuts import get_object_or_404
        return get_object_or_404(self.get_queryset(), pk=self.request.user.pk)

    def get_serializer_class(self):
        """Use different serializers for read and write operations"""
        if self.request.method in ['PATCH', 'PUT']:
            return UpdateUserProfileSerializer
        return UserProfileSerializer