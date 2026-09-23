var THEMES={wave:{e:'🌊',n:'Волна'},lion:{e:'🦁',n:'Лев'},crocodile:{e:'🐊',n:'Крокодил'},dragon:{e:'🐉',n:'Дракон'},panda:{e:'🐼',n:'Панда'},tiger:{e:'🐯',n:'Тигр'},frog:{e:'🐸',n:'Жаба'},wolf:{e:'🐺',n:'Волк'},shark:{e:'🦈',n:'Акула'},bee:{e:'🐝',n:'Пчела'},moon:{e:'🌙',n:'Луна'}};
var MODELS=[{id:'deepseek',name:'DeepSeek',sub:'Умная — для задач',badge:'SMART'},{id:'openai',name:'OpenAI',sub:'Быстрая',badge:'FAST'},{id:'mistral',name:'Mistral',sub:'Средняя',badge:'NORMAL'},{id:'qwen-coder',name:'Qwen Coder',sub:'Для кода',badge:'CODE'}];

var currentModel='deepseek',curTheme='moon',attachedImageBase64=null,voiceOutputEnabled=false;
var currentAudio=null,useNeural=true,VOICE='echo',voiceRec=null,voiceIsListening=false,voiceFinal='';

function $(id){return document.getElementById(id)}

var messagesEl=$('messages'),chatField=$('chatField'),sendBtn=$('sendBtn'),voiceOpenBtn=$('voiceOpenBtn'),attachBtn=$('attachBtn'),fileInput=$('fileInput'),menuBtn=$('menuBtn'),themeBtn=$('themeBtn'),modelBtn=$('modelBtn'),activeModelLabel=$('activeModelLabel'),chatsPanel=$('chatsPanel'),chatsClose=$('chatsClose'),chatList=$('chatList'),newChatBtn=$('newChatBtn'),clearChatBtn=$('clearChatBtn'),installAppBtn=$('installAppBtn'),donateBtn=$('donateBtn'),themePanel=$('themePanel'),themeClose=$('themeClose'),themeList=$('themeList'),modelPanel=$('modelPanel'),modelClose=$('modelClose'),modelList=$('modelList'),emptyState=$('emptyState'),emptyLogo=$('emptyLogo'),voiceOverlay=$('voiceOverlay'),voiceExitBtn=$('voiceExitBtn'),voiceBtn=$('voiceBtn'),voiceTitle=$('voiceTitle'),voiceSub=$('voiceSub'),voiceFace=$('voiceFace'),splash=$('splash'),splashName=$('splashName'),splashLogo=$('splashLogo'),sweepPath=$('sweepPath'),fxLayer=$('fxLayer'),attachmentPreview=$('attachmentPreview'),previewImg=$('previewImg'),attachName=$('attachName'),removeAttachBtn=$('removeAttachBtn'),profileModal=$('profileModal'),profileCancel=$('profileCancel'),profileInstall=$('profileInstall'),iosGuide=$('iosGuide'),guideClose=$('guideClose'),guideOk=$('guideOk'),terminal=$('terminal'),terminalContent=$('terminalContent'),profileIconEmoji=$('profileIconEmoji'),toast=$('toast'),donateModal=$('donateModal'),donateGo=$('donateGo'),donateClose=$('donateClose');

function haptic(){if(navigator.vibrate){try{navigator.vibrate(10)}catch(e){}}}
function toastMsg(t){toast.textContent=t;toast.classList.add('show');setTimeout(function(){toast.classList.remove('show')},2000)}

function getThemeColor(n){
  var c={wave:'#0074D9',lion:'#ea580c',crocodile:'#166534',dragon:'#dc2626',panda:'#404040',tiger:'#ea580c',frog:'#059669',wolf:'#525252',shark:'#0284c7',bee:'#ca8a04',moon:'#a78bfa'};
  return c[n]||'#8b5cf6';
}
function makeSvgIcon(e,b){
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="'+b+'"/><stop offset="100%" stop-color="'+b+'aa"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><text x="256" y="256" font-size="280" text-anchor="middle" dominant-baseline="central" dy=".1em">'+e+'</text></svg>');
}
function updatePwaAssets(n){
  var e=THEMES[n]?THEMES[n].e:'🌙';
  var c=getThemeColor(n);
  var u=makeSvgIcon(e,c);
  var m={name:'Wave AI',short_name:'Wave AI',start_url:'./',scope:'./',display:'standalone',background_color:'#050515',theme_color:c,icons:[{src:u,sizes:'192x192',type:'image/svg+xml'},{src:u,sizes:'512x512',type:'image/svg+xml'}]};
  var b=new Blob([JSON.stringify(m)],{type:'application/json'});
  if($('manifestPlaceholder'))$('manifestPlaceholder').setAttribute('href',URL.createObjectURL(b));
  if($('appleIcon'))$('appleIcon').setAttribute('href',u);
  if($('favicon'))$('favicon').setAttribute('href',u);
  var tcm=document.querySelector('meta[name="theme-color"]');
  if(tcm)tcm.setAttribute('content',c);
  if(profileIconEmoji)profileIconEmoji.textContent=e;
}

