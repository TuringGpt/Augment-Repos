const buildFallbackSubject = ({ number, year, clientName }) => {
  const reference = number ? ` #${number}${year ? '/' + year : ''}` : '';
  const recipient = clientName ? ` for ${clientName}` : '';
  return `Quote${reference}${recipient}`.trim();
};

// Generates a suggested email subject for a quote using OpenAI.
// The endpoint always responds with a usable subject: when the OpenAI API key
// is missing or the request fails, it returns a deterministic fallback so the
// client can still prefill the (manually editable) subject field.
const suggestEmailSubject = async (req, res) => {
  const { number, year, total, currency, clientName } = req.body || {};

  const fallbackSubject = buildFallbackSubject({ number, year, clientName });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      success: true,
      result: { subject: fallbackSubject, ai: false },
      message: 'OpenAI is not configured, returning a default subject',
    });
  }

  let OpenAI;
  try {
    OpenAI = require('openai');
  } catch (error) {
    return res.status(200).json({
      success: true,
      result: { subject: fallbackSubject, ai: false },
      message: 'OpenAI package is not available, returning a default subject',
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const details = [
      number && `Quote number: ${number}${year ? '/' + year : ''}`,
      clientName && `Client: ${clientName}`,
      total != null && `Total: ${total}${currency ? ' ' + currency : ''}`,
    ]
      .filter(Boolean)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 30,
      messages: [
        {
          role: 'system',
          content:
            'You write concise, professional email subject lines for sales quotes. ' +
            'Reply with the subject line only, no quotes, under 80 characters.',
        },
        {
          role: 'user',
          content:
            `Write an email subject line for sending the following quote to a client.\n${details}`,
        },
      ],
    });

    const suggestion = completion?.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      success: true,
      result: { subject: suggestion || fallbackSubject, ai: Boolean(suggestion) },
      message: 'Successfully generated a suggested email subject',
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      result: { subject: fallbackSubject, ai: false },
      message: 'Could not reach OpenAI, returning a default subject',
    });
  }
};

module.exports = suggestEmailSubject;
