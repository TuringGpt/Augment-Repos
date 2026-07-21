const OpenAI = require('openai');

const buildFallbackSubject = ({ quoteNumber, quoteYear, clientName }) => {
  const quoteLabel = [quoteNumber, quoteYear].filter(Boolean).join('/');
  const clientLabel = clientName ? ` for ${clientName}` : '';
  return `Quote${quoteLabel ? ` #${quoteLabel}` : ''}${clientLabel}`;
};

const cleanSubject = (subject, fallbackSubject) => {
  if (!subject) return fallbackSubject;

  const cleanedSubject = subject
    .replace(/^subject:\s*/i, '')
    .replace(/^['"]|['"]$/g, '')
    .split('\n')[0]
    .trim()
    .slice(0, 120);

  return cleanedSubject || fallbackSubject;
};

const suggestEmailSubject = async (req, res) => {
  const { quoteNumber, quoteYear, clientName, total, currency, items = [] } = req.body || {};
  const fallbackSubject = buildFallbackSubject({ quoteNumber, quoteYear, clientName });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      success: true,
      result: { subject: fallbackSubject },
      message: 'OpenAI is not configured; using the default quote subject.',
    });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const quoteItems = Array.isArray(items) ? items : [];
  const itemSummary = quoteItems
    .slice(0, 5)
    .map(({ itemName, description, quantity }) => `${quantity || 1} x ${itemName || description || 'item'}`)
    .join(', ');

  let subject = fallbackSubject;

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Write concise, professional sales email subject lines. Return only one subject line.',
        },
        {
          role: 'user',
          content: `Create an email subject for quote ${quoteNumber || ''}/${quoteYear || ''}. Client: ${
            clientName || 'customer'
          }. Total: ${total || ''} ${currency || ''}. Items: ${itemSummary || 'quote items'}.`,
        },
      ],
      max_tokens: 30,
      temperature: 0.7,
    });

    subject = cleanSubject(completion.choices?.[0]?.message?.content, fallbackSubject);
  } catch {
    subject = fallbackSubject;
  }

  return res.status(200).json({
    success: true,
    result: { subject },
    message: 'Email subject suggestion generated successfully.',
  });
};

module.exports = suggestEmailSubject;