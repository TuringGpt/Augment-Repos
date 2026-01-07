
from factory import Faker, SubFactory
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice

from accounts.factory import UserFactory
from notifications.models import Notification


class NotificationFactory(DjangoModelFactory):
    title = Faker("sentence", nb_words=5)
    description = Faker("text", max_nb_chars=500)
    user = SubFactory(UserFactory)
    is_read = FuzzyChoice([True, False])

    class Meta:
        model = Notification