if('serviceWorker' in navigator){
  var sw='self.addEventListener("install",e=>self.skipWaiting());self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));self.addEventListener("fetch",e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});';
  var sb=new Blob([sw],{type:'text/javascript'});
  navigator.serviceWorker.register(URL.createObjectURL(sb)).catch(()=>{});
}
var deferredPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e});

/* ============ СЦЕНА ЛУНЫ ============ */
function clearScene(){fxLayer.innerHTML=''}

function buildMoonScene(){
  for(var i=0;i<80;i++){
    var s=1+Math.random()*2.5;
    var t=document.createElement('div');
    t.className='twinkle';
    t.style.cssText='left:'+(Math.random()*100)+'%;top:'+(Math.random()*70)+'%;width:'+s+'px;height:'+s+'px;animation-duration:'+(1.5+Math.random()*3)+'s;animation-delay:'+(Math.random()*3)+'s';
    fxLayer.appendChild(t);
  }
  for(var i=0;i<5;i++){
    var f=document.createElement('div');
    f.className='fStar';
    f.style.cssText='left:'+(20+Math.random()*80)+'%;top:'+(Math.random()*30)+'%;animation:starFall '+(3+Math.random()*2)+'s linear infinite;animation-delay:'+(Math.random()*8)+'s';
    fxLayer.appendChild(f);
  }
  for(var i=0;i<3;i++){
    var c=document.createElement('div');
    c.className='cloud';
    c.style.cssText='top:'+(30+Math.random()*30)+'%;width:'+(100+Math.random()*80)+'px;height:'+(20+Math.random()*15)+'px;background:radial-gradient(ellipse,rgba(180,180,200,.6),transparent 70%);animation-duration:'+(40+Math.random()*30)+'s;animation-delay:'+(-Math.random()*30)+'s';
    fxLayer.appendChild(c);
  }
  var sc=document.createElement('div');
  sc.id='moonScene';
  sc.innerHTML='<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">'+
    '<g class="moon"><circle cx="300" cy="140" r="55" fill="#f5f0d5"/><circle cx="285" cy="125" r="8" fill="#e8e0b8" opacity="0.5"/><circle cx="315" cy="150" r="12" fill="#e8e0b8" opacity="0.4"/><circle cx="295" cy="160" r="6" fill="#e8e0b8" opacity="0.5"/><circle cx="320" cy="120" r="5" fill="#e8e0b8" opacity="0.4"/></g>'+
    '<g><path d="M 0 800 L 0 200 Q 20 150 60 130 Q 100 110 140 130 L 140 140 Q 100 125 60 145 Q 30 165 20 220 L 20 800 Z" fill="#0a0810"/><path d="M 5 500 Q 40 480 70 490 Q 50 510 5 520 Z" fill="#0a0810"/><path d="M 8 400 Q 50 380 90 395 Q 60 410 8 420 Z" fill="#0a0810"/></g>'+
    '<g class="branch"><path d="M 30 250 Q 100 230 180 240 Q 250 250 320 275 Q 260 285 180 270 Q 100 260 30 275 Z" fill="#0a0810"/>'+
      '<g class="catG" transform="translate(150, 175)"><ellipse cx="30" cy="60" rx="32" ry="45" fill="#000"/><ellipse cx="30" cy="20" rx="22" ry="20" fill="#000"/><path d="M 12 10 L 8 -8 L 22 6 Z" fill="#000"/><path d="M 48 10 L 52 -8 L 38 6 Z" fill="#000"/><ellipse cx="22" cy="20" rx="2.5" ry="3.5" fill="#7dd3fc"/><ellipse cx="38" cy="20" rx="2.5" ry="3.5" fill="#7dd3fc"/><circle cx="22" cy="20" r="1" fill="#000"/><circle cx="38" cy="20" r="1" fill="#000"/>'+
        '<g class="catT" transform="translate(60, 80)"><path d="M 0 0 Q 25 -15 35 10 Q 40 25 50 15" stroke="#000" stroke-width="6" fill="none" stroke-linecap="round"/></g>'+
      '</g>'+
    '</g>'+
    '<g class="leafC"><ellipse cx="60" cy="100" rx="50" ry="30" fill="#0a0810"/><ellipse cx="130" cy="70" rx="55" ry="35" fill="#0a0810"/><ellipse cx="200" cy="90" rx="50" ry="28" fill="#0a0810"/><ellipse cx="260" cy="110" rx="45" ry="25" fill="#0a0810"/><ellipse cx="90" cy="55" rx="40" ry="22" fill="#0a0810"/><ellipse cx="220" cy="50" rx="35" ry="20" fill="#0a0810"/></g>'+
    '<path d="M 0 750 Q 100 720 200 740 Q 300 760 400 730 L 400 800 L 0 800 Z" fill="#080610"/>'+
    '<g opacity="0.6"><circle cx="80" cy="745" r="1.5" fill="#fbbf24"/><circle cx="120" cy="750" r="1" fill="#fbbf24"/><circle cx="150" cy="742" r="1.5" fill="#fbbf24"/><circle cx="200" cy="748" r="1" fill="#fbbf24"/><circle cx="260" cy="745" r="1.5" fill="#fbbf24"/><circle cx="300" cy="750" r="1" fill="#fbbf24"/></g>'+
  '</svg>';
  fxLayer.appendChild(sc);
  for(var i=0;i<20;i++){
    var lf=document.createElement('div');
    lf.className='petal';
    var sz=5+Math.random()*7;
    lf.style.cssText='top:-20px;left:'+(Math.random()*60)+'%;width:'+sz+'px;height:'+(sz*0.6)+'px;background:linear-gradient(135deg,#1a0f08,#2a1810);border-radius:0 60% 0 60%;animation:leafFall '+(8+Math.random()*8)+'s linear infinite;animation-delay:'+(Math.random()*12)+'s;opacity:0.85';
    fxLayer.appendChild(lf);
  }
}

