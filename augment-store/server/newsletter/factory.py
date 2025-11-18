from factory import Faker

from factory.django import DjangoModelFactory

class NewsletterFactory(DjangoModelFactory):
    email = Faker("test@example.com")

    class Meta:
        model = "newsletter.Newsletter"
