/**
 * Chatwoot Webhook Handler — Netlify Serverless Function
 * Receives message_created webhooks from Chatwoot, calls OpenRouter AI,
 * and replies back via Chatwoot API.
 */

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const CHATWOOT_TOKEN = process.env.CHATWOOT_API_TOKEN || '';
const CHATWOOT_BASE = process.env.CHATWOOT_BASE_URL || 'https://adeel020-ca-chatwoot.hf.space';

const OR_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${OPENROUTER_KEY}`,
  'HTTP-Referer': 'https://thecapitalacquisition.com',
  'X-Title': 'CA Chatbot'
};

const OR_MODELS = ['openrouter/free', 'qwen/qwen3-coder:free', 'google/gemma-4-31b-it:free'];

const CA_KB = `You are the customer support chatbot for Capital Acquisition.
Your ONLY purpose is to talk about Capital Acquisition - what it is, what problem it solves, and what it offers.

=== ABOUT CAPITAL ACQUISITION ===
Capital Acquisition builds custom AI Activation Agents for online businesses. We help businesses turn dormant signups, cold leads, and inactive users into paying customers. Our AI agents work across email, SMS, and every digital touchpoint to automatically re-engage and convert lost revenue.

=== THE PROBLEM WE SOLVE ===
Most online businesses lose 70-90% of signups who never activate or convert. This is called "the activation gap" - users sign up but never experience the core value. For a business doing $500k MRR, that's $340k+ in monthly lost revenue from dormant users alone. Email sequences don't work, manual outreach doesn't scale, and most users need 3-5 touchpoints before converting.

=== OUR SOLUTION ===
We deploy a custom AI Activation Agent into your business that:
- Analyzes your user data and identifies who's dormant and why
- Reaches out to each prospect automatically via email and SMS with personalized messaging
- Handles objections and answers questions autonomously
- Books qualified prospects directly onto your calendar
- Learns and improves from every conversation
- Integrates with your existing tools (Stripe, Shopify, HubSpot, etc.)
- Delivered in 21 days, flat fee, with a 90-day performance guarantee

=== THE OFFER ===
- Flat-fee deployment: $3,500 one-time setup
- Monthly: $997/month for active management and optimization
- 21-day deployment from kickoff to live
- 90-day money-back guarantee if we don't deliver results
- No long-term contracts - month-to-month after 90 days

=== FAQ ===
Q: How is this different from email marketing?
A: Email marketing is broadcast. Our AI agents have one-on-one conversations with each prospect, handle objections, answer questions, and book calls - like having a sales team that works 24/7.

Q: What platforms do you integrate with?
A: Stripe, Shopify, HubSpot, Intercom, Slack, email (SendGrid/Postmark), SMS (Twilio), and most CRMs. Custom integrations available.

Q: How long does it take to see results?
A: Most clients see their first re-engagement within the first week. Meaningful revenue impact typically starts in weeks 3-4.

Q: Do I need to provide my own AI infrastructure?
A: No. We build, host, and manage everything. You just provide access to your user data.

=== CRITICAL RULES ===
1. **GREETING RULE — ABSOLUTE**: When the user says a simple greeting (hi, hey, hello, howdy, sup, good morning, etc.) without asking a specific question, your response MUST be a SHORT greeting of 5-10 words MAX. Examples: "Hey! How can I help you today?" or "Hi there! What can I do for you?" or "Hello! What brings you here?" You MUST NOT pitch, describe, or explain Capital Acquisition in any way. Wait for a follow-up question.
2. NEVER reveal any backend, technical, or internal information (no mention of Supabase, APIs, serverless, Netlify, GitHub, databases, or any infrastructure).
3. Keep answers simple, friendly, and focused ONLY on Capital Acquisition's offerings.
4. If a prospect wants to discuss pricing, their specific needs, or book a call — ALWAYS invite them to book a free strategy call: https://calendly.com/thecapitalacquisition-info/30min
5. Be warm and conversational but professional. Use emojis naturally.
6. Keep responses concise — under 120 words.
7. Never claim to be human. You're an AI assistant for Capital Acquisition.
8. Never make up specific dollar amounts outside what's listed above.
9. If asked about web design services, templates, or the chatbot system - politely redirect: "I'm here to talk about Capital Acquisition's AI Activation Agent. For web design services, please visit our templates page at templates.thecapitalacquisition.com"`;

async function callLLM(messages) {
  for (const model of OR_MODELS) {
    if (!OPENROUTER_KEY) break;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: OR_HEADERS,
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: CA_KB }, ...messages],
          max_tokens: 500,
          temperature: 0.7
        })
      });
      if (res.ok) {
        const d = await res.json();
        return d.choices?.[0]?.message?.content || '';
      }
      if (res.status === 429) continue;
    } catch (e) {
      console.error('callLLM error:', e);
    }
  }
  return "Thanks for reaching out! I'm here to help. Could you email your question to hello@thecapitalacquisition.com and our team will get back to you within 4 hours?";
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body);
    console.log('Chatwoot webhook received:', payload.event, 'ID:', payload.id);

    if (payload.event !== 'message_created') {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    const sender = payload.sender || {};
    if (sender.type !== 'Contact') {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    const content = (payload.content || '').trim();
    if (!content) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    const conversation = payload.conversation || {};
    const conversationId = conversation.id;
    const accountId = (payload.account || {}).id;

    if (!conversationId || !accountId) {
      console.error('Missing conversation_id or account_id');
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    const aiReply = await callLLM([{ role: 'user', content }]);

    if (aiReply) {
      const replyRes = await fetch(
        `${CHATWOOT_BASE}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_access_token': CHATWOOT_TOKEN
          },
          body: JSON.stringify({ content: aiReply })
        }
      );

      if (!replyRes.ok) {
        const errText = await replyRes.text();
        console.error('Chatwoot reply failed:', replyRes.status, errText);
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Chatwoot webhook error:', err);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }
};
