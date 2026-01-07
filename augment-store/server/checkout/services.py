
import logging

import stripe

from .models import Payment

logger = logging.getLogger(__name__)

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
        strip_session = stripe.checkout.Session.create(
            ui_mode="embedded",
            mode="payment",
            line_items=line_items,
            return_url=f"{settings.APP_DOMAIN}{redirect_url}?payment_id={payment.id}",
        )

        payment.stripe_session_id = strip_session.id
        payment.save()

        return strip_session

    def check_and_update_payment_status(self, payment: Payment):
        from django.conf import settings

        stripe.api_key = settings.STRIPE_SECRET_KEY

        if not payment.stripe_session_id:
            logger.error(f"Stripe session ID not found for payment {payment.id}")
            return Payment.PaymentStatus.PENDING
        try:
            strip_session = stripe.checkout.Session.retrieve(payment.stripe_session_id)

            if strip_session.payment_status == "paid":
                payment.payment_status = Payment.PaymentStatus.PAID
                payment.save()

            if strip_session.payment_status == "unpaid":
                payment.payment_status = Payment.PaymentStatus.FAILED
                payment.save()

            return payment.payment_status
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error checking payment status for payment {payment.id} - {e}", exc_info=True)
            return Payment.PaymentStatus.PENDING
        except Exception as e:
            logger.error(f"Unknown error checking payment status for payment {payment.id} - {e}", exc_info=True)
            return Payment.PaymentStatus.PENDING
