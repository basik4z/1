/* ЭЛЕМЕНТЫ */
var face=document.getElementById('face');
var dialogEl=document.getElementById('dialog');
var statusEl=document.getElementById('status');
var talkBtn=document.getElementById('talkBtn');
var repeatBtn=document.getElementById('repeatBtn');
var moodBtn=document.getElementById('moodBtn');
var chatField=document.getElementById('chatField');
var chatSend=document.getElementById('chatSend');
var helpBtn=document.getElementById('helpBtn');
var helpPanel=document.getElementById('helpPanel');
var helpClose=document.getElementById('helpClose');
var histBtn=document.getElementById('histBtn');
var histPanel=document.getElementById('histPanel');
var histClose=document.getElementById('histClose');
var clearHist=document.getElementById('clearHist');
var historyList=document.getElementById('historyList');
var imgBox=document.getElementById('imgBox');
var resultImg=document.getElementById('resultImg');
var splash=document.getElementById('splash');
var splashName=document.getElementById('splashName');
var sweepPath=document.getElementById('sweepPath');
var app=document.getElementById('app');

/* АНИМАЦИЯ ИМЕНИ */
['W','a','v','e',' ','A','I'].forEach(function(ch,i){
  var s=document.createElement('span');
  s.textContent=ch===' '?'\u00A0':ch;
  s.style.animationDelay=(i*80)+'ms';
  splashName.appendChild(s);
});

/* ВОЛНА СМЫВАЕТ */
function sweepAway(){
  var start=performance.now(),dur=900;
  function step(now){
    var p=Math.min((now-start)/dur,1);
    var ease=1-Math.pow(1-p,3);
    var y=900-ease*1000;
    var wave='M 0 '+y;
    for(var x=0;x<=400;x+=20){
      var off=Math.sin(x*0.03+p*10)*30;
      wave+=' Q '+(x+10)+' '+(y+off)+' '+(x+20)+' '+y;
    }
    wave+=' L 400 900 L 0 900 Z';
    sweepPath.setAttribute('d',wave);
    if(p<1)requestAnimationFrame(step);
    else{
      splash.classList.add('gone');
      app.classList.add('show');
      setTimeout(function(){splash.remove()},600);
      setTimeout(startGreeting,300);
    }
  }
  requestAnimationFrame(step);
}
setTimeout(sweepAway,2500);

/* УСТРОЙСТВО */
function detectDevice(){
  var ua=navigator.userAgent,os='?';
  if(/iPhone/.test(ua))os='iPhone';
  else if(/iPad/.test(ua))os='iPad';
  else if(/Android/.test(ua))os='Android';
  else if(/Mac/.test(ua))os='Mac';
  else if(/Windows/.test(ua))os='Windows';
  var browser='?';
  if(/CriOS/.test(ua))browser='Chrome iOS';
  else if(/FxiOS/.test(ua))browser='Firefox iOS';
  else if(/Chrome/.test(ua))browser='Chrome';
  else if(/Safari/.test(ua))browser='Safari';
  var screenSize=screen.width+'x'+screen.height;
  var fp=[os,browser,screenSize,navigator.language].join('|');
  var id=0;
  for(var i=0;i<fp.length;i++){id=((id<<5)-id)+fp.charCodeAt(i);id|=0}
  return{os:os,browser:browser,screen:screenSize,id:Math.abs(id).toString(36)};
}
var DEVICE=detectDevice();
var DEVICE_KEY='wave_device_'+DEVICE.id;
var DEVICE_DATA={};
try{DEVICE_DATA=JSON.parse(localStorage.getItem(DEVICE_KEY)||'{}')}catch(e){DEVICE_DATA={}}
if(!DEVICE_DATA.firstSeen){DEVICE_DATA.firstSeen=Date.now();DEVICE_DATA.visits=1}
else{DEVICE_DATA.visits=(DEVICE_DATA.visits||0)+1}
try{localStorage.setItem(DEVICE_KEY,JSON.stringify(DEVICE_DATA))}catch(e){}