function addSimpleBg(n){
  var bgs={wave:'linear-gradient(180deg,#001f3f,#0074D9,#39CCCC)',lion:'linear-gradient(180deg,#7c2d12,#ea580c,#fbbf24)',crocodile:'linear-gradient(180deg,#052e16,#166534,#4ade80)',dragon:'linear-gradient(180deg,#450a0a,#dc2626,#f87171)',panda:'linear-gradient(180deg,#1f1f1f,#525252,#fbcfe8)',tiger:'linear-gradient(180deg,#1c1917,#ea580c,#fbbf24)',frog:'linear-gradient(180deg,#022c22,#059669,#6ee7b7)',wolf:'linear-gradient(180deg,#0a0a0a,#404040,#a3a3a3)',shark:'linear-gradient(180deg,#082f49,#0284c7,#67e8f9)',bee:'linear-gradient(180deg,#000,#ca8a04,#fde047)'};
  fxLayer.style.background=bgs[n]||'linear-gradient(180deg,#050515,#0f0d28)';
}

function applyTheme(n){
  if(!THEMES[n])n='moon';
  curTheme=n;
  document.body.className='t-'+n;
  try{localStorage.setItem('wave_theme',n)}catch(e){}
  emptyLogo.textContent=THEMES[n].e;
  voiceFace.textContent=THEMES[n].e;
  splashLogo.textContent=THEMES[n].e;
  updatePwaAssets(n);
  clearScene();
  if(n==='moon'){buildMoonScene()}
  else{addSimpleBg(n)}
}

function buildThemeList(){
  themeList.innerHTML='';
  Object.keys(THEMES).forEach(function(k){
    var d=document.createElement('button');
    d.className='themeItem'+(k===curTheme?' active':'');
    d.innerHTML='<span class="em">'+THEMES[k].e+'</span><span class="nm">'+THEMES[k].n+'</span>';
    d.onclick=function(){haptic();applyTheme(k);buildThemeList()};
    themeList.appendChild(d);
  });
}
function buildModelList(){
  modelList.innerHTML='';
  MODELS.forEach(function(m){
    var d=document.createElement('button');
    d.className='modelItem'+(m.id===currentModel?' active':'');
    d.innerHTML='<div class="mi-info"><div class="mi-name">'+m.name+'</div><div class="mi-sub">'+m.sub+'</div></div><span class="mi-badge">'+m.badge+'</span>';
    d.onclick=function(){haptic();currentModel=m.id;activeModelLabel.textContent=m.name.toUpperCase();try{localStorage.setItem('wave_model',m.id)}catch(e){}buildModelList();modelPanel.classList.remove('show')};
    modelList.appendChild(d);
  });
}

var st='moon';try{st=localStorage.getItem('wave_theme')||'moon'}catch(e){}
applyTheme(st);
var sm='deepseek';try{sm=localStorage.getItem('wave_model')||'deepseek'}catch(e){}
currentModel=sm;
MODELS.forEach(function(m){if(m.id===currentModel)activeModelLabel.textContent=m.name.toUpperCase()});

