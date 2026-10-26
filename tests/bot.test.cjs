const {test}=require('node:test');
const assert=require('node:assert/strict');
const bot=require('../bot.js');
const articles=[{id:'bath',steps:['Подготовьте полотенце.'],takeaway:'Ежедневная ванна необязательна.'},{id:'mind',steps:['Расскажите близкому.'],takeaway:'Попросите о поддержке.'}];
function ask(text,s){return bot.reply(text,s,articles,{name:'Светлана'},t=>/убить/.test(t));}
test('age units and Russian words',()=>{assert.equal(bot.ageFrom('три месяца'),3);assert.equal(bot.ageFrom('2 года'),24);assert.equal(bot.ageFrom('полгода'),6);assert.equal(bot.ageFrom('6 недель'),6/4.35);assert.equal(bot.ageFrom('99 месяцев'),null);});
test('sleep asks age then continues topic',()=>{const s=bot.createSession();assert.match(ask('Малыш плохо спит',s).text,/Сколько/);const r=ask('2 месяца',s);assert.equal(s.age,2);assert.equal(r.articleId,'sleep');});
test('bath contextual follow up',()=>{const s=bot.createSession();assert.equal(ask('Как купать?',s).articleId,'bath');assert.match(ask('А как часто?',s).text,/необязательна/);});
test('fever stays pending and escalates after age',()=>{const s=bot.createSession();ask('Температура 38,5',s);assert.equal(ask('1 месяц',s).urgent,true);});
test('breathing emergency has priority over routine feeding',()=>{assert.equal(ask('После кормления тяжело дышать',bot.createSession()).urgent,true);});
test('harm risk precedes ordinary topics',()=>{assert.equal(ask('Хочу убить ребенка, он не спит',bot.createSession()).crisis,true);});
test('dose request is not treated as care advice',()=>{assert.match(ask('Сколько дать мл лекарства?',bot.createSession()).text,/не подбираю/);});
test('unknown request gets useful clarification',()=>{assert.match(ask('расскажи про космос',bot.createSession()).text,/Не смог/);});
test('bot identifies itself honestly',()=>{assert.match(ask('ты бот?',bot.createSession()).text,/Нейросеть.*не подключены/);});
