export function randomInt(max, cryptoApi = globalThis.crypto) {
 if (!Number.isInteger(max) || max < 1 || max > 4294967296) throw new RangeError('Invalid bound');
 const limit = Math.floor(4294967296 / max) * max; let n;
 do { n = cryptoApi.getRandomValues(new Uint32Array(1))[0]; } while(n >= limit);
 return n % max;
}
export function shuffle(cards) { const a = cards.map(c=>({...c,reversed:randomInt(2)===1})); for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];} return a; }
export function localDay(d=new Date()) {return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function interpret(c,context='general') {
 const core = c.reversed ? c.reverse : c.upright;
 const lens = {love:c.love,work:c.work,advice:c.advice,challenge:`Проверьте, не становится ли тема «${c.theme}» источником напряжения. ${c.advice}`,resource:`Опорой может стать осознанная работа с темой «${c.theme}». ${c.advice}`,past:`Посмотрите, как прежний опыт, связанный с темой «${c.theme}», влияет на восприятие настоящего.`,future:`Если прежний подход сохранится, тема «${c.theme}» может оставаться важной. Это повод выбрать действие, а не ждать предсказанного события.`,general:c.advice};
 return `${core} ${lens[context]||lens.general}`;
}
export function synthesize(cards, spread){
 const first=cards[0], last=cards.at(-1), reversed=cards.filter(c=>c.reversed).length;
 const groups=Object.entries(cards.reduce((a,c)=>(a[c.suit]=(a[c.suit]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
 const focus={major:'Рассмотрите общий смысл ситуации и ценности, на которые опираетесь.',wands:'Обратите внимание на инициативу, темп и расход сил.',cups:'В центре внимания — переживания, близость и качество контакта.',swords:'Полезнее всего проверить факты, формулировки и границы.',pentacles:'Опора находится в повседневных действиях, времени и доступных ресурсах.'};
 let text = cards.length===1 ? `Тема карты — ${first.theme}. ${first.advice}` : `Расклад движется от темы «${first.theme}» в позиции «${spread.positions[0]}» к теме «${last.theme}» в позиции «${spread.positions.at(-1)}». ${focus[groups[0][0]]} ${reversed>cards.length/2?'Большинство карт перевёрнуты: проверьте задержки, внутренние противоречия и посильность выбранного темпа.':'Соедините символы с одним конкретным действием в реальной ситуации.'} ${last.advice}`;
 if(spread.id==='yes-no') {const score=cards.reduce((n,c)=>n+(c.reversed?-c.score:c.score),0);text=`Символический ответ: ${score>0?'скорее да':score<0?'скорее нет':'пока неясно'}. Это правило чтения карт, а не оценка вероятности. ${text}`;}
 if(spread.id==='choice') text=`Путь А: ${cards[0].reversed?cards[0].reverse:cards[0].upright} Ограничение: ${cards[1].reversed?cards[1].reverse:cards[1].upright} Путь Б: ${cards[2].reversed?cards[2].reverse:cards[2].upright} Ограничение: ${cards[3].reversed?cards[3].reverse:cards[3].upright} Критерий сравнения: ${cards[4].advice} Выбирайте по фактам и собственным ценностям, а не по количеству «хороших» карт.`;
 return text;
}
