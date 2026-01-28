
import logging

from .models import Payment
import stripe

logger = logging.getLogger(__name__)

class StripeService:
    def __init__(self):
        pass

    def create_payment_session(self, payment: Payment):
        from django.conf import settings
        from django.urls import reverse
        from rest_framework.exceptions import ValidationError

        order = payment.order
        stripe.api_key = settings.STRIPE_SECRET_KEY

        items = order.items.select_related('product').all()
        
        if not items.exists():
            raise ValidationError({"detail": "Order has no items to process"})
        
        for item in items:
            if item.product is None:
                raise ValidationError({"detail": f"Order item {item.id} has no associated product"})
            if item.quantity is None or item.quantity <= 0:
                raise ValidationError({"detail": f"Order item {item.id} has invalid quantity"})



        line_items = [
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": item.product.name,
                    },
                    "unit_amount": int(item.product.price * 100),
                },
                "quantity": item.quantity,
            }
            for item in items
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
        from django.core.exceptions import ValidationError

        stripe.api_key = settings.STRIPE_SECRET_KEY

        if not payment.stripe_session_id:
            logger.error(f"Stripe session ID not found for payment {payment.id}")
            return payment.payment_status

        try:
            strip_session = stripe.checkout.Session.retrieve(payment.stripe_session_id)

            if strip_session.payment_status == "paid":
                payment.payment_status = Payment.PaymentStatus.PAID
                payment.save()
                return payment.payment_status

            if strip_session.status == "expired":
                if payment.payment_status != Payment.PaymentStatus.FAILED:
                    payment.payment_status = Payment.PaymentStatus.FAILED
                    payment.save()
                return payment.payment_status

            return payment.payment_status
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error checking payment status for payment {payment.id} - {e}", exc_info=True)
            return payment.payment_status
        except Exception as e:
            logger.error(f"Unknown error checking payment status for payment {payment.id} - {e}", exc_info=True)
            return payment.payment_status
