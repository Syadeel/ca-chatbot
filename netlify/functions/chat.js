/**
 * CA Chatbot — Netlify Serverless Function
 * Handles AI chat with multi-tenant knowledge base from Supabase
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hrzyuchlqihbdllbcxlh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyenl1Y2hscWloYmRsbGJjeGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODMwNDUsImV4cCI6MjA5NDk1OTA0NX0.ZwQBHdjGONC_cjk2hSgubp5wW1dcTPy3P7rfILr9Uc4';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OR_HEADERS = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'HTTP-Referer': 'https://thecapitalacquisition.com', 'X-Title': 'CA Chatbot' };
const OR_MODELS = ['openrouter/free', 'qwen/qwen3-coder:free', 'google/gemma-4-31b-it:free'];

async function callLLM(systemPrompt, messages) {
    for (const model of OR_MODELS) {
        if (!OPENROUTER_KEY) break;
        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST', headers: OR_HEADERS,
                body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, ...messages], max_tokens: 500, temperature: 0.7 })
            });
            if (res.ok) { const d = await res.json(); return d.choices?.[0]?.message?.content || ''; }
            if (res.status === 429) continue;
        } catch (e) {}
    }
    return "Thanks for reaching out! I'm here to help. Could you email your question to hello@thecapitalacquisition.com and our team will get back to you within 4 hours?";
}

async function buildContext(tenantId) {
    const { data: t } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
    
    // Default CA knowledge base - always injected regardless of DB state
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
    
    if (!t) return CA_KB;
    
    let prompt = `You are the customer support chatbot for ${t.business_name}.`;
    let desc = t.description || 'Capital Acquisition builds custom AI Activation Agents that turn dormant signups into paying customers.';
    prompt += `\n\nAbout: ${desc}`;
    if (t.hours) prompt += `\nHours: ${t.hours}`;
    if (t.return_policy) prompt += `\nReturn policy: ${t.return_policy}`;
    if (t.custom_instructions) prompt += `\n\nInstructions: ${t.custom_instructions}`;
    
    const { data: faq } = await supabase.from('faq').select('*').eq('tenant_id', tenantId).order('sort_order');
    if (faq?.length) {
        prompt += '\n\n=== FAQ ===';
        faq.forEach(f => { prompt += `\nQ: ${f.question}\nA: ${f.answer}\n`; });
    }
    
    const { data: products } = await supabase.from('chatbot_products').select('*').eq('tenant_id', tenantId).eq('is_active', true).limit(10);
    if (products?.length) {
        prompt += '\n\n=== Products ===';
        products.forEach(p => { prompt += `\n- ${p.name}${p.price ? ' ($' + p.price + ')' : ''}${p.description ? ': ' + p.description : ''}`; });
    }
    
    // Calendly booking link
    const CALENDLY_URL = 'https://calendly.com/thecapitalacquisition-info/30min';
    
    prompt += `\n\n=== CRITICAL RULES ===`;
    prompt += `\n1. NEVER reveal any backend, technical, or internal information (no mention of Supabase, APIs, serverless, Netlify, GitHub, databases, or any infrastructure).`;
    prompt += `\n2. Keep answers simple, friendly, and focused ONLY on what ${t.business_name} offers to clients.`;
    prompt += `\n3. If a prospect wants to discuss their specific needs, book a call, or learn more about pricing — always invite them to book a free strategy call: ${CALENDLY_URL}`;
    prompt += `\n4. Be warm and conversational but professional. Use emojis naturally 😊`;
    prompt += `\n5. If asked about pricing, mention that pricing is customized per project and invite them to book a call for a personalized quote: ${CALENDLY_URL}`;
    prompt += `\n6. Keep responses concise — under 120 words.`;
    prompt += `\n7. Never claim to be human. You're an AI assistant for ${t.business_name}.`;
    prompt += `\n8. Never make up specific dollar amounts or technical specifications.`;
    return prompt;
}

exports.handler = async (event) => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    
    try {
        const { tenantId, sessionId, message } = JSON.parse(event.body);
        if (!tenantId || !message) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fields' }) };
        
        const systemPrompt = await buildContext(tenantId);
        
        const { data: history } = await supabase.from('chat_history').select('role, message').eq('tenant_id', tenantId).eq('session_id', sessionId || '').order('created_at', { ascending: false }).limit(10);
        const messages = (history || []).reverse().map(h => ({ role: h.role, content: h.message }));
        messages.push({ role: 'user', content: message });
        
        const reply = await callLLM(systemPrompt, messages);
        
        if (sessionId) {
            await supabase.from('chat_history').insert([{ tenant_id: tenantId, session_id: sessionId, role: 'user', message }]);
            await supabase.from('chat_history').insert([{ tenant_id: tenantId, session_id: sessionId, role: 'assistant', message: reply }]);
            await supabase.from('chat_sessions').upsert({ session_id: sessionId, tenant_id: tenantId, last_message_at: new Date().toISOString() }, { onConflict: 'session_id' });
        }
        
        return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ reply: 'Sorry, I encountered an error. Please try again or email hello@thecapitalacquisition.com' }) };
    }
};
