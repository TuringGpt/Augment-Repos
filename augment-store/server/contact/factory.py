from factory import Faker
from factory.django import DjangoModelFactory

class ContactMessageFactory(DjangoModelFactory):
    name = Faker("name")
    email = Faker("email")
    subject = Faker("sentence")
    message = Faker("text")

    class Meta:
        model = "contact.ContactMessage"
