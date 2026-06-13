/**
 * CA Chatbot — Netlify Serverless Function
 * Handles AI chat with multi-tenant knowledge base from Supabase
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hrzyuchlqihbdllbcxlh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const GO_API_KEY = process.env.GO_API_KEY || 'sk-mpfhlnxRxol9JQew1hkD5yFS4SZHiw2IpIyHbAUPA4YfqkfmBv2VTgIJNnfxcVWK';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function callLLM(systemPrompt, messages) {
    const payload = {
        model: 'deepseek-v4-flash-free',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 500,
        temperature: 0.7
    };
    
    if (GO_API_KEY) {
        try {
            const res = await fetch('https://api.opencode.ai/v1/chat/completions', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GO_API_KEY}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) { const d = await res.json(); return d.choices?.[0]?.message?.content || ''; }
        } catch (e) {}
    }
    
    if (OPENROUTER_KEY) {
        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'HTTP-Referer': SUPABASE_URL, 'X-Title': 'CA Chatbot' },
                body: JSON.stringify({ ...payload, model: 'qwen/qwen3-coder:free' })
            });
            if (res.ok) { const d = await res.json(); return d.choices?.[0]?.message?.content || ''; }
        } catch (e) {}
    }
    
    return "Thanks for reaching out! I'm here to help. Could you email your question to hello@thecapitalacquisition.com and our team will get back to you within 4 hours?";
}

async function buildContext(tenantId) {
    const { data: t } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
    if (!t) return 'You are a helpful assistant.';
    
    let prompt = `You are the customer support chatbot for ${t.business_name}.`;
    if (t.description) prompt += `\n\nAbout: ${t.description}`;
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
    
    prompt += '\n\nRules: Be friendly, warm, and helpful. Use emojis naturally. If you don\'t know something, say so honestly. Never make up specific pricing. Keep responses under 150 words.';
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
