from factory import Faker, SubFactory
from factory.django import DjangoModelFactory
from products.factory import ProductFactory
from accounts.factory import UserFactory
from .models import ProductStatistics, ProductView, CartAbandonment


class ProductStatisticsFactory(DjangoModelFactory):
    product = SubFactory(ProductFactory)
    view_count = Faker("random_int", min=0, max=1000)
    cart_add_count = Faker("random_int", min=0, max=500)
    cart_remove_count = Faker("random_int", min=0, max=200)
    purchase_count = Faker("random_int", min=0, max=100)

    class Meta:
        model = ProductStatistics


class ProductViewFactory(DjangoModelFactory):
    product = SubFactory(ProductFactory)
    user = SubFactory(UserFactory)

    class Meta:
        model = ProductView


class CartAbandonmentFactory(DjangoModelFactory):
    product = SubFactory(ProductFactory)
    user = SubFactory(UserFactory)
    quantity = Faker("random_int", min=1, max=10)

    class Meta:
        model = CartAbandonment

