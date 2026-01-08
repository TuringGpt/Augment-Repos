import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.query import QuerySet
from django.utils.translation import gettext as _
from django.db.models.signals import post_save
from django.dispatch import receiver

from django.conf import settings
from core.models import BaseModel
from currencies.models import Currency


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

        extra_fields.setdefault("is_active", True if settings.DISABLE_EMAIL_VERIFICATION else False)
        user: "User" = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("username", email)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):

    class Role:
        ADMIN = "admin"
        MERCHANT = "merchant"
        MEMBER = "member"

        CHOICES = (
            (ADMIN, _("Admin")),
            (MERCHANT, _("Merchant")),
            (MEMBER, _("Member")),
        )

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
    profile_image = models.ForeignKey(
        "storage.File", null=True, blank=True, on_delete=models.SET_NULL
    )
    role = models.CharField(max_length=20, choices=Role.CHOICES, default=Role.MEMBER)
    preferred_currency = models.ForeignKey(Currency, on_delete=models.SET_NULL, null=True, blank=True)
    objects: UserManager = UserManager()
    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = [ "username", "mobile"]

    def __str__(self) -> str:
        return self.full_name

    @property
    def is_registration_completed(self):
        return True
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_merchant(self):
        return self.role == self.Role.MERCHANT

    @property
    def is_member(self):
        return self.role == self.Role.MEMBER


class MerchantDetail(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='merchant_detail')
    store_name = models.CharField(max_length=255)
    store_description = models.TextField()
    store_image = models.ForeignKey("storage.File", on_delete=models.SET_NULL, null=True, blank=True)



@receiver(post_save, sender=User)
def create_merchant_detail(sender, instance, created, **kwargs):
    if instance.role == User.Role.MERCHANT:
        MerchantDetail.objects.get_or_create(user=instance, defaults={
            "store_name": instance.username or instance.email,
            "store_description": "",
            "store_image": None,
        })
