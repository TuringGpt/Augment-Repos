import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.query import QuerySet
from django.utils.translation import gettext as _


class UserManager(BaseUserManager):

    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    """

    def get_queryset(self) -> QuerySet:
        return super().get_queryset().order_by("email")

    def create_user(self, email, password, **extra_fields):
        """
        Create and save a User with the given email and password.
        """
        if not email:
            raise ValueError(_("The Email must be set"))
        if not password:
            raise ValueError(_("The Password must be set"))
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", False)
        user: "User" = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("username", email)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):

    class Gender:
        MALE = "Male"
        FEMALE = "Female"
        OTHER = "Other"

        CHOICES = (
            (MALE, _("Male")),
            (FEMALE, _("Female")),
            (OTHER, _("Other")),
        )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField( _("username"), max_length=255, null=True)
    email = models.EmailField(_("user email"), max_length=254, unique=True)
    mobile = models.CharField( _("mobile number"), max_length=20, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=Gender.CHOICES, default=Gender.OTHER)
    image = models.ImageField(
        upload_to="user_images",
        null=True,
        blank=True,
    )

    objects: UserManager = UserManager()
    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = [ "username", "mobile"]

    def __str__(self) -> str:
        return self.full_name

    @property
    def is_registration_completed(self):
        if self.first_name:
            return True
        return False
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

