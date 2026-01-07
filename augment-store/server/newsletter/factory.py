from factory import Sequence
from factory.django import DjangoModelFactory


class NewsletterFactory(DjangoModelFactory):
    email = Sequence(lambda n: f"newsletter{n}@example.com")

    class Meta:
        model = "newsletter.Newsletter"
