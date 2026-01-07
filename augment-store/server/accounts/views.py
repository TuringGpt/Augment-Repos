from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UpdateUserProfileSerializer, UserProfileSerializer


class UserProfileView(RetrieveUpdateAPIView):
    """
    View for retrieving and updating the authenticated user's profile.

    GET: Retrieve the current user's profile information
    PATCH/PUT: Update the current user's profile information
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        """Return the current authenticated user"""
        return self.request.user

    def get_serializer_class(self):
        """Use different serializers for read and write operations"""
        if self.request.method in ['PATCH', 'PUT']:
            return UpdateUserProfileSerializer
        return UserProfileSerializer