/* ИСТОРИЯ */
var HISTORY=[];
try{HISTORY=JSON.parse(localStorage.getItem(DEVICE_KEY+'_history')||'[]')}catch(e){HISTORY=[]}
function saveHistory(){
  if(HISTORY.length>100)HISTORY=HISTORY.slice(-100);
  try{localStorage.setItem(DEVICE_KEY+'_history',JSON.stringify(HISTORY))}catch(e){}
}
function addToHistory(role,text){HISTORY.push({role:role,text:text,time:Date.now()});saveHistory()}

/* ВКУСЫ */
var TASTES=[];
try{TASTES=JSON.parse(localStorage.getItem(DEVICE_KEY+'_tastes')||'[]')}catch(e){TASTES=[]}
function saveTastes(){try{localStorage.setItem(DEVICE_KEY+'_tastes',JSON.stringify(TASTES))}catch(e){}}
function detectTaste(text){
  var t=text.toLowerCase();
  var m=t.match(/(?:мне нравится|я люблю|обожаю|предпочитаю)[\s,:-]+(.+)/i);
  if(m){
    var taste=m[1].trim().replace(/[.!?]+$/,'');
    if(taste&&TASTES.indexOf(taste)<0){TASTES.push(taste);saveTastes();return 'Запомнил: тебе нравится '+taste+'.'}
  }
  return null;
}
function getTastesContext(){return TASTES.length===0?'':'Пользователю нравится: '+TASTES.join(', ')+'.'}

/* ЗВУК */
var audioCtx=null;
function initAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}}
function playClick(){
  initAudio();if(!audioCtx)return;
  var t=audioCtx.currentTime;
  var o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type='sine';o.frequency.setValueAtTime(660,t);
  o.frequency.exponentialRampToValueAtTime(990,t+0.05);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(0.1,t+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.12);
  o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+0.15);
}

/* ГОЛОС */
var currentAudio=null,lastSpokenText='',useNeural=true,VOICE_NAME='echo';

function stopSpeak(){
  if(currentAudio){try{currentAudio.pause()}catch(e){}currentAudio=null}
  try{speechSynthesis.cancel()}catch(e){}
}
function speak(text,onEnd){
  if(!text){if(onEnd)onEnd();return}
  lastSpokenText=text;
  stopSpeak();
  face.classList.add('talking');
  face.classList.remove('listening');
  statusEl.textContent='говорит';
  statusEl.className='speaking';
  dialogEl.innerHTML='<span class="wave">Wave</span>'+text;

  if(useNeural){
    try{
      var url='https://text.pollinations.ai/'+encodeURIComponent(text)+'?model=openai-audio&voice='+VOICE_NAME;
      var audio=new Audio(url);
      currentAudio=audio;
      audio.onended=function(){
        face.classList.remove('talking');
        statusEl.textContent='готов';
        statusEl.className='';
        currentAudio=null;
        if(onEnd)onEnd();
      };
      audio.onerror=function(){useNeural=false;systemSpeak(text,onEnd)};
      var p=audio.play();
      if(p&&p.catch)p.catch(function(){useNeural=false;systemSpeak(text,onEnd)});
      return;
    }catch(e){useNeural=false;systemSpeak(text,onEnd);return}
  }
  systemSpeak(text,onEnd);
}
function systemSpeak(text,onEnd){
  if(!('speechSynthesis' in window)){if(onEnd)onEnd();return}
  try{speechSynthesis.cancel()}catch(e){}
  var u=new SpeechSynthesisUtterance(text);
  u.lang='ru-RU';u.rate=1.0;u.pitch=0.85;
  var voices=speechSynthesis.getVoices();
  var male=voices.find(function(v){return v.name&&(v.name.indexOf('Yuri')>=0||v.name.indexOf('Юрий')>=0)});
  var ru=male||voices.find(function(v){return v.lang==='ru-RU'})||voices.find(function(v){return v.lang&&v.lang.indexOf('ru')===0});
  if(ru)u.voice=ru;
  u.onend=function(){
    face.classList.remove('talking');
    statusEl.textContent='готов';
    statusEl.className='';
    if(onEnd)onEnd();
  };
  u.onerror=u.onend;
  speechSynthesis.speak(u);
}