['W','a','v','e',' ','A','I'].forEach(function(c,i){
  var s=document.createElement('span');
  s.textContent=c===' '?'\u00A0':c;
  s.style.animationDelay=(i*80)+'ms';
  splashName.appendChild(s);
});

function sweepAway(){
  var start=performance.now(),dur=1000;
  function step(now){
    var p=Math.min((now-start)/dur,1),ease=1-Math.pow(1-p,3),y=900-ease*1000,wave='M 0 '+y;
    for(var x=0;x<=400;x+=20){
      var off=Math.sin(x*.03+p*10)*35;
      wave+=' Q '+(x+10)+' '+(y+off)+' '+(x+20)+' '+y;
    }
    wave+=' L 400 900 L 0 900 Z';
    sweepPath.setAttribute('d',wave);
    if(p<1)requestAnimationFrame(step);
    else{splash.classList.add('gone');setTimeout(function(){splash.remove()},800)}
  }
  requestAnimationFrame(step);
}

/* ============ ЧАТЫ ============ */
var CHATS=[],curChatId=null,conversationHistory=[];
function loadChats(){try{CHATS=JSON.parse(localStorage.getItem('wave_chats')||'[]')}catch(e){CHATS=[]}}
function saveChats(){try{localStorage.setItem('wave_chats',JSON.stringify(CHATS))}catch(e){}}
function getCurChat(){return CHATS.find(function(c){return c.id===curChatId})}
function newChat(){
  var id='chat_'+Date.now();
  CHATS.unshift({id:id,title:'Новый чат',messages:[],created:Date.now()});
  saveChats();curChatId=id;conversationHistory=[];
  renderMessages();updateChatList();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function formatMarkdown(t){
  if(!t)return'';
  var s=escapeHtml(t);
  s=s.replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>');
  s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
  s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  s=s.replace(/\*([^*]+)\*/g,'<em>$1</em>');
  return s;
}
function copyToClipboard(t){
  haptic();
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t)}
  else{var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(a)}
}
function addMsg(r,t,img,att){
  var c=getCurChat();
  if(!c){newChat();c=getCurChat()}
  c.messages.push({role:r,text:t,isImg:img||false,attachedImg:att||null,time:Date.now()});
  if(c.messages.length===1&&r==='user')c.title=t.substring(0,32)+(t.length>32?'…':'');
  saveChats();renderMessages();updateChatList();
}
function renderMessages(){
  var c=getCurChat();
  if(!c||c.messages.length===0){messagesEl.innerHTML='';messagesEl.appendChild(emptyState);emptyState.style.display='flex';return}
  messagesEl.innerHTML='';
  c.messages.forEach(function(m){
    var el=document.createElement('div');
    el.className='msg appear '+m.role+(m.isImg?' img':'');
    if(m.role==='wave'){
      el.innerHTML='<div class="waveHeader"><span class="waveMark">Wave</span><button class="copyBtn">📋</button></div>'+formatMarkdown(m.text);
      var b=el.querySelector('.copyBtn');
      if(b)b.onclick=function(){copyToClipboard(m.text);b.textContent='✓';setTimeout(function(){b.textContent='📋'},1500)};
    }else{
      el.innerHTML=formatMarkdown(m.text);
      if(m.attachedImg){var ie=document.createElement('img');ie.src=m.attachedImg;el.appendChild(ie)}
    }
    if(m.isImg){el.innerHTML='<img src="'+m.text+'">'}
    messagesEl.appendChild(el);
  });
  messagesEl.scrollTop=messagesEl.scrollHeight;
}
function showTyping(){
  var el=document.createElement('div');
  el.className='msg wave typing appear';el.id='typingIndicator';
  el.innerHTML='<span class="waveMark">Wave</span><div class="dots"><span></span><span></span><span></span></div>';
  messagesEl.appendChild(el);messagesEl.scrollTop=messagesEl.scrollHeight;
}
function hideTyping(){var el=$('typingIndicator');if(el)el.remove()}
function typeMessage(full,onDone){
  var c=getCurChat();if(!c)return;
  c.messages.push({role:'assistant',text:'',time:Date.now()});saveChats();
  var el=document.createElement('div');
  el.className='msg wave appear';
  el.innerHTML='<div class="waveHeader"><span class="waveMark">Wave</span><button class="copyBtn">📋</button></div><span class="typeText"></span><span class="typeCursor"></span>';
  messagesEl.appendChild(el);
  var sp=el.querySelector('.typeText'),cur=el.querySelector('.typeCursor'),btn=el.querySelector('.copyBtn'),i=0;
  function t(){
    if(i>=full.length){
      cur.remove();
      var idx=c.messages.length-1;c.messages[idx].text=full;saveChats();
      btn.onclick=function(){copyToClipboard(full);btn.textContent='✓';setTimeout(function(){btn.textContent='📋'},1500)};
      if(onDone)onDone();return;
    }
    sp.innerHTML=formatMarkdown(full.substring(0,i+1));
    i++;messagesEl.scrollTop=messagesEl.scrollHeight;
    setTimeout(t,18);
  }
  t();
}
function switchChat(id){
  curChatId=id;conversationHistory=[];
  var c=getCurChat();
  if(c){
    c.messages.forEach(function(m){
      if(!m.isImg&&(m.role==='user'||m.role==='assistant')&&m.text){
        conversationHistory.push({role:m.role,content:m.text});
      }
    });
    if(conversationHistory.length>10)conversationHistory=conversationHistory.slice(-10);
  }
  renderMessages();updateChatList();chatsPanel.classList.remove('show');
}
function updateChatList(){
  chatList.innerHTML='';
  if(CHATS.length===0){chatList.innerHTML='<p style="opacity:.5;font-size:14px;text-align:center;padding:20px">Нет чатов</p>';return}
  CHATS.forEach(function(c){
    var el=document.createElement('div');
    el.className='chatItem'+(c.id===curChatId?' active':'');
    var d=new Date(c.created),ds=d.getDate()+'.'+(d.getMonth()+1)+' '+d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
    el.innerHTML='<div class="info"><div class="chatTitle">'+escapeHtml(c.title)+'</div><div class="chatMeta">'+ds+' · '+c.messages.length+' сообщ.</div></div><button class="del">×</button>';
    el.onclick=function(e){if(e.target.classList.contains('del'))return;haptic();switchChat(c.id)};
    el.querySelector('.del').onclick=function(e){
      e.stopPropagation();haptic();
      if(confirm('Удалить?')){
        CHATS=CHATS.filter(function(x){return x.id!==c.id});
        if(curChatId===c.id)curChatId=null;
        saveChats();
        if(!curChatId&&CHATS.length>0)curChatId=CHATS[0].id;
        else if(CHATS.length===0)newChat();
        renderMessages();updateChatList();
      }
    };
    chatList.appendChild(el);
  });
}
loadChats();
if(CHATS.length>0){curChatId=CHATS[0].id;renderMessages()}else{newChat()}

