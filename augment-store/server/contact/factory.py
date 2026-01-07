from factory import Faker
from factory.django import DjangoModelFactory


class ContactMessageFactory(DjangoModelFactory):
    name = Faker("name")
    email = Faker("email")
    message = Faker("text")

    class Meta:
        model = "contact.ContactMessage"
