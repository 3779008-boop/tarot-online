export function randomInt(max, cryptoApi = globalThis.crypto) {
 if (!Number.isInteger(max) || max < 1 || max > 4294967296) throw new RangeError('Invalid bound');
 const limit = Math.floor(4294967296 / max) * max; let n;
 do { n = cryptoApi.getRandomValues(new Uint32Array(1))[0]; } while(n >= limit);
 return n % max;
}
export function shuffle(cards) { const a = cards.map(c=>({...c,reversed:randomInt(2)===1})); for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];} return a; }
export function localDay(d=new Date()) {return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function restoreDaily(raw,cards,day=localDay()) {try {const s=JSON.parse(raw);const c=cards.find(c=>c.id===s?.id);return c&&s.day===day&&typeof s.reversed==='boolean'?{...c,reversed:s.reversed}:null;}catch{return null}}
export const meaning = c => c.meanings[c.reversed?'reversed':'upright'];
const has=(c,...tags)=>tags.some(t=>meaning(c).tags.includes(t));
const label=c=>`${c.name}${c.reversed?' (перевёрнутая)':''}`;
const challenge=(c,topic)=>meaning(c)[topic==='love'?'loveChallenge':'challenge'];
const fragment=s=>firstSentence(s).replace(/[.!?]$/,'');
const firstSentence=s=>s.match(/[^.!?]+[.!?]/)?.[0]?.trim()||s;
const isLove=s=>['feelings','thinking','together','relationship'].includes(s.id);
const topicFor=(s,topic)=>isLove(s)?'love':['general','love','work'].includes(topic)?topic:'general';
export function adviceFor(c,topic='general') {
 const m=meaning(c);
 // Each upright topic originally had its own practical advice. Reversed advice is separately authored.
 return c.reversed?m.advice:topic==='love'?c.love:topic==='work'?c.work:m.advice;
}
export function interpret(c,context='general') {
 const m=meaning(c);
 if(context==='advice')return adviceFor(c);
 if(context==='resource')return `Опора этой карты — возможность изменить подход. ${m.advice}`;
 if(context==='challenge')return m.challenge;
 if(context==='past')return `Прежний опыт: ${m.general}`;
 if(context==='future')return `Если условия сохранятся: ${m.general}`;
 return m[context]||m.general;
}
function positionReading(c,s,i,topic) {
 const role=s.roles[i],m=meaning(c),base=m[topic];
 const intros={past:'Этот опыт мог сформировать нынешний подход.',present:'Так читается нынешнее состояние ситуации.',future:'Такой сценарий возможен при сохранении текущих условий.',feelings:'В этой позиции карта описывает эмоциональную сторону связи.',thoughts:'В этой позиции карта задаёт тему возможных мыслей о контакте.',partner:'Так можно прочитать участие другой стороны в нынешней динамике.',self:'В этой позиции речь о вашем участии и состоянии.',action:'Здесь важно, как намерение может проявиться в поступках.',outcome:'Эта позиция показывает направление развития связи.',bond:'Это качество определяет то, на чём держится взаимодействие.'};
 if(role==='challenge') return challenge(c,topic);
 if(role==='advice')return `Эта карта определяет подход к следующему шагу. ${base}`;
 if(role==='resource')return `${firstSentence(base)} Использовать эту сторону карты можно так: ${adviceFor(c,topic)}`;
 if(role==='criterion')return `Эта позиция уточняет, что важнее оценить перед решением. ${base}`;
 if(role==='phase')return base;
 if(role==='thoughts')return `${intros[role]} ${has(c,'past')?'Карта обращает к знакомому опыту и воспоминаниям о связи.':has(c,'clear','interest')?'Внимание может быть связано с интересом разобраться в контакте, а не обязательно с романтическим намерением.':has(c,'distance','pause')?'Дистанция и пауза не позволяют сделать вывод об активной вовлечённости.':base}`;
 return `${intros[role]||''} ${base}`.trim();
}
export function priority(c) { return meaning(c).priority; }
// Pair rules are semantic, orientation-aware, and restricted to the roles they can support.
export function interactions(cards,s,topic) {
 const out=[]; const active=cards.map((c,i)=>({c,i})).filter(x=>!['advice','criterion','challenge'].includes(s.roles[x.i]));
 const push=(a,b,text)=>out.push({ids:[a.c.id,b.c.id],positions:[a.i,b.i],text:`${label(a.c)} («${s.positions[a.i]}») и ${label(b.c)} («${s.positions[b.i]}»): ${text}`});
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
  const a=active[i],b=active[j],ids=[a.c.id,b.c.id],bothUp=!a.c.reversed&&!b.c.reversed;
  if(bothUp&&ids.includes('lovers')&&ids.includes('devil'))push(a,b,'притяжение выражено, но свобода согласия и зависимость вступают в противоречие. Сильное желание здесь не равнозначно подходящим условиям союза.');
  else if(bothUp&&ids.includes('sun')&&ids.includes('moon'))push(a,b,'открытые проявления соседствуют с неясностью. Хорошее впечатление не устраняет вопросы, на которые пока нет подтверждённого ответа.');
  else if(bothUp&&ids.includes('queen-cups')&&ids.includes('king-pentacles'))push(a,b,'эмоциональная чуткость сочетается с практической ответственностью. Тепло получает опору в последовательных действиях, если эти качества действительно проявляются с обеих сторон.');
  else if(bothUp&&ids.includes('tower')&&ids.includes('star'))push(a,b,'пересмотр прежней опоры сочетается с возможностью восстановления. Надежда относится к новому способу продолжать, а не к отмене произошедшей перемены.');
  else if((has(a.c,'ending')&&has(b.c,'recovery'))||(has(b.c,'ending')&&has(a.c,'recovery')))push(a,b,'завершение старого сценария сочетается с восстановлением. Улучшение предполагает изменение условий, а не автоматическое возвращение к прежнему.');
  else if(topic==='love'&&((has(a.c,'warmth','interest')&&has(b.c,'distance','block'))||(has(b.c,'warmth','interest')&&has(a.c,'distance','block'))))push(a,b,'интерес или тепло сталкивается с дистанцией. Эмоциональный отклик и готовность поддерживать связь здесь нельзя считать одним и тем же.');
  else if((has(a.c,'motion','initiative')&&has(b.c,'pause'))||(has(b.c,'motion','initiative')&&has(a.c,'pause')))push(a,b,'импульс к действию встречает задержку. Продвижение зависит от того, будет ли устранена причина паузы, а не от силы желания ускориться.');
  else if(has(a.c,'steady')&&has(b.c,'steady'))push(a,b,'две позиции поддерживают последовательность. Продвижение лучше читается через повторяемое участие, чем через единичный яркий жест.');
  else if((has(a.c,'unclear')&&has(b.c,'clear'))||(has(b.c,'unclear')&&has(a.c,'clear')))push(a,b,'неопределённость и стремление к ясности присутствуют одновременно. Вывод зависит от уточнения условий, а не от выбора более приятного объяснения.');
 }
 // Obstacle is never counted as an extra positive vote, even when it is the Sun or Two of Cups.
 const barrier=s.roles.indexOf('challenge');
 if(barrier>=0&&cards.length>1){const a=cards[0],b=cards[barrier];out.unshift({ids:[a.id,b.id],positions:[0,barrier],text:`${label(a)} задаёт исходную картину, а ${label(b)} в позиции «${s.positions[barrier]}» ограничивает её: ${challenge(b,topic)}`});}
 return out.filter((v,i,a)=>a.findIndex(x=>x.text.split(': ').slice(1).join(': ')===v.text.split(': ').slice(1).join(': '))===i).slice(0,2);
}
function yesNo(cards,topic) {
 const [a,b,c]=cards,ma=meaning(a);let verdict;
 const severe=has(b,'block','ending')||meaning(b).direction==='no';
 const difficultAction=meaning(c).direction==='no'&&!has(c,'recovery');
 if(ma.direction==='yes'&&!severe&&!difficultAction)verdict='Скорее да';
 else if(ma.direction==='no'&&!has(c,'recovery'))verdict='Скорее нет';
 else verdict='Однозначного ответа нет';
 const tone=verdict==='Скорее да'?'Карты поддерживают желаемое развитие при соблюдении условия':verdict==='Скорее нет'?'Прежний способ продолжать ситуацию встречает серьёзное ограничение':'Поддержка и ограничения пока не складываются в уверенное направление';
 return {verdict,answer:`${verdict}. ${tone}: ${fragment(challenge(b,topic)).toLocaleLowerCase('ru')}.`};
}
function connectionAnswer(cards,s) {
 const primary=cards[s.id==='relationship'?2:0],lastOutcome=cards[s.id==='together'?3:s.id==='thinking'?2:0];
 const p=meaning(primary);const barrier=cards[s.roles.indexOf('challenge')];
 const blocked=barrier&&(has(barrier,'block','ending')||meaning(barrier).direction==='no');
 let lead;
 if(s.id==='thinking')lead=has(primary,'past')?'По этому раскладу тема контакта связана прежде всего с воспоминаниями.':has(primary,'interest','clear')?'По этому раскладу можно предположить внимание к контакту, но нельзя приравнять его к романтическому намерению.':'По этому раскладу однозначно говорить об активной мысленной вовлечённости нельзя.';
 else if(s.id==='together')lead=has(lastOutcome,'control')&&has(lastOutcome,'interest')?'По этому раскладу связь может удерживаться сильным влечением, но её условия требуют пересмотра.':has(lastOutcome,'ending','block','distance')?'По этому раскладу сохранение прежнего подхода скорее увеличивает дистанцию.':has(lastOutcome,'steady','warmth','commitment')&&!blocked?'По этому раскладу есть основа для сближения, если участие будет взаимным.':'По этому раскладу перспектива пары остаётся условной: намерениям ещё нужна опора в согласованных действиях.';
 else lead=has(primary,'control')&&has(primary,'interest')?'По этому раскладу влечение заметно, но оно связано с зависимостью или неравными условиями.':has(primary,'ending','distance','block')?'По этому раскладу дистанция выражена сильнее готовности к сближению.':has(primary,'unclear')?'По этому раскладу чувства и намерения остаются неоднозначными.':has(primary,'warmth')?'По этому раскладу есть эмоциональное тепло, но готовность строить отношения нужно рассматривать отдельно.':has(primary,'interest')?'По этому раскладу заметен интерес, который пока нельзя приравнять к устойчивой близости.':'По этому раскладу связь определяется условиями взаимодействия сильнее, чем открытым проявлением чувств.';
 if(blocked&&!lead.includes('дистанц'))lead+=' Существенное препятствие ограничивает развитие даже при наличии интереса.';
 return `${lead} ${label(primary)}: ${firstSentence(p.love)}`;
}
export function readSpread(cards,s,requestedTopic='general') {
 if(cards.length!==s.positions.length||!cards.every(c=>c.meanings))throw new Error('Incomplete reading');
 const topic=topicFor(s,requestedTopic),notes=cards.map((c,i)=>({id:c.id,name:label(c),position:s.positions[i],text:positionReading(c,s,i,topic)}));
 const pairs=interactions(cards,s,topic);const barrier=s.roles.indexOf('challenge');const adviceIndex=s.roles.lastIndexOf('advice');
 let answer,verdict=null,details=[],attention=barrier>=0?challenge(cards[barrier],topic):challenge(cards[0],topic);
 let advice=adviceFor(cards[adviceIndex>=0?adviceIndex:cards.length-1],topic);
 if(cards.length>1&&adviceIndex>=0)attention=challenge(cards[adviceIndex],topic);
 if(cards.length===1){const m=meaning(cards[0]);return {answer:s.id==='advice'?advice:m.general,details:[],notes:[],attention:challenge(cards[0],topic),advice,day:s.id==='day'?{love:m.love,work:m.work,mood:m.mood}:null,topic,verdict,pairs:[]};}
 if(s.id==='yes-no'){
  ({answer,verdict}=yesNo(cards,topic));
  const [a,b,c]=cards;
  const lead=meaning(a).direction==='yes'?(verdict==='Скорее да'?'благоприятное начало получает продолжение через последовательное действие':'благоприятное начало не устраняет существенного затруднения'):meaning(a).direction==='no'?'прежние условия ограничивают результат, поэтому простой повтор усилия не решает проблему':'исходная ситуация ещё допускает разные направления, и последующие карты уточняют условия';
  details=[`${label(a)} и ${label(b)}: ${lead}.`,`${label(c)} в позиции совета смещает внимание на ${priority(c,topic)}. ${c.id==='five-pentacles'?'Поддержку полезно искать вне прежнего замкнутого круга.':has(c,'pause','distance')?'Это требует времени на решение, а не немедленного результата.':has(c,'clear')?'Продвижение зависит от уточнения условий и прямого обсуждения.':has(c,'overload')?'Без уменьшения нагрузки даже подходящее решение будет трудно поддерживать.':has(c,'control','block')?'Действовать через давление или повтор старой схемы здесь не поможет.':'Вывод стоит связывать с последовательным участием, которое можно заметить в реальной ситуации.'}`];
 }else if(isLove(s)){
  answer=connectionAnswer(cards,s);
  details=pairs.map(x=>x.text);
  if(s.id==='thinking')details.push(`Готовность к реальному контакту читается отдельно: ${label(cards[2])}. ${meaning(cards[2]).love}`);
  if(s.id==='together')details.push(`Опора для сближения — ${label(cards[2])}. ${meaning(cards[2]).love} Направление при сохранении условий — ${label(cards[3])}. ${meaning(cards[3]).love}`);
  if(s.id==='relationship')details.push(`Ваше участие (${label(cards[0])}) и участие другой стороны (${label(cards[1])}) различаются: ${firstSentence(meaning(cards[0]).love)} ${firstSentence(meaning(cards[1]).love)}`);
 }else if(['week','month'].includes(s.id)){
  const n=cards.length-1,anchor=cards.at(-1);
  answer=`${s.id==='week'?'На неделю':'На месяц'} основной акцент — ${priority(anchor,topic)}. В начале: ${firstSentence(meaning(cards[0])[topic])} К завершению: ${firstSentence(meaning(cards[n-1])[topic])}`;
  details=[`Общая опора — ${label(anchor)}. ${meaning(anchor)[topic]}`,...pairs.filter(p=>p.positions.every(i=>i<n)).slice(0,1).map(x=>x.text)];
  attention=meaning(cards.slice(0,n).find(c=>has(c,'block','overload','unclear'))||cards[n-1]).challenge;
 }else if(s.id==='choice'){
  const [a,ac,b,bc,criterion]=cards;
  const pa=priority(a,topic),pb=priority(b,topic);answer=[['А',a,pa],['Б',b,pb]].map(([name,c,p])=>has(c,'block','ending','overload')||meaning(c).direction==='no'?`Вариант ${name} требует пересмотра условий: ${fragment(meaning(c)[topic]).toLocaleLowerCase('ru')}.`:`Вариант ${name} стоит рассмотреть, если важнее ${p}.`).join(' ')+` Критерий сравнения — ${priority(criterion,topic)}.`;
  details=[`Путь А соединяет ${label(a)} и ${label(ac)}. Здесь нужно сопоставить два требования: ${priority(a)} и ${priority(ac)}. Увлечение первым не снимает необходимости учитывать второе.`,`Путь Б соединяет ${label(b)} и ${label(bc)}. Здесь важны ${priority(b)} и ${priority(bc)}. Сравните, какие из этих условий вы действительно можете обеспечить.`];
  attention=`Пятая карта (${label(criterion)}) добавляет важное ограничение: ${fragment(challenge(criterion,topic)).toLocaleLowerCase('ru')}.`;advice=adviceFor(criterion,topic);
 }else if(s.id==='past-present-future'){
  answer=`В прошлом: ${firstSentence(meaning(cards[0])[topic])} Сейчас: ${firstSentence(meaning(cards[1])[topic])} Если ничего не менять: ${firstSentence(meaning(cards[2])[topic])}`;
  details=pairs.map(x=>x.text);attention=challenge(cards[1],topic);advice=adviceFor(cards[1],topic);
 }else if(s.id==='reasons'){
  answer=`Возможная внутренняя причина — ${label(cards[1])}: ${firstSentence(challenge(cards[1],topic))} Внешнее ограничение — ${label(cards[2])}: ${firstSentence(challenge(cards[2],topic))} Опора для выхода — ${label(cards[3])}: ${firstSentence(meaning(cards[3])[topic])}`;
  details=[`Проблема выглядит так: ${meaning(cards[0])[topic]}`,`Ресурс и первый шаг связаны: ${label(cards[3])} — ${firstSentence(meaning(cards[3])[topic])} ${label(cards[4])} — ${advice}`];
  attention=challenge(cards[2],topic);
 }else if(s.id==='hidden'){
  answer=`Вы можете не учитывать следующее: ${challenge(cards[1],topic)} Это уточняет видимую сторону ситуации (${label(cards[0])}), но не доказывает чьих-либо скрытых намерений.`;
  details=[`На виду: ${meaning(cards[0])[topic]}`,`Проверка предположения (${label(cards[2])}): ${advice}`];
 }
 if(!details.length)details=pairs.map(x=>x.text);
 if(!details.length)details=[`В позиции «${s.positions[0]}» карта ${label(cards[0])} указывает: ${fragment(meaning(cards[0])[topic]).toLocaleLowerCase('ru')}; в позиции «${s.positions.at(-1)}» карта ${label(cards.at(-1))} добавляет: ${fragment(meaning(cards.at(-1))[topic]).toLocaleLowerCase('ru')}.`];
 return {answer,details,notes,attention,advice,day:null,topic,verdict,pairs};
}
export function synthesize(cards,spread,topic='general'){return readSpread(cards,spread,topic).answer;}
