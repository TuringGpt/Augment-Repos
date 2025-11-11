
from .models import Payment
import stripe

class StripeService:
    def __init__(self):
        pass

    def create_payment_session(self, payment: Payment):
        from django.conf import settings
        from django.urls import reverse

        order = payment.order
        stripe.api_key = settings.STRIPE_SECRET_KEY

        line_items = [
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": item.cart_item.product.id,
                    },
                    "unit_amount": int(item.cart_item.product.price * 100),
                },

                "quantity": item.cart_item.quantity,
            }
            for item in order.items.all()
        ]

        redirect_url = reverse("v1:checkout_payments:stripe_redirect")
        session = stripe.checkout.Session.create(
            ui_mode="embedded",
            mode="payment",
            line_items=line_items,
            return_url=f"{settings.APP_DOMAIN}{redirect_url}?payment_id={payment.id}",
        )

        return session

