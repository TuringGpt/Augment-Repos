from factory import Faker

from factory.django import DjangoModelFactory

class NewsletterFactory(DjangoModelFactory):
    email = Faker("email")

    class Meta:
        model = "newsletter.Newsletter"
