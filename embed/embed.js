/**
 * CA Bot — Embed Script v9
 * Floating AI chatbot with bounce, tooltip (fully visible after slide), round-trip loop.
 * Usage: <script src="...embed.js" data-tenant="TENANT_ID" data-api="..." data-calendly="..."></script>
 */
(function(){
var scripts=document.getElementsByTagName('script'),S;
for(var i=0;i<scripts.length;i++){if(scripts[i].src&&scripts[i].src.indexOf('embed.js')>-1){S=scripts[i];break}}
if(!S){setTimeout(arguments.callee,500);return}
var T=S.getAttribute('data-tenant'),P=S.getAttribute('data-position')||'right',C=S.getAttribute('data-color')||'#000000',G=S.getAttribute('data-greeting')||'Hi there! Need help growing your business with AI?',CL=S.getAttribute('data-calendly')||'https://calendly.com/thecapitalacquisition-info/30min';
var API=(S.getAttribute('data-api')||'https://spontaneous-gumdrop-67c452.netlify.app')+'/.netlify/functions/chat';
var IMG=(S.getAttribute('data-logo')||'https://spontaneous-gumdrop-67c452.netlify.app/embed/ca-logo.png');
var SID='ca_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);
if(!T){console.error('[CA Bot] Missing data-tenant');return}
var st=document.createElement('style');
// Tooltip at right:10px — always to the RIGHT of the bubble (at right:24).
// Stays hidden (opacity:0) during bounce. Only appears AFTER slide completes so it's fully visible.
st.textContent='.ca-bot *{box-sizing:border-box;margin:0;padding:0}.ca-bot-tooltip{position:fixed;bottom:38px;'+P+':40px;background:#fff;color:#1a1a1a;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.12);z-index:999998;white-space:nowrap;opacity:0;transition:opacity .4s ease;pointer-events:none;letter-spacing:.2px}.ca-bot-tooltip.visible{opacity:1}.ca-bot-btn-group{position:fixed;bottom:24px;'+P+':24px;z-index:999999;display:flex;align-items:center;gap:10px;transition:transform .5s cubic-bezier(.34,1.56,.64,1)}.ca-bot-btn-group.slide{transform:translateX(-72px)}.ca-bot-btn{width:60px;height:60px;border-radius:50%;background:'+C+';border:none;cursor:pointer;box-shadow:0 4px 24px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;padding:10px;transition:transform .2s,box-shadow .2s;flex-shrink:0;position:relative}.ca-bot-btn:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(0,0,0,.35)}.ca-bot-btn img{width:100%;height:100%;object-fit:contain;border-radius:50%}.ca-bot-btn.bounce{animation:caBounce .6s ease 3}@keyframes caBounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}60%{transform:translateY(-8px)}}.ca-bot-widget{position:fixed;bottom:100px;'+P+':24px;width:360px;max-width:calc(100vw-48px);height:480px;max-height:calc(100vh-140px);background:#fff;border-radius:16px;box-shadow:0 8px 48px rgba(0,0,0,.18);z-index:999999;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;animation:caFadeIn .25s ease}.ca-bot-widget.open{display:flex}@keyframes caFadeIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}.ca-bot-header{background:'+C+';color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px}.ca-bot-logo{width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;font-family:Georgia,serif;letter-spacing:-.5px;flex-shrink:0;overflow:hidden}.ca-bot-logo img{width:100%;height:100%;object-fit:cover}.ca-bot-header-info{flex:1;min-width:0}.ca-bot-header-name{font-size:13px;font-weight:600;line-height:1.3}.ca-bot-header-status{font-size:10px;opacity:.7;line-height:1.2}.ca-bot-close{background:none;border:none;color:#fff;font-size:16px;cursor:pointer;padding:4px;opacity:.7;line-height:1;border-radius:4px;transition:opacity .15s;flex-shrink:0}.ca-bot-close:hover{opacity:1}.ca-bot-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#f5f5f5}.ca-bot-msg{max-width:88%;padding:9px 13px;border-radius:11px;font-size:13px;line-height:1.5;word-wrap:break-word;animation:caMsgIn .25s ease}@keyframes caMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.ca-bot-msg.bot{background:#fff;color:#1a1a1a;align-self:flex-start;border-bottom-left-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,.06)}.ca-bot-msg.bot ::selection{background:#1a3a5c;color:#1a1a1a}.ca-bot-msg.user{background:'+C+';color:#fff;align-self:flex-end;border-bottom-right-radius:3px;white-space:pre-wrap}.ca-bot-msg.user ::selection{background:#1a3a5c;color:#fff}.ca-bot-msg.typing{background:#fff;color:#888;align-self:flex-start;font-style:italic;font-size:12px}.ca-bot-actions{display:flex;flex-wrap:wrap;gap:5px;padding:0 14px 10px;background:#f5f5f5}.ca-bot-action{font-size:11px;padding:5px 11px;border-radius:14px;border:1.5px solid '+C+';background:transparent;color:'+C+';cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap}.ca-bot-action:hover{background:'+C+';color:#fff}.ca-bot-action.book{background:'+C+';color:#fff;font-weight:600}.ca-bot-action.book:hover{opacity:.9}.ca-bot-input-area{display:flex;padding:10px 12px;border-top:1px solid #eee;background:#fff;gap:8px}.ca-bot-input{flex:1;border:1px solid #ddd;border-radius:9px;padding:9px 12px;font-size:13px;outline:none;font-family:inherit;transition:border-color .15s;color:#1a1a1a}.ca-bot-input::placeholder{color:#999}.ca-bot-input:focus{border-color:'+C+'}.ca-bot-send{background:'+C+';color:#fff;border:none;border-radius:9px;padding:9px 16px;font-size:13px;font-weight:500;cursor:pointer;transition:opacity .15s}.ca-bot-send:hover{opacity:.9}.ca-bot-footer{text-align:center;padding:7px;font-size:10px;color:#999;border-top:1px solid #f0f0f0;background:#fafafa}.ca-bot-footer a{color:'+C+';text-decoration:none;font-weight:500}.ca-bot-footer a:hover{text-decoration:underline}';
document.head.appendChild(st);
// Tooltip is SEPARATE at right:10px. Only appears AFTER bubble slides left (to right:96).
var tt=document.createElement('div');tt.className='ca-bot-tooltip';tt.id='cb-tt';tt.textContent='Need Help?';
document.body.appendChild(tt);
var bg=document.createElement('div');bg.className='ca-bot-btn-group';bg.id='cb-bg';
bg.innerHTML='<button class="ca-bot-btn" id="cb-btn"><img src="'+IMG+'" alt="CA"></button>';
document.body.appendChild(bg);
var w=document.createElement('div');w.className='ca-bot-widget';w.id='cb-w';
w.innerHTML='<div class="ca-bot-header"><div class="ca-bot-logo"><img src="'+IMG+'" alt="CA"></div><div class="ca-bot-header-info"><div class="ca-bot-header-name">Capital Acquisition</div><div class="ca-bot-header-status">AI Assistant</div></div><button class="ca-bot-close" id="cb-x">\u2715</button></div><div class="ca-bot-msgs" id="cb-msgs"><div class="ca-bot-msg bot">'+G+'</div></div><div class="ca-bot-actions" id="cb-actions"><button class="ca-bot-action book" data-action="book">\uD83D\uDCC5 Book a Call</button><button class="ca-bot-action" data-action="services">\u2753 What is Capital Acquisition?</button><button class="ca-bot-action" data-action="problem">\uD83D\uDD0D What problem do you solve?</button></div><div class="ca-bot-input-area"><input class="ca-bot-input" id="cb-inp" type="text" placeholder="Ask anything..." autocomplete="off"><button class="ca-bot-send" id="cb-send">Send</button></div><div class="ca-bot-footer">Powered by <a href="https://thecapitalacquisition.com" target="_blank">Capital Acquisition</a></div></div>';
document.body.appendChild(w);
var btn=document.getElementById('cb-btn'),wg=document.getElementById('cb-w'),cx=document.getElementById('cb-x'),ms=document.getElementById('cb-msgs'),inp=document.getElementById('cb-inp'),sd=document.getElementById('cb-send'),ac=document.getElementById('cb-actions'),tt2=document.getElementById('cb-tt'),bg2=document.getElementById('cb-bg');
var bk=CL,animating=true,animTimer=null;
// Animation: bounce → slide left → show tooltip (fully visible, right of bubble) → pause → hide → slide back → loop
function startAnim(){
    animTimer=setTimeout(function cycle(){
        if(!animating)return;
        btn.classList.add('bounce');
        setTimeout(function(){
            if(!animating)return;
            bg2.classList.add('slide'); // bubble slides 72px left (to right:96)
            setTimeout(function(){
                if(!animating)return;
                tt2.classList.add('visible'); // appears at right:10 — fully to the RIGHT of slid bubble
                setTimeout(function(){
                    if(!animating)return;
                    tt2.classList.remove('visible');
                    bg2.classList.remove('slide'); // slide back right
                    btn.classList.remove('bounce');
                    animTimer=setTimeout(cycle,5000);
                },2000);
            },800); // wait for slide to fully complete before showing tooltip
        },1800);
    },2000);
}
function stopAnim(){animating=false;if(animTimer)clearTimeout(animTimer);btn.classList.remove('bounce');tt2.classList.remove('visible');bg2.classList.remove('slide')}
startAnim();
btn.onclick=function(){stopAnim();wg.classList.toggle('open');if(wg.classList.contains('open'))inp.focus()};
cx.onclick=function(){wg.classList.remove('open');if(!wg.classList.contains('open')){animating=true;startAnim()}};
function addMsg(t,r){var d=document.createElement('div');d.className='ca-bot-msg '+r;d.textContent=t;ms.appendChild(d);ms.scrollTop=ms.scrollHeight}
function typing(){var d=document.createElement('div');d.className='ca-bot-msg bot typing';d.id='cb-type';d.textContent='Thinking...';ms.appendChild(d);ms.scrollTop=ms.scrollHeight}
function noty(){var e=document.getElementById('cb-type');if(e)e.remove()}
async function sendMsg(t){var msg=t||inp.value.trim();if(!msg)return;inp.value='';addMsg(msg,'user');ac.style.display='none';typing();try{var r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenantId:T,sessionId:SID,message:msg})});noty();if(!r.ok){addMsg('Sorry, I\'m having trouble connecting. Please try again!','bot');return}var d=await r.json();var reply=d.reply||'Got it! Anything else I can help with?';addMsg(reply,'bot');if(reply.indexOf('book')>-1||reply.indexOf('call')>-1||reply.indexOf('strategy')>-1||reply.indexOf('Calendly')>-1||reply.indexOf('calendly')>-1){addBookCta()}}catch(e){noty();addMsg('Sorry, something went wrong. Please try again!','bot')}}
function addBookCta(){var c=document.createElement('div');c.className='ca-bot-msg bot';c.style.cssText='padding:0;background:transparent;box-shadow:none;align-self:stretch;text-align:center';c.innerHTML='<a href="'+bk+'" target="_blank" style="display:block;background:'+C+';color:#fff;text-decoration:none;padding:9px 14px;border-radius:9px;font-size:12px;font-weight:600;">\uD83D\uDCC5 Book Your Free Strategy Call</a>';ms.appendChild(c);ms.scrollTop=ms.scrollHeight}
sd.onclick=function(){sendMsg()};inp.onkeydown=function(e){if(e.key==='Enter')sendMsg()};
ac.addEventListener('click',function(e){var b=e.target;if(b.classList.contains('ca-bot-action')){var a=b.getAttribute('data-action');if(a==='book'){window.open(bk,'_blank')}else{var q=b.textContent.replace(/^\S+\s*/,'');sendMsg(q)}}});
})();
