from factory import Faker, SubFactory, post_generation
from factory.django import DjangoModelFactory
from accounts.factory import UserFactory
from products.factory import ProductFactory


class CartItemFactory(DjangoModelFactory):
    product = SubFactory(ProductFactory)
    quantity = Faker("random_int", min=1, max=10)
    created_by = SubFactory(UserFactory)

    class Meta:
        model = "carts.CartItem"


class CartFactory(DjangoModelFactory):
    user = SubFactory(UserFactory)

    class Meta:
        model = "carts.Cart"

    @post_generation
    def items(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            # If a list of cart items was passed, use it
            for item in extracted:
                self.items.add(item)
