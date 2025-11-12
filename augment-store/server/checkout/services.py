
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

        # Update payment with Stripe payment intent ID
        payment.stripe_payment_intent_id = session.payment_intent
        payment.save()

        return session

    def check_and_update_payment_status(self, payment: Payment):
        from django.conf import settings

        stripe.api_key = settings.STRIPE_SECRET_KEY

        if not payment.stripe_payment_intent_id:
            return Payment.PaymentStatus.PENDING
        
        payment_intent = stripe.PaymentIntent.retrieve(payment.stripe_payment_intent_id)
    
        if payment_intent.status == "succeeded":
            payment.payment_status = Payment.PaymentStatus.PAID
            payment.save()

        if payment_intent.status == "canceled":
            payment.payment_status = Payment.PaymentStatus.FAILED
            payment.save()

        return payment_intent.status