const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const paymentLink = async (req, res) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your .env file.',
    });
  }

  const invoice = await Model.findOne({ _id: req.params.id, removed: false });

  if (!invoice) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No invoice found by this id: ' + req.params.id,
    });
  }

  const stripe = require('stripe')(stripeSecretKey);

  const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
  // Fixed amount in the smallest currency unit (e.g. cents). Defaults to 50.00.
  const unitAmount = parseInt(process.env.STRIPE_FIXED_AMOUNT || '5000', 10);

  const successUrl = process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/invoice';
  const cancelUrl = process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/invoice';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Invoice #${invoice.number}/${invoice.year}`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return res.status(200).json({
    success: true,
    result: { url: session.url },
    message: 'Successfully created Stripe checkout session for the invoice',
  });
};

module.exports = paymentLink;
