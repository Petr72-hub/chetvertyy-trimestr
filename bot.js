/* Offline topic assistant. No model, telemetry, credentials or network calls. */
(function (root) {
  'use strict';
  const normalize = value => String(value).toLowerCase().replace(/ё/g, 'е').trim();
  const rules = [
    ['breast', /бол.{0,20}(груд|сос)|трещин|корм.{0,10}боль/],
    ['bath', /купа|ванн/], ['wash', /подмы|гигиен|смен.{0,12}подгуз/],
    ['nappy', /стул|кака|кал(?:\s|$)|запор|моч|писа|подгуз|понос/],
    ['sleep', /сон|спит|спать|засып|просып|уклад|подушк/],
    ['cry', /плач|кричит|колик|успокоить малыша/],
    ['solids', /прикорм|пюре|каша|ложк/],
    ['latch', /корм|молок|смес|груд/], ['vaccine', /привив|вакцин/],
    ['urgent', /температур|сыпь|аллерг|лихорад|забол|срочн/],
    ['body', /восстанов|после род|кесар|швы|тел/],
    ['beauty', /космет|волос|бьюти|уход за собой/],
    ['mind', /устал|устаю|нет сил|сил нет|тяжело|тревог|тревож|груст|одинок|страш|раздраж|не справля|не могу больше/],
    ['pause', /помощ|поддерж/], ['community', /подруг|мамюнити|познаком|общаться|мэтч|метч/]
  ];
  const sources = {
    sleep:'https://www.nhs.uk/baby/caring-for-a-newborn/sudden-infant-death-syndrome-sids/',
    cry:'https://www.nhs.uk/baby/caring-for-a-newborn/soothing-a-crying-baby/',
    urgent:'https://www.nhs.uk/baby/health/when-to-get-urgent-medical-help-for-babies-and-children-under-5/'
  };
  function createSession() { return { age:null, topic:null, awaitingAge:false, temperature:null }; }
  function ageFrom(text, bare) {
    const words={один:1,одна:1,два:2,две:2,три:3,четыре:4,пять:5,шесть:6,семь:7,восемь:8,девять:9,десять:10,одиннадцать:11,двенадцать:12};
    const t=text.replace(/(одиннадцать|двенадцать|четыре|восемь|девять|десять|один|одна|два|две|три|пять|шесть|семь)(?=\s+(?:месяц|мес|недел|год|лет))/g,w=>words[w]);
    if (/полгода/.test(t)) return 6;
    if (/новорожден/.test(t)) return 0;
    const m=t.match(/(\d+(?:[.,]\d+)?)\s*(месяц|мес|недел|год|лет)/);
    const value=m?Number(m[1].replace(',','.'))*(/год|лет/.test(m[2])?12:/недел/.test(m[2])?1/4.35:1):bare&&/^\d{1,2}$/.test(t)?Number(t):null;
    return value!==null&&value>=0&&value<=72?value:null;
  }
  function reply(input, session, articles, profile, isRisk) {
    const t=normalize(input);
    const out=(text,extra={})=>({text,quickReplies:[],...extra});
    if(isRisk(input)) return out('Сейчас важнее всего безопасность и живая поддержка. Ниже — шаги, которые можно сделать прямо сейчас. Психолог к этому сайту пока не подключён.',{crisis:true});
    if(/не дыш|задыха|трудно дыш|тяжело дыш|синеют губ|посинел|судорог|без сознани|не могу разбуд|сильн.{0,15}кровотеч/.test(t)) return out('Это может быть неотложной ситуацией. Не ждите ответа в чате: вызовите экстренную помощь — 112 в России и ЕС, либо местный экстренный номер. Сообщите адрес, возраст и симптомы; следуйте указаниям диспетчера.',{urgent:true,sourceUrl:sources.urgent,articleId:'urgent'});
    const own=/у меня|моя температура|мне \d/.test(t);
    const age=own?null:ageFrom(t,session.awaitingAge);
    const pending=session.awaitingAge;
    if(age!==null){ session.age=age; session.awaitingAge=false; }
    let topic=rules.find(([,re])=>re.test(t))?.[0];
    const follow=/^(а |и |как часто|почему|подробнее|что еще|дальше|да[.!]?$)/.test(t);
    if(!topic&&(age!==null||follow)) topic=session.topic;
    const temperature=t.match(/(?:температур\S*\s*|жар\s*)(\d{2}(?:[.,]\d)?)/);
    if(temperature&&!own){session.temperature=Number(temperature[1].replace(',','.'));topic='urgent';}
    if(topic==='urgent'&&session.temperature!==null&&(temperature||(pending&&age!==null))){
      const temp=session.temperature;
      if(session.age===null){session.awaitingAge=true;session.topic='urgent';return out('Сколько малышу месяцев? Если ему меньше 3 месяцев и температура 38 °C или выше — нужна срочная медицинская помощь. При затруднённом дыхании, судорогах или если ребёнка трудно разбудить, вызывайте экстренную помощь сразу.',{quickReplies:['1 месяц','3 месяца','6 месяцев'],sourceUrl:sources.urgent});}
      if((session.age<3&&temp>=38)||(session.age>=3&&session.age<=6&&temp>=39)||temp<36) return out('С учётом возраста и указанной температуры малышу нужна срочная медицинская оценка. Обратитесь за неотложной помощью сейчас. Если трудно дышать, синеют губы или ребёнка трудно разбудить — вызывайте экстренную помощь.',{urgent:true,articleId:'urgent',sourceUrl:sources.urgent});
    }
    if(/дозиров|дозу|сколько.{0,15}(дать|мг|мл)|како.{0,12}(лекарств|таблет)|антибиот/.test(t)) return out('Я не подбираю препараты и дозировки. Для этого нужны врач, возраст, вес ребёнка и точное название с концентрацией препарата. Могу помочь составить список вопросов врачу.',{quickReplies:['Когда нужна срочная помощь?']});
    if(/^(привет|здравствуй|здравствуйте|добрый день)[! .]*$/.test(t))return out(`Добрый день, ${profile.name||'мама'}! Давайте разберём один вопрос за раз. Могу помочь с уходом, сном, кормлением или поддержать вас. Что сейчас важнее?`,{quickReplies:['Малыш плохо спит','Как купать малыша?','Я устала']});
    if(/кто ты|что.*умеешь|ты бот|ты ии/.test(t))return out('Я локальный помощник по готовым материалам. Понимаю основные темы, запоминаю возраст в этом разговоре и отвечаю на уточнения. Нейросеть и специалисты пока не подключены.',{quickReplies:['Как подмывать малыша?','Как попросить о помощи?']});
    if(/спасибо|благодар/.test(t))return out('Пожалуйста. Можно двигаться маленькими шагами. Если появился ещё вопрос — я рядом.',{quickReplies:['Что почитать о кормлении?','Как найти подруг?']});
    if(topic==='community'){session.topic=topic;return out('Откройте «Мамюнити» → «Знакомства». Интересы берутся из вашего профиля. В этой локальной версии анкеты и мэтчи демонстрационные; сообщения видны только в вашей вкладке.',{quickReplies:['Как попросить о помощи?']});}
    if(!topic)return out('Не смог уверенно определить тему. Напишите, пожалуйста, что именно происходит и о ком вопрос — о вас или о малыше. Я лучше понимаю вопросы об уходе, сне, кормлении и усталости.',{quickReplies:['Малыш плачет','Малыш плохо спит','Я устала']});
    session.topic=topic;
    if(['sleep','cry','solids','latch'].includes(topic)&&session.age===null){session.awaitingAge=true;return out('Сколько сейчас малышу месяцев? Напишите, например, «2 месяца» или «6 недель» — так я смогу продолжить с учётом возраста.',{quickReplies:['1 месяц','3 месяца','6 месяцев']});}
    if(topic==='sleep')return out('Для сна укладывайте малыша на спину, на ровный твёрдый матрас в отдельной кроватке. Уберите подушки и мягкие игрушки. Первые полгода кроватку лучше держать в вашей комнате.\n\nПопробуйте короткий спокойный ритуал: приглушённый свет, переодевание, тихая песенка. Не нужно добиваться идеального расписания.',{articleId:'sleep',sourceUrl:sources.sleep,quickReplies:['А если малыш плачет?','Как попросить о помощи?']});
    if(topic==='cry')return out('Проверьте простое: не голоден ли малыш, сухой ли подгузник, не жарко ли ему. Можно взять его на руки, спокойно поговорить и уменьшить шум.\n\nЕсли чувствуете, что теряете контроль, положите ребёнка в безопасную кроватку и позовите близкого взрослого. Никогда не трясите малыша. Необычный непрерывный плач или признаки болезни — повод обратиться за медицинской помощью.',{sourceUrl:sources.cry,articleId:'urgent',quickReplies:['Как попросить о помощи?','Малыш плохо спит']});
    const a=articles.find(a=>a.id===topic);
    if(!a)return out('Давайте уточним вопрос. Что беспокоит больше всего?',{quickReplies:['Малыш плохо спит','Я устала']});
    if(topic==='bath'&&/часто|каждый день|ежеднев/.test(t))return out(a.takeaway+'\n\nВо время купания всегда оставайтесь рядом и поддерживайте малыша.',{articleId:a.id,quickReplies:['А что подготовить?']});
    if(topic==='solids'&&session.age<6)return out('Обычно знакомство с прикормом начинается примерно в 6 месяцев, когда появляются признаки готовности. Сейчас не нужно торопиться. Если ребёнок родился раньше срока или есть вопросы о питании, обсудите сроки с педиатром.',{articleId:'solids',quickReplies:['Какие признаки готовности?']});
    const prefix=topic==='mind'?'Похоже, сейчас вам непросто. Вы заслуживаете поддержки.\n\n':'';
    return out(prefix+a.steps.map((step,i)=>`${i+1}. ${step}`).join('\n\n')+'\n\n'+a.takeaway,{articleId:a.id,quickReplies:topic==='bath'?['А как часто?']:topic==='mind'?['Как попросить о помощи?']:['Подробнее','Когда нужна срочная помощь?']});
  }
  root.TrimesterBot={createSession,ageFrom,reply};
  if(typeof module!=='undefined')module.exports=root.TrimesterBot;
})(globalThis);
