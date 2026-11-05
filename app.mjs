import {shuffle,readSpread,restoreDaily,localDay} from './engine.mjs?v=2.0.0';
const data=JSON.parse(document.querySelector('#site-data').textContent);
const $=s=>document.querySelector(s); const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch{return false}},remove(k){try{localStorage.removeItem(k)}catch{}}};
let analyticsLoaded=false;
function enableAnalytics(){if(analyticsLoaded||!data.metrikaId)return;analyticsLoaded=true;window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=Date.now();const s=document.createElement('script');s.src='https://mc.yandex.ru/metrika/tag.js';s.async=true;document.head.append(s);window.ym(data.metrikaId,'init',{clickmap:false,trackLinks:true,accurateTrackBounce:true,webvisor:false});}
function event(name){if(data.metrikaId&&storage.get('tarot-consent')==='yes'&&window.ym)window.ym(data.metrikaId,'reachGoal',name,{spread:data.spread?.id});}
if(data.metrikaId){if(storage.get('tarot-consent')==='yes')enableAnalytics();else if(!storage.get('tarot-consent'))$('#consent').hidden=false;}
$('#accept-analytics')?.addEventListener('click',()=>{storage.set('tarot-consent','yes');$('#consent').hidden=true;enableAnalytics()});
$('#reject-analytics')?.addEventListener('click',()=>{storage.set('tarot-consent','no');$('#consent').hidden=true});
$('#privacy-settings')?.addEventListener('click',()=>{$('#consent').hidden=false});
$('#clear-local')?.addEventListener('click',()=>{storage.remove('tarot-day');storage.set('tarot-consent','no');location.reload()});
if(data.spread){
 const spread=data.spread;let deck=[],selected=[],started=false,used=new Set();
 const board=$('#board'),pick=$('#deck'),status=$('#status'),results=$('#results'),start=$('#start'),reset=$('#reset');
 function drawBoard(){board.className=`spread-board ${spread.shape}`;board.innerHTML=spread.positions.map((pos,i)=>{const c=selected[i];return c?`<div class="drawn"><p>${i+1}. ${esc(pos)}</p><img src="/assets/cards/${c.id}.svg" alt="${esc(c.name)}${c.reversed?', перевёрнутая':''}" class="${c.reversed?'reversed':''}" width="220" height="360"><strong>${esc(c.name)}</strong><p>${c.reversed?'Перевёрнутое':'Прямое'} положение</p></div>`:`<div class="drawn placeholder">${i+1}. ${esc(pos)}</div>`}).join('');}
 function complete(restored=false){
  pick.hidden=true;$('#deck-hint').hidden=true;board.hidden=true;
  status.textContent=restored&&spread.id==='day'?'Ваша карта на сегодня сохранена.':'Расклад готов.';
  const reading=readSpread(selected,spread,$('#reading-topic')?.value||'general');
  const paragraphs=xs=>xs.map(x=>`<p>${esc(x)}</p>`).join('');
  results.innerHTML=`<div class="summary"><span class="eyebrow">${esc(spread.title)}</span><h2>${spread.id==='day'?'Ваша карта дня':'Ответ на ваш вопрос'}</h2><p>${esc(reading.answer)}</p></div>`;
  if(reading.day){const c=selected[0];results.innerHTML+=`<div class="daily-card"><img src="/assets/cards/${c.id}.svg" alt="${esc(c.name)}" class="${c.reversed?'reversed':''}" width="220" height="360"><div><h3>${esc(c.name)}</h3><p>${c.reversed?'Перевёрнутое':'Прямое'} положение</p><a href="/cards/${c.id}/">Все значения карты →</a></div></div>`+[['Отношения',reading.day.love],['Работа и дела',reading.day.work],['Настроение',reading.day.mood]].map(([h,t])=>`<section class="reading-section"><h3>${h}</h3><p>${esc(t)}</p></section>`).join('');}
  else if(selected.length===1){const c=selected[0];results.innerHTML+=`<article class="result-item"><img class="result-thumb ${c.reversed?'reversed':''}" src="/assets/cards/${c.id}.svg" alt="" width="220" height="360"><h3>${esc(c.name)}</h3><small>${c.reversed?'Перевёрнутое':'Прямое'} положение</small><p>${esc(c.meanings[c.reversed?'reversed':'upright'][reading.topic])}</p><a href="/cards/${c.id}/">Все значения карты →</a></article>`;}
  else {
   if(reading.details.length)results.innerHTML+=`<section class="reading-section"><h2>Подробное толкование</h2>${paragraphs(reading.details)}</section>`;
   results.innerHTML+=`<section class="reading-section"><h2>Что означает каждая карта</h2>${reading.notes.map((n,i)=>{const c=selected[i];return `<article class="result-item"><img class="result-thumb ${c.reversed?'reversed':''}" src="/assets/cards/${c.id}.svg" alt="" width="220" height="360" loading="lazy"><small>${i+1}. ${esc(n.position)}</small><h3>${esc(c.name)}</h3><span class="orientation">${c.reversed?'Перевёрнутое':'Прямое'} положение</span><p>${esc(n.text)}</p><a href="/cards/${c.id}/">Все значения карты →</a></article>`}).join('')}</section>`;
  }
  results.innerHTML+=`<section class="reading-section attention"><h2>На что обратить внимание</h2><p>${esc(reading.attention)}</p></section>`;
  if(spread.id!=='advice')results.innerHTML+=`<section class="reading-section advice"><h2>Совет по раскладу</h2><p>${esc(reading.advice)}</p></section>`;
  results.hidden=false;reset.hidden=spread.id==='day';if(!restored){event('spread_complete');results.focus({preventScroll:true});results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 }
 function begin(){deck=shuffle(data.cards);selected=[];used.clear();started=true;results.hidden=true;start.hidden=true;reset.hidden=true;pick.hidden=false;board.hidden=false;$('#deck-hint').hidden=false;drawBoard();status.textContent=`Выберите ${spread.positions.length} ${spread.positions.length===1?'карту':spread.positions.length<5?'карты':'карт'}. Выбрано: 0.`;pick.innerHTML=deck.map((_,i)=>`<button class="card-pick" aria-label="Выбрать карту ${i+1}" data-pick="${i}"><img src="/assets/cards/back.svg" alt="" width="220" height="360"></button>`).join('');event('spread_start');pick.querySelector('button')?.focus({preventScroll:true});pick.scrollIntoView({block:'nearest'});}
 pick.addEventListener('click',e=>{const btn=e.target.closest('[data-pick]');if(!btn||!started||selected.length>=spread.positions.length)return;const i=Number(btn.dataset.pick);if(used.has(i))return;used.add(i);selected.push(deck[i]);btn.disabled=true;drawBoard();status.textContent=`Выбрано ${selected.length} из ${spread.positions.length}. Далее: ${spread.positions[selected.length]||'готово'}.`;if(selected.length===spread.positions.length){if(spread.id==='day'){const saved=storage.set('tarot-day',JSON.stringify({day:localDay(),id:selected[0].id,reversed:selected[0].reversed}));if(!saved)$('#storage-notice').hidden=false;}complete();}else{const remaining=[...pick.querySelectorAll('button:not(:disabled)')];(remaining.find(x=>Number(x.dataset.pick)>i)||remaining[0])?.focus({preventScroll:true});}});
 start.addEventListener('click',begin);reset.addEventListener('click',begin);drawBoard();
 $('#reading-topic')?.addEventListener('change',()=>{if(selected.length===spread.positions.length)complete(true)});
 if(spread.id==='day'){const c=restoreDaily(storage.get('tarot-day'),data.cards);if(c){selected=[c];start.hidden=true;drawBoard();complete(true)}}
}
const search=$('#card-search'),suit=$('#suit-filter');function filterCards(){let n=0;document.querySelectorAll('[data-card]').forEach(el=>{const show=el.dataset.name.toLowerCase().replaceAll('ё','е').includes(search.value.trim().toLowerCase().replaceAll('ё','е'))&&(!suit.value||el.dataset.suit===suit.value);el.hidden=!show;if(show)n++;});$('#catalog-count').textContent=`Найдено карт: ${n}`;$('#no-cards').hidden=n>0;}search?.addEventListener('input',filterCards);suit?.addEventListener('change',filterCards);
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===btn);x.setAttribute('aria-pressed',String(x===btn))});document.querySelectorAll('[data-category]').forEach(el=>el.hidden=btn.dataset.filter!=='Все'&&el.dataset.category!==btn.dataset.filter)}));
