/* A brief, skippable first-visit curtain. The application never depends on it. */
(() => {
  if(location.hash && location.hash!=='#home')return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const curtain=document.createElement('div');
  curtain.className='arrival';
  curtain.innerHTML='<div class="arrival-veil"></div><div class="arrival-bird" aria-hidden="true"><svg viewBox="0 0 140 100"><path class="bird-wing back-wing" d="M65 52Q34 30 18 8Q58 6 81 48Z"/><path d="M27 72L52 58Q62 43 87 46Q99 28 111 44L126 48L112 54Q108 74 84 72L54 70L29 86L35 73Z"/><path class="bird-wing" d="M70 57Q41 50 30 17Q75 17 91 54Z"/><circle cx="107" cy="45" r="2" class="bird-eye"/></svg></div><button class="skip-arrival">Пропустить заставку</button>';
  document.body.append(curtain);
  document.body.classList.add('intro-active');
  let done=false;
  const finish=()=>{if(done)return;done=true;document.body.classList.remove('intro-active');curtain.remove();};
  curtain.querySelector('button').addEventListener('click',finish);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')finish();},{once:true});
  window.addEventListener('hashchange',finish,{once:true});
  setTimeout(finish,2300);
})();