/* ИИ */
var conversationHistory=[];
var BASE_SYSTEM='Ты Wave AI, умный голосовой ассистент мужского пола. Веди себя как живой человек: понимаешь контекст, шутишь, задаёшь встречные вопросы, помнишь что было раньше. Отвечай по-русски, 1-3 предложения, живо и естественно. Без смайликов и разметки.';

function askAI(userText){
  conversationHistory.push({role:'user',content:userText});
  if(conversationHistory.length>20)conversationHistory.splice(0,conversationHistory.length-20);
  var sys=BASE_SYSTEM;
  var tasteCtx=getTastesContext();
  if(tasteCtx)sys+=' '+tasteCtx;
  sys+=' Устройство пользователя: '+DEVICE.os+', браузер '+DEVICE.browser+'.';

  return fetch('https://text.pollinations.ai/openai',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'openai',
      messages:[{role:'system',content:sys}].concat(conversationHistory),
      temperature:0.9,
      max_tokens:180
    })
  }).then(function(res){
    if(!res.ok)throw new Error('HTTP '+res.status);
    return res.json();
  }).then(function(data){
    var reply=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||data.response||'';
    reply=String(reply).replace(/[*_`#]/g,'').replace(/\n+/g,' ').trim();
    if(!reply)reply='Хм, не знаю что сказать.';
    conversationHistory.push({role:'assistant',content:reply});
    return reply;
  }).catch(function(err){
    console.warn('AI error:',err);
    return fallbackAnswer(userText);
  });
}

/* ВЫРАЖЕНИЯ ЛИЦА */
function setMood(mood){
  ['happy','sad','angry','surprised'].forEach(function(m){face.classList.remove(m)});
  if(mood)face.classList.add(mood);
}

/* КАЛЬКУЛЯТОР */
var NUM_WORDS={
  'ноль':0,'один':1,'одна':1,'два':2,'две':2,'три':3,'четыре':4,'пять':5,
  'шесть':6,'семь':7,'восемь':8,'девять':9,'десять':10,'одиннадцать':11,
  'двенадцать':12,'тринадцать':13,'четырнадцать':14,'пятнадцать':15,
  'шестнадцать':16,'семнадцать':17,'восемнадцать':18,'девятнадцать':19,'двадцать':20,
  'тридцать':30,'сорок':40,'пятьдесят':50,'шестьдесят':60,'семьдесят':70,
  'восемьдесят':80,'девяносто':90,'сто':100,'тысяча':1000
};
function wordsToNumbers(text){
  var parts=text.split(/\s+/);
  var result=[];
  parts.forEach(function(w){
    var lw=w.toLowerCase().replace(/[^а-яё]/g,'');
    if(NUM_WORDS.hasOwnProperty(lw))result.push(NUM_WORDS[lw]);
    else result.push(w);
  });
  return result.join(' ');
}
function tryMath(text){
  var s=' '+wordsToNumbers(text.toLowerCase())+' ';
  s=s.replace(/\s*сколько\s*(будет)?\s*/g,' ');
  s=s.replace(/\s*посчитай\s*/g,' ');
  s=s.replace(/\bплюс\b/g,'+').replace(/\bприбавить\b/g,'+');
  s=s.replace(/\bминус\b/g,'-').replace(/\bотнять\b/g,'-').replace(/\bвычесть\b/g,'-');
  s=s.replace(/\bумножить на\b/g,'*').replace(/\bумножить\b/g,'*');
  s=s.replace(/\bразделить на\b/g,'/').replace(/\bразделить\b/g,'/');
  s=s.replace(/,/g,'.').replace(/[^0-9+\-*\/.\s()]/g,' ').trim();
  if(!/[0-9]/.test(s)||!/[+\-*\/]/.test(s))return null;
  if(!/^[0-9+\-*\/.()\s]+$/.test(s))return null;
  try{
    var r=Function('"use strict";return ('+s+')')();
    if(typeof r!=='number'||!isFinite(r))return null;
    return Math.round(r*10000)/10000;
  }catch(e){return null}
}

/* КОМАНДЫ */
function handleCommand(text){
  var t=text.toLowerCase().trim();

  if(/зл(ое|ой|ым)?\s*лицо|разозлись|будь злым|злись/.test(t)){setMood('angry');return 'Вот моё злое лицо. Что случилось?'}
  if(/груст(ное|ным|ной)?\s*лицо|загрусти|будь грустным|погрусти/.test(t)){setMood('sad');return 'Мне грустно. Расскажи что-нибудь хорошее.'}
  if(/удивл(ённое|енное|ённым)?|удивись|будь удивлён/.test(t)){setMood('surprised');return 'Ого! Я удивлён!'}
  if(/улыбнись|улыбк?а|весёлое лицо|радостное лицо|будь весёлым/.test(t)){setMood('happy');return 'Улыбаюсь! Так лучше?'}
  if(/обычное лицо|нормальное лицо|нейтральное|успокойся/.test(t)){setMood(null);return 'Ладно, обычное лицо.'}

  var imgMatch=t.match(/(?:сгенерируй|нарисуй|покажи|создай)\s+(?:картинку|изображение|рисунок)?\s*(.+)/i);
  if(imgMatch){
    var prompt=imgMatch[1].trim();
    if(prompt&&prompt.length>2){generateImage(prompt);return '__IMAGE__'}
  }

  var math=tryMath(t);
  if(math!==null)return 'Получается '+math+'.';

  if(t.indexOf('который час')>=0||t.indexOf('сколько времени')>=0){
    var d=new Date();
    return 'Сейчас '+d.getHours()+' часов '+d.getMinutes()+' минут.';
  }
  if(t.indexOf('какое число')>=0||t.indexOf('какая дата')>=0){
    var d2=new Date();
    var m=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return 'Сегодня '+d2.getDate()+' '+m[d2.getMonth()]+' '+d2.getFullYear()+' года.';
  }
  if(t.indexOf('монетк')>=0)return Math.random()<0.5?'Выпал орёл.':'Выпала решка.';
  if(t.indexOf('кубик')>=0)return 'Выпало '+(Math.floor(Math.random()*6)+1)+'.';
  var rndM=t.match(/(?:случайное|рандом|число)\s*(?:от\s*)?(\d+)\s*(?:до|-)\s*(\d+)/);
  if(rndM){var a=+rndM[1],b=+rndM[2];return 'Случайное число: '+(Math.floor(Math.random()*(b-a+1))+a)+'.'}

  var tasteResult=detectTaste(text);
  if(tasteResult)return tasteResult;
  if(t.indexOf('что мне нравится')>=0||t.indexOf('мои вкусы')>=0){
    if(TASTES.length===0)return 'Ты пока не рассказывал о вкусах.';
    return 'Тебе нравится: '+TASTES.join(', ')+'.';
  }

  if(t.indexOf('что за устройство')>=0||t.indexOf('какое у меня устройство')>=0){
    return 'Ты используешь '+DEVICE.os+', браузер '+DEVICE.browser+', экран '+DEVICE.screen+'. Заходил сюда '+DEVICE_DATA.visits+' раз.';
  }

  if(t.indexOf('шутк')>=0||t.indexOf('анекдот')>=0){
    var jokes=[
      'Почему программисты путают Хэллоуин и Рождество? Потому что OCT 31 равно DEC 25.',
      'Заходит нейросеть в бар, а бармен: вам как обычно? Нейросеть: я тут впервые.',
      'Что сказал один бит другому? Ты мне нравишься, но у нас разные байты.',
      'Программист ставит на ночь два стакана: один с водой, второй пустой.',
      'Почему у программистов путаница в личной жизни? Ищут баг, а находят фичу.'
    ];
    return jokes[Math.floor(Math.random()*jokes.length)];
  }
  if(t.indexOf('факт')>=0){
    var facts=[
      'Осьминог имеет три сердца и голубую кровь.',
      'Мёд не портится — находили съедобный мёд в гробницах возрастом 3000 лет.',
      'Бананы — это ягоды, а малина — нет.',
      'У улитки около 25 тысяч зубов.',
      'Человеческий мозг тратит 20 процентов всей энергии тела.',
      'Свет от Солнца идёт до Земли 8 минут 20 секунд.'
    ];
    return facts[Math.floor(Math.random()*facts.length)];
  }
  return null;
}

/* ГЕНЕРАЦИЯ КАРТИНОК */
function generateImage(prompt){
  face.classList.add('spraying');
  face.classList.remove('talking','listening');
  statusEl.textContent='рисует';
  statusEl.className='thinking';
  dialogEl.innerHTML='<span class="wave">Wave</span>Рисую: '+prompt+'…';
  speak('Рисую '+prompt);

  setTimeout(function(){
    var url='https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt)+'?width=768&height=768&nologo=true&seed='+Math.floor(Math.random()*1000000);
    resultImg.src=url;
    resultImg.onload=function(){
      face.classList.remove('spraying');
      imgBox.classList.add('show');
      statusEl.textContent='готов';
      statusEl.className='';
      addToHistory('wave','[Картинка: '+prompt+']');
    };
    resultImg.onerror=function(){
      face.classList.remove('spraying');
      statusEl.textContent='ошибка картинки';
      statusEl.className='';
      speak('Не удалось нарисовать. Попробуй ещё.');
    };
  },1500);
}

/* FALLBACK */
function fallbackAnswer(text){
  var t=text.toLowerCase();
  if(t.indexOf('привет')>=0)return 'Привет! Как ты?';
  if(t.indexOf('как дела')>=0)return 'Отлично! А у тебя?';
  if(t.indexOf('как ты')>=0)return 'Хорошо, спасибо. А ты?';
  if(t.indexOf('кто ты')>=0)return 'Я Wave AI, твой голосовой ассистент.';
  if(t.indexOf('пока')>=0||t.indexOf('до свидания')>=0)return 'Пока! Возвращайся.';
  if(t.indexOf('спасибо')>=0)return 'Пожалуйста!';
  return 'Интересно. Расскажи подробнее.';
}

function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}

function processUserText(text){
  if(!text||!text.trim())return;
  text=text.trim();
  dialogEl.innerHTML='<span class="you">ты</span>'+text;
  addToHistory('user',text);
  imgBox.classList.remove('show');

  var cmd=handleCommand(text);
  if(cmd==='__IMAGE__')return;
  if(cmd){
    sleep(200).then(function(){addToHistory('wave',cmd);speak(cmd)});
    return;
  }

  statusEl.textContent='думает';
  statusEl.className='thinking';
  askAI(text).then(function(reply){
    addToHistory('wave',reply);
    speak(reply);
  });
}

/* РАСПОЗНАВАНИЕ */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
var recognition=null,isListening=false,finalText='';

if(SR){
  recognition=new SR();
  recognition.lang='ru-RU';
  recognition.interimResults=true;
  recognition.continuous=false;

  recognition.onstart=function(){
    isListening=true;
    face.classList.add('listening');
    talkBtn.classList.add('active','listening');
    statusEl.textContent='слушаю';
    statusEl.className='listening';
    finalText='';
    dialogEl.innerHTML='';
  };
  recognition.onresult=function(e){
    var interim='',final='';
    for(var i=e.resultIndex;i<e.results.length;i++){
      var t=e.results[i][0].transcript;
      if(e.results[i].isFinal)final+=t;else interim+=t;
    }
    if(final)finalText+=final;
    dialogEl.innerHTML='<span class="you">ты</span>'+(finalText+' '+interim).trim();
  };
  recognition.onerror=function(e){
    isListening=false;
    face.classList.remove('listening');
    talkBtn.classList.remove('active','listening');
    if(e.error==='not-allowed')dialogEl.textContent='Дай доступ к микрофону';
    statusEl.textContent='готов';
    statusEl.className='';
  };
  recognition.onend=function(){
    isListening=false;
    face.classList.remove('listening');
    talkBtn.classList.remove('active','listening');
    var t=finalText.trim();
    if(t)processUserText(t);
    else{statusEl.textContent='готов';statusEl.className='';speak('Не расслышал. Повтори ещё раз.')}
  };
}

/* КНОПКИ */
talkBtn.onclick=function(){
  initAudio();playClick();
  if(!SR){speak('Браузер не поддерживает микрофон.');return}
  if(isListening){recognition.stop();return}
  stopSpeak();
  face.classList.remove('talking','waving','spraying');
  try{recognition.start()}catch(e){}
};
repeatBtn.onclick=function(){initAudio();playClick();if(lastSpokenText)speak(lastSpokenText);else speak('Пока нечего повторять.')};
moodBtn.onclick=function(){
  initAudio();playClick();
  var moods=[null,'happy','sad','angry','surprised'];
  var names=['обычное','весёлое','грустное','злое','удивлённое'];
  var idx=moods.indexOf(moodBtn.dataset.mood||null);
  var next=(idx+1)%moods.length;
  moodBtn.dataset.mood=moods[next]||'';
  setMood(moods[next]);
  moodBtn.textContent=['😐','😊','😢','😠','😲'][next];
  speak('Теперь '+names[next]+' лицо.');
};
chatSend.onclick=function(){
  var t=chatField.value.trim();
  if(!t)return;
  initAudio();playClick();
  chatField.value='';
  stopSpeak();
  processUserText(t);
};
chatField.onkeydown=function(e){if(e.key==='Enter')chatSend.click()};

document.querySelectorAll('.qbtn').forEach(function(btn){
  btn.onclick=function(){
    initAudio();playClick();
    stopSpeak();
    processUserText(btn.dataset.say);
  };
});

helpBtn.onclick=function(){initAudio();playClick();helpPanel.classList.add('show')};
helpClose.onclick=function(){initAudio();playClick();helpPanel.classList.remove('show')};
histBtn.onclick=function(){initAudio();playClick();renderHistory();histPanel.classList.add('show')};
histClose.onclick=function(){initAudio();playClick();histPanel.classList.remove('show')};
clearHist.onclick=function(){
  initAudio();playClick();
  if(confirm('Очистить всю историю?')){HISTORY=[];saveHistory();renderHistory()}
};

function renderHistory(){
  historyList.innerHTML='';
  if(HISTORY.length===0){historyList.innerHTML='<p style="color:rgba(255,255,255,0.5);font-size:13px">История пуста.</p>';return}
  HISTORY.slice(-30).reverse().forEach(function(item){
    var el=document.createElement('div');
    el.className='hist-item';
    var d=new Date(item.time);
    var ts=d.getDate()+'.'+(d.getMonth()+1)+' '+d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
    var who=item.role==='user'?'👤 Ты: ':'🌊 Wave: ';
    el.innerHTML='<div class="date">'+ts+'</div><div class="preview">'+who+escapeHtml(item.text)+'</div>';
    historyList.appendChild(el);
  });
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

/* МОРГАНИЕ */
function blink(){
  face.classList.add('blink');
  setTimeout(function(){face.classList.remove('blink')},120);
  setTimeout(blink,2500+Math.random()*3500);
}
setTimeout(blink,2000);

/* ПРИВЕТСТВИЕ */
function startGreeting(){
  face.classList.add('waving');
  setTimeout(function(){face.classList.remove('waving')},2500);
  var g;
  if(DEVICE_DATA.visits>1)g='С возвращением! Ты заходил уже '+DEVICE_DATA.visits+' раз.';
  else g='Привет! Я Wave AI. Буду с тобой сегодня разговаривать.';
  speak(g);
}

document.body.addEventListener('touchstart',function(){initAudio()},{once:true});
document.body.addEventListener('click',function(){initAudio()},{once:true});