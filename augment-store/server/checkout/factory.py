import factory
from factory import Faker, SubFactory, post_generation
from factory.django import DjangoModelFactory
from accounts.factory import UserFactory
from carts.factory import CartItemFactory
from products.factory import ProductFactory


class ShippingAddressFactory(DjangoModelFactory):
    user = SubFactory(UserFactory)
    first_name = Faker("first_name")
    last_name = Faker("last_name")
    address_line_1 = Faker("street_address")
    address_line_2 = Faker("secondary_address")
    city = Faker("city")
    state = Faker("state")
    postal_code = Faker("postcode")
    country = Faker("country")

    class Meta:
        model = "checkout.ShippingAddress"


class BillingAddressFactory(DjangoModelFactory):
    user = SubFactory(UserFactory)
    first_name = Faker("first_name")
    last_name = Faker("last_name")
    address_line_1 = Faker("street_address")
    address_line_2 = Faker("secondary_address")
    city = Faker("city")
    state = Faker("state")
    postal_code = Faker("postcode")
    country = Faker("country")

    class Meta:
        model = "checkout.BillingAddress"


class ContactInformationFactory(DjangoModelFactory):
    user = SubFactory(UserFactory)
    first_name = Faker("first_name")
    last_name = Faker("last_name")
    email = Faker("email")
    phone = Faker("numerify", text="+1##########")  # Generates a 12-character phone number

    class Meta:
        model = "checkout.ContactInformation"


class OrderFactory(DjangoModelFactory):
    created_by = SubFactory(UserFactory)
    status = "pending"
    shipping_address = SubFactory(ShippingAddressFactory, user=factory.SelfAttribute('..created_by'))
    billing_address = SubFactory(BillingAddressFactory, user=factory.SelfAttribute('..created_by'))
    contact_information = SubFactory(ContactInformationFactory, user=factory.SelfAttribute('..created_by'))

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

    @post_generation
    def product(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            self.product = self.cart_item.product
        else:
            self.product = ProductFactory()

    @post_generation
    def quantity(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            self.quantity = self.cart_item.quantity
        else:
            self.quantity = 1


class PaymentFactory(DjangoModelFactory):
    order = SubFactory(OrderFactory)
    created_by = SubFactory(UserFactory)
    amount = Faker("pydecimal", left_digits=4, right_digits=2, positive=True)
    payment_method = "stripe"
    payment_status = "pending"

    class Meta:
        model = "checkout.Payment"

