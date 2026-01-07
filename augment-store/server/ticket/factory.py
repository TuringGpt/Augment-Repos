from factory import Faker, SubFactory
from factory.django import DjangoModelFactory

from accounts.factory import UserFactory


class TicketFactory(DjangoModelFactory):
    title = Faker("sentence", nb_words=5)
    description = Faker("text", max_nb_chars=500)
    status = Faker("word")
    priority = Faker("word")
    assignee = SubFactory(UserFactory)
    reporter = SubFactory(UserFactory)

    class Meta:
        model = "ticket.Ticket"

class CommentFactory(DjangoModelFactory):
    ticket = SubFactory(TicketFactory)
    user = SubFactory(UserFactory)
    content = Faker("text", max_nb_chars=500)

    class Meta:
        model = "ticket.Comment"