/* ============ ЗВУК ============ */
var audioCtx=null;
function initAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}}
function playClick(){
  initAudio();if(!audioCtx)return;
  var t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type='sine';o.frequency.setValueAtTime(660,t);
  o.frequency.exponentialRampToValueAtTime(990,t+.05);
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(.08,t+.01);
  g.gain.exponentialRampToValueAtTime(.0001,t+.12);
  o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.15);
}

/* ============ ОЗВУЧКА ============ */
function stopSpeak(){
  if(currentAudio){try{currentAudio.pause()}catch(e){}currentAudio=null}
  try{speechSynthesis.cancel()}catch(e){}
}
function sysSpeak(text,onEnd){
  if(!('speechSynthesis' in window)){if(onEnd)onEnd();return}
  try{speechSynthesis.cancel()}catch(e){}
  var u=new SpeechSynthesisUtterance(text);
  u.lang='ru-RU';u.rate=1.15;u.pitch=0.75;
  var vs=speechSynthesis.getVoices();
  var mv=vs.find(function(v){return v.name&&(v.name.indexOf('Yuri')>=0||v.name.indexOf('Юрий')>=0)});
  var rv=mv||vs.find(function(v){return v.lang==='ru-RU'})||vs.find(function(v){return v.lang&&v.lang.indexOf('ru')===0});
  if(rv)u.voice=rv;
  u.onend=function(){if(onEnd)onEnd()};
  u.onerror=u.onend;
  speechSynthesis.speak(u);
}

/* ============ ИИ ============ */
var BASE_SYS='Ты Wave AI — умный ИИ-ассистент. Помогаешь со школьными задачами (1-11 класс) по всем предметам. Решай задачи ПОШАГОВО: условие → формула → решение → ответ. Также общайся, шути. Отвечай по-русски, содержательно. Форматирование: **жирный**, списки.';

