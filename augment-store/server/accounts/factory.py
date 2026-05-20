
from factory import Faker
from factory.django import DjangoModelFactory


class UserFactory(DjangoModelFactory):
    email = Faker("email")
    password = Faker("password")
    first_name = Faker("first_name")
    last_name = Faker("last_name")
    is_active = True

    # user the set_password method to set the password
    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        user = super()._create(model_class, *args, **kwargs)
        user.set_password(kwargs.get("password"))
        user.save()
        return user

    class Meta:
        model = "accounts.User"
        django_get_or_create = ["email"]
        
