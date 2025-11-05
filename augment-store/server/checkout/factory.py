from factory import Faker, SubFactory, post_generation
from factory.django import DjangoModelFactory
from accounts.factory import UserFactory
from carts.factory import CartItemFactory


class OrderFactory(DjangoModelFactory):
    created_by = SubFactory(UserFactory)
    status = "pending"

    class Meta:
        model = "checkout.Order"

    @post_generation
    def items(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            # If a list of order items was passed, use it
            for item in extracted:
                self.items.add(item)


class OrderItemFactory(DjangoModelFactory):
    order = SubFactory(OrderFactory)
    cart_item = SubFactory(CartItemFactory)
    created_by = SubFactory(UserFactory)

    class Meta:
        model = "checkout.OrderItem"


class PaymentFactory(DjangoModelFactory):
    order = SubFactory(OrderFactory)
    created_by = SubFactory(UserFactory)
    amount = Faker("pydecimal", left_digits=4, right_digits=2, positive=True)
    payment_method = "stripe"
    payment_status = "pending"

    class Meta:
        model = "checkout.Payment"