function askOneModel(mid,text){
  var msgs=[{role:'system',content:BASE_SYS}].concat(conversationHistory).concat([{role:'user',content:text}]);
  return fetch('https://text.pollinations.ai/openai',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:mid,messages:msgs,temperature:0.8,max_tokens:800})
  }).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(d){
    var rep=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||d.response||'';
    rep=String(rep).trim();
    if(!rep||rep.length<2)throw new Error('empty');
    return rep;
  });
}
function askAI(text){
  conversationHistory.push({role:'user',content:text});
  if(conversationHistory.length>10)conversationHistory=conversationHistory.slice(-10);
  var order=[currentModel];
  MODELS.forEach(function(m){if(m.id!==currentModel)order.push(m.id)});
  function tI(i){
    if(i>=order.length){return smartLocal(text)}
    return askOneModel(order[i],text).catch(function(){return tI(i+1)});
  }
  return tI(0);
}
function smartLocal(text){
  var urls=[
    'https://text.pollinations.ai/'+encodeURIComponent(text)+'?model=deepseek',
    'https://text.pollinations.ai/'+encodeURIComponent(text)+'?model=mistral',
    'https://text.pollinations.ai/'+encodeURIComponent(text)
  ];
  function tU(i){
    if(i>=urls.length)return Promise.resolve('Не удалось ответить.');
    return fetch(urls[i]).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){
      t=String(t).replace(/[*_`#]/g,'').trim();
      if(t.length>1500)t=t.substring(0,1500);
      if(!t)throw 0;
      conversationHistory.push({role:'assistant',content:t});
      return t;
    }).catch(function(){return tU(i+1)});
  }
  return tU(0);
}

/* ============ МАТЕМАТИКА ============ */
var NW={'ноль':0,'один':1,'два':2,'три':3,'четыре':4,'пять':5,'шесть':6,'семь':7,'восемь':8,'девять':9,'десять':10};
function wN(t){return t.split(/\s+/).map(function(w){var l=w.toLowerCase().replace(/[^а-яё]/g,'');return NW.hasOwnProperty(l)?NW[l]:w}).join(' ')}
function tryMath(text){
  var s=' '+wN(text.toLowerCase())+' ';
  s=s.replace(/\bплюс\b/g,'+').replace(/\bминус\b/g,'-').replace(/\bумножить на\b/g,'*').replace(/\bразделить на\b/g,'/');
  s=s.replace(/,/g,'.').replace(/[^0-9+\-*\/.\s()]/g,' ').trim();
  if(!/[0-9]/.test(s)||!/[+\-*\/]/.test(s))return null;
  try{var r=Function('"use strict";return ('+s+')')();if(typeof r!=='number'||!isFinite(r))return null;return Math.round(r*10000)/10000}catch(e){return null}
}

/* ============ КОМАНДЫ ============ */
function handleCmd(text){
  var t=text.toLowerCase().trim();
  var tm=t.match(/тема\s+(\w+)/);
  if(tm){for(var k in THEMES){if(k.indexOf(tm[1])>=0||THEMES[k].n.toLowerCase().indexOf(tm[1])>=0){applyTheme(k);buildThemeList();return'Тема '+THEMES[k].n+'.'}}}
  var mm=t.match(/модель\s+(\w+)/);
  if(mm){for(var i=0;i<MODELS.length;i++){if(MODELS[i].id.indexOf(mm[1])>=0||MODELS[i].name.toLowerCase().indexOf(mm[1])>=0){currentModel=MODELS[i].id;activeModelLabel.textContent=MODELS[i].name.toUpperCase();try{localStorage.setItem('wave_model',currentModel)}catch(e){}buildModelList();return'Модель '+MODELS[i].name+'.'}}}
  var im=t.match(/(?:сгенерируй|нарисуй|покажи|создай)\s+(?:картинку|изображение|рисунок)?\s*(.+)/i);
  if(im){var p=im[1].trim();if(p&&p.length>2){genImage(p);return'__IMG__'}}
  var m=tryMath(t);if(m!==null)return'Ответ: '+m;
  if(t.indexOf('который час')>=0){var d=new Date();return'Сейчас '+d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes()}
  if(t.indexOf('монетк')>=0)return Math.random()<0.5?'Орёл!':'Решка!';
  if(t.indexOf('кубик')>=0)return'Выпало: '+(Math.floor(Math.random()*6)+1);
  return null;
}

function genImage(prompt){
  addMsg('user','Нарисуй: '+prompt);showTyping();
  setTimeout(function(){
    var url='https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt)+'?width=768&height=768&nologo=true&seed='+Math.floor(Math.random()*1000000);
    var img=new Image();
    img.onload=function(){hideTyping();addMsg('wave',url,true)};
    img.onerror=function(){hideTyping();addMsg('wave','Не удалось.')};
    img.src=url;
  },800);
}

function sendText(text){
  if((!text||!text.trim())&&!attachedImageBase64)return;
  text=text.trim();
  var att=attachedImageBase64;
  attachedImageBase64=null;
  attachmentPreview.style.display='none';
  addMsg('user',text||'[Изображение]',false,att);
  var cmd=handleCmd(text);
  if(cmd==='__IMG__')return;
  if(cmd){setTimeout(function(){addMsg('wave',cmd)},100);return}
  showTyping();
  askAI(text||'Опиши изображение').then(function(rep){hideTyping();typeMessage(rep)});
}

/* ============ КНОПКИ ============ */
sendBtn.onclick=function(){haptic();var t=chatField.value.trim();playClick();chatField.value='';sendText(t)};
chatField.onkeydown=function(e){if(e.key==='Enter')sendBtn.click()};
attachBtn.onclick=function(){haptic();playClick();fileInput.click()};
fileInput.onchange=function(){
  var f=fileInput.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(e){attachedImageBase64=e.target.result;previewImg.src=attachedImageBase64;attachName.textContent=f.name;attachmentPreview.style.display='flex'};
  r.readAsDataURL(f);
};
removeAttachBtn.onclick=function(){haptic();attachedImageBase64=null;fileInput.value='';attachmentPreview.style.display='none'};
menuBtn.onclick=function(){haptic();playClick();updateChatList();chatsPanel.classList.add('show')};
chatsClose.onclick=function(){haptic();playClick();chatsPanel.classList.remove('show')};
newChatBtn.onclick=function(){haptic();playClick();newChat();chatsPanel.classList.remove('show')};
clearChatBtn.onclick=function(){haptic();playClick();if(confirm('Очистить?')){var c=getCurChat();if(c){c.messages=[];saveChats();renderMessages()}chatsPanel.classList.remove('show')}};
installAppBtn.onclick=function(){haptic();playClick();profileModal.classList.add('show')};
themeBtn.onclick=function(){haptic();playClick();buildThemeList();themePanel.classList.add('show')};
themeClose.onclick=function(){haptic();playClick();themePanel.classList.remove('show')};
modelBtn.onclick=function(){haptic();playClick();buildModelList();modelPanel.classList.add('show')};
modelClose.onclick=function(){haptic();playClick();modelPanel.classList.remove('show')};
donateBtn.onclick=function(){haptic();playClick();donateModal.classList.add('show')};
donateClose.onclick=function(){haptic();playClick();donateModal.classList.remove('show')};
donateGo.onclick=function(){haptic();playClick();toastMsg('Спасибо за поддержку! ❤️');donateModal.classList.remove('show')};

/* ============ ТЕРМИНАЛ ============ */
function runTerminal(){
  var lines=[
    {t:'Инициализация Wave AI...',c:'info'},
    {t:'Проверка соединения......... <span class="ok">OK</span>'},
    {t:'Загрузка ресурсов........... <span class="ok">OK</span>'},
    {t:'Подготовка ссылки для установки...',c:'dim'},
    {t:'Сборка приложения........... <span class="ok">OK</span>'},
    {t:'Генерация иконки............ <span class="ok">OK</span>'},
    {t:'Проверка совместимости...... <span class="ok">OK</span>'},
    {t:'',c:''},
    {t:'> Сайт собирается установить приложение Wave AI',c:'info'},
    {t:'',c:''}
  ];
  var i=0;terminalContent.innerHTML='';terminal.classList.add('show');
  function n(){
    if(i>=lines.length){
      setTimeout(function(){
        terminal.classList.add('gone');
        setTimeout(function(){terminal.classList.remove('show','gone')},500);
        var isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
        var isSA=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
        if(isSA){toastMsg('Приложение уже установлено!');return}
        if(deferredPrompt){try{deferredPrompt.prompt();deferredPrompt.userChoice.then(function(){deferredPrompt=null})}catch(e){iosGuide.classList.add('show')}}
        else if(isIOS){iosGuide.classList.add('show')}
        else{toastMsg('Открой меню браузера → «Установить приложение»')}
      },400);
      return;
    }
    var l=lines[i];
    var d=document.createElement('div');d.className='termLine';
    if(l.c==='info')d.innerHTML='<span class="info">'+l.t+'</span>';
    else if(l.c==='dim')d.innerHTML='<span class="dim">'+l.t+'</span>';
    else d.innerHTML='<span class="prompt">$</span>'+l.t;
    terminalContent.appendChild(d);i++;
    setTimeout(n,300+Math.random()*250);
  }
  n();
}
profileInstall.onclick=function(){initAudio();playClick();profileModal.classList.remove('show');try{localStorage.setItem('wave_pwa_shown','1')}catch(e){}runTerminal()};
profileCancel.onclick=function(){initAudio();playClick();profileModal.classList.remove('show')};
guideClose.onclick=function(){haptic();iosGuide.classList.remove('show')};
guideOk.onclick=function(){haptic();iosGuide.classList.remove('show')};

/* ============ ГОЛОС ============ */
if(window.SpeechRecognition||window.webkitSpeechRecognition){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  voiceRec=new SR();
  voiceRec.lang='ru-RU';
  voiceRec.interimResults=true;
  voiceRec.continuous=false;
  voiceRec.onstart=function(){voiceIsListening=true;voiceOverlay.classList.add('listening');voiceBtn.classList.add('listening');voiceSub.textContent='СЛУШАЮ';voiceTitle.textContent='…';voiceFinal=''};
  voiceRec.onresult=function(e){
    var i2='',f2='';
    for(var i=e.resultIndex;i<e.results.length;i++){
      var t=e.results[i][0].transcript;
      if(e.results[i].isFinal)f2+=t;else i2+=t;
    }
    if(f2)voiceFinal+=f2;
    voiceTitle.textContent=(voiceFinal+' '+i2).trim();
  };
  voiceRec.onerror=function(){voiceIsListening=false;voiceOverlay.classList.remove('listening');voiceBtn.classList.remove('listening');voiceSub.textContent='ОШИБКА'};
  voiceRec.onend=function(){
    voiceIsListening=false;voiceOverlay.classList.remove('listening');voiceBtn.classList.remove('listening');
    var t=voiceFinal.trim();
    if(t){processVoice(t)}else{voiceSub.textContent='НЕ РАССЛЫШАЛ';voiceTitle.textContent='Повтори'}
  };
}
function processVoice(text){
  addMsg('user',text);
  voiceSub.textContent='ДУМАЕТ';voiceTitle.textContent=text;
  var cmd=handleCmd(text);
  if(cmd==='__IMG__')return;
  if(cmd){setTimeout(function(){addMsg('wave',cmd);voiceSpeak(cmd)},150);return}
  askAI(text).then(function(rep){addMsg('wave',rep);voiceSpeak(rep)});
}
function voiceSpeak(text){
  stopSpeak();voiceSub.textContent='ГОВОРИТ';voiceTitle.textContent=text;
  if(useNeural){
    try{
      var url='https://text.pollinations.ai/'+encodeURIComponent(text)+'?model=openai-audio&voice='+VOICE;
      var a=new Audio(url);currentAudio=a;
      a.onended=function(){currentAudio=null;voiceSub.textContent='ГОТОВ'};
      a.onerror=function(){useNeural=false;voiceSysSpeak(text)};
      var p=a.play();
      if(p&&p.catch)p.catch(function(){useNeural=false;voiceSysSpeak(text)});
      return;
    }catch(e){useNeural=false}
  }
  voiceSysSpeak(text);
}
function voiceSysSpeak(text){
  if(!('speechSynthesis' in window))return;
  try{speechSynthesis.cancel()}catch(e){}
  var u=new SpeechSynthesisUtterance(text);
  u.lang='ru-RU';u.rate=1.15;u.pitch=0.75;
  var vs=speechSynthesis.getVoices();
  var mv=vs.find(function(v){return v.name&&(v.name.indexOf('Yuri')>=0||v.name.indexOf('Юрий')>=0)});
  var rv=mv||vs.find(function(v){return v.lang==='ru-RU'})||vs.find(function(v){return v.lang&&v.lang.indexOf('ru')===0});
  if(rv)u.voice=rv;
  u.onend=function(){voiceSub.textContent='ГОТОВ'};
  u.onerror=u.onend;
  speechSynthesis.speak(u);
}
voiceOpenBtn.onclick=function(){haptic();initAudio();playClick();stopSpeak();voiceOutputEnabled=true;voiceOverlay.classList.add('show');voiceTitle.textContent='Нажми кнопку и говори';voiceSub.textContent='ГОТОВ'};
voiceExitBtn.onclick=function(){haptic();initAudio();playClick();voiceOutputEnabled=false;if(voiceIsListening&&voiceRec)voiceRec.stop();stopSpeak();voiceOverlay.classList.remove('show','listening')};
voiceBtn.onclick=function(){haptic();initAudio();playClick();if(!voiceRec){voiceTitle.textContent='Микрофон не поддерживается';return}if(voiceIsListening){voiceRec.stop();return}stopSpeak();try{voiceRec.start()}catch(e){}};

/* ============ СТАРТ ============ */
(function(){
  var isSA=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  var shown=localStorage.getItem('wave_pwa_shown')==='1';
  terminal.style.display='none';
  if(!isSA&&!shown){
    setTimeout(sweepAway,2200);
    setTimeout(function(){profileModal.classList.add('show')},3400);
  }else{
    setTimeout(sweepAway,2200);
  }
})();

document.body.addEventListener('touchstart',function(){initAudio()},{once:true});
document.body.addEventListener('click',function(){initAudio()},{once:true});