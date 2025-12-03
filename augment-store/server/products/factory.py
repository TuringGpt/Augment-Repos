
from factory import Faker, SubFactory, LazyAttribute, post_generation
from factory.django import DjangoModelFactory
from accounts.factory import UserFactory
from storage.factory import FileFactory
from .models import Product, ProductBrand, ProductCategory



class ProductBrandFactory(DjangoModelFactory):
    name = Faker("company")
    description = Faker("text", max_nb_chars=200)
    created_by = SubFactory(UserFactory)
    image = SubFactory(FileFactory)

    class Meta:
        model = ProductBrand
        django_get_or_create = ["name"]


class ProductCategoryFactory(DjangoModelFactory):
    name = Faker("word")
    slug = LazyAttribute(lambda obj: obj.name.lower().replace(" ", "-"))
    description = Faker("text", max_nb_chars=200)
    created_by = SubFactory(UserFactory)
    parent = None
    image = SubFactory(FileFactory)

    class Meta:
        model = ProductCategory
        django_get_or_create = ["name"]


class ProductFactory(DjangoModelFactory):
    name = Faker("catch_phrase")
    description = Faker("text", max_nb_chars=500)
    price = Faker("pydecimal", left_digits=4, right_digits=2, positive=True)
    brand = SubFactory(ProductBrandFactory)
    category = SubFactory(ProductCategoryFactory)
    created_by = SubFactory(UserFactory)
    quantity = Faker("random_int", min=0, max=1000)
    rating = Faker("pydecimal", left_digits=1, right_digits=2, positive=True)

    class Meta:
        model = Product

    @post_generation
    def images(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            # If a list of images was passed, use it
            for image in extracted:
                self.images.add(image)
        else:
            # Otherwise, create 3 default images
            for _ in range(3):
                self.images.add(FileFactory())


class SimpleProductFactory(DjangoModelFactory):
    """Lightweight product factory for tests that don't need images.

    This factory creates products without images to reduce database overhead.
    Use this for tests that only need basic product data without image relationships.
    """
    name = Faker("catch_phrase")
    description = Faker("text", max_nb_chars=200)
    price = Faker("pydecimal", left_digits=4, right_digits=2, positive=True)
    brand = SubFactory(ProductBrandFactory)
    category = SubFactory(ProductCategoryFactory)
    created_by = SubFactory(UserFactory)
    quantity = Faker("random_int", min=0, max=100)
    rating = Faker("pydecimal", left_digits=1, right_digits=2, positive=True)

    class Meta:
        model = Product

    @post_generation
    def images(self, create, extracted, **kwargs):
        # Don't create any images by default for simple factory
        if extracted:
            for image in extracted:
                self.images.add(image)

