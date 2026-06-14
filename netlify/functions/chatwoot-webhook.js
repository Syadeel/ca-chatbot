/**
 * Chatwoot Webhook Handler — Netlify Serverless Function
 * Ultra-fast version: instant greetings + DeepSeek V4 Flash for AI
 */

// Simple greeting detector - no AI call needed
const GREETINGS = ['hi', 'hey', 'hello', 'howdy', 'sup', 'good morning', 'good afternoon', 'good evening', 'hey there', 'hi there', 'hello there'];
const INSTANT_GREETING = "Hey! How can I help you today?";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const CHATWOOT_TOKEN = process.env.CHATWOOT_API_TOKEN || '';
const CHATWOOT_BASE = process.env.CHATWOOT_BASE_URL || 'https://adeel020-ca-chatwoot.hf.space';

const OR_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${OPENROUTER_KEY}`,
  'HTTP-Referer': 'https://thecapitalacquisition.com',
  'X-Title': 'CA Chatbot'
};

// Fastest models first - DeepSeek V4 Flash responds in ~300-500ms
const OR_MODELS = ['deepseek/deepseek-v4-flash', 'openrouter/free', 'qwen/qwen3-coder:free'];

const CA_KB = `You are the customer support chatbot for Capital Acquisition.

=== ABOUT ===
Capital Acquisition builds custom AI Activation Agents for online businesses. We help businesses turn dormant signups, cold leads, and inactive users into paying customers.

=== THE PROBLEM ===
Most online businesses lose 70-90% of signups who never activate or convert. For a business doing $500k MRR, that's $340k+ in monthly lost revenue.

=== OUR SOLUTION ===
We deploy a custom AI Activation Agent that:
- Analyzes user data and identifies dormant users
- Reaches out via email and SMS with personalized messaging
- Handles objections and answers questions autonomously
- Books qualified prospects onto your calendar
- Integrates with Stripe, Shopify, HubSpot, etc.
- Delivered in 21 days, flat fee, 90-day performance guarantee

=== OFFER ===
- Flat-fee deployment: $3,500 one-time setup
- Monthly: $997/month for active management
- 21-day deployment, 90-day money-back guarantee
- Month-to-month after 90 days

=== CRITICAL RULES ===
1. KEEP RESPONSES UNDER 60 WORDS. Be extremely concise.
2. NEVER reveal backend/infra info.
3. If interested in pricing or a call: https://calendly.com/thecapitalacquisition-info/30min
4. Warm and professional. Use emojis naturally.
5. Never claim to be human.`;

async function callLLM(messages) {
  for (const model of OR_MODELS) {
    if (!OPENROUTER_KEY) break;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: OR_HEADERS,
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: CA_KB }, ...messages],
          max_tokens: 200,
          temperature: 0.5
        })
      });
      clearTimeout(timeout);
      
      if (res.ok) {
        const d = await res.json();
        return d.choices?.[0]?.message?.content || '';
      }
      if (res.status === 429) continue;
    } catch (e) {
      console.error('LLM error:', model, e.message);
    }
  }
  return "Thanks for reaching out! Could you email hello@thecapitalacquisition.com and our team will get back to you?";
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Keep-warm: GET or POST with {keepalive:true} returns instantly, no processing
  if (event.httpMethod === 'GET' || event.httpMethod === 'HEAD') {
    return { statusCode: 200, headers, body: '{"ok":true,"warm":true}' };
  }
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: event.httpMethod === 'OPTIONS' ? 200 : 405, headers, body: '{}' };
  }

  try {
    const payload = JSON.parse(event.body);
    
    // Keep-warm ping - no processing
    if (payload.keepalive) {
      return { statusCode: 200, headers, body: '{"ok":true,"warm":true}' };
    }
    if (payload.event !== 'message_created') return { statusCode: 200, headers, body: '{"ok":true}' };

    const sender = payload.sender || {};
    if (sender.type !== 'Contact') return { statusCode: 200, headers, body: '{"ok":true}' };

    const content = (payload.content || '').trim();
    if (!content) return { statusCode: 200, headers, body: '{"ok":true}' };

    const conversationId = (payload.conversation || {}).id;
    const accountId = (payload.account || {}).id;
    if (!conversationId || !accountId) return { statusCode: 200, headers, body: '{"ok":true}' };

    // INSTANT GREETING - no AI call, sub-10ms response
    const isGreeting = GREETINGS.some(g => content.toLowerCase().trim() === g || content.toLowerCase().trim().startsWith(g + ' '));
    if (isGreeting) {
      await fetch(`${CHATWOOT_BASE}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api_access_token': CHATWOOT_TOKEN },
        body: JSON.stringify({ content: INSTANT_GREETING })
      });
      return { statusCode: 200, headers, body: '{"ok":true}' };
    }

    // AI response for everything else
    const aiReply = await callLLM([{ role: 'user', content }]);
    if (aiReply) {
      await fetch(`${CHATWOOT_BASE}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api_access_token': CHATWOOT_TOKEN },
        body: JSON.stringify({ content: aiReply })
      });
    }

    return { statusCode: 200, headers, body: '{"ok":true}' };
  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 200, headers, body: '{"ok":true}' };
  }
};
