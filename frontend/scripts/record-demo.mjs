import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../videos/forma-demo');
const raw = path.join(root,'assets/raw');
await mkdir(raw,{recursive:true}); await mkdir(path.join(root,'assets/footage'),{recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const manifest=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function record(name,route,duration,fn){
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:raw,size:{width:1440,height:900}}});
 const page=await context.newPage();const started=Date.now();
 await page.goto('http://127.0.0.1:5173/#'+route); await page.waitForLoadState('networkidle');
 await page.evaluate(async()=>{await document.fonts.ready; const c=document.createElement('div');c.id='demo-pointer';c.innerHTML='<svg width="32" height="38" viewBox="0 0 32 38"><path d="M3 2L26 21L16 23L12 34Z" fill="#292337" stroke="white" stroke-width="2"/></svg>';Object.assign(c.style,{position:'fixed',left:'1260px',top:'750px',zIndex:99999,pointerEvents:'none',filter:'drop-shadow(0 2px 3px #0005)'});document.body.append(c);document.addEventListener('mousemove',e=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px'});document.addEventListener('mousedown',()=>{c.animate([{filter:'drop-shadow(0 0 0 #7860ca)'},{filter:'drop-shadow(0 0 16px #7860ca)'},{filter:'drop-shadow(0 0 0 #7860ca)'}],{duration:450})})});
 await wait(500);const trim=(Date.now()-started)/1000;const actionStart=Date.now();
 const click=async locator=>{const b=await locator.boundingBox();if(!b)throw Error('No bounds');await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:30});await wait(250);await locator.click();};
 await fn(page,click); await wait(Math.max(1000,duration*1000-(Date.now()-actionStart)+500));
 const video=await page.video().path();await context.close();
 const out=path.join(root,'assets/footage',name+'.mp4');
 const ff=spawnSync('ffmpeg',['-y','-ss',String(trim),'-i',video,'-t',String(duration),'-an','-r','30','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p',out],{encoding:'utf8'});if(ff.status!==0)throw Error(ff.stderr);
 manifest.push({name,route,duration,raw:video,trim,output:out});console.log('Recorded '+name);
}
try{
 await record('dashboard','dashboard',8,async(p,click)=>{await wait(900);await click(p.getByLabel('Период аналитики'));await p.getByLabel('Период аналитики').selectOption('14');await wait(2100);await p.mouse.move(1000,570,{steps:40});await wait(1500);});
 await record('knowledge','knowledge',12,async(p,click)=>{await wait(600);await click(p.getByRole('button',{name:'Добавить вопрос и ответ',exact:false}));await click(p.getByLabel('Название источника'));await p.getByLabel('Название источника').pressSequentially('Сборка мебели',{delay:65});await click(p.getByLabel('Ответ или текст материала'));await p.getByLabel('Ответ или текст материала').pressSequentially('Сборка мебели стоит от 1 700 рублей. Мастер приедет в удобный день.',{delay:35});await wait(400);await click(p.getByRole('button',{name:'Добавить источник',exact:true}));await p.getByText('Сборка мебели',{exact:true}).waitFor();});
 await record('chat','playground',18,async(p,click)=>{await wait(600);await click(p.getByLabel('Сообщение ассистенту'));await p.getByLabel('Сообщение ассистенту').pressSequentially('Сколько стоит доставка?',{delay:80});await click(p.getByRole('button',{name:'Отправить сообщение'}));await p.locator('.telegram-messages').getByText(/Москва от 500 рублей/).waitFor();await wait(3700);await click(p.getByLabel('Сообщение ассистенту'));await p.getByLabel('Сообщение ассистенту').pressSequentially('Хочу оформить заказ',{delay:80});await click(p.getByRole('button',{name:'Отправить сообщение'}));await p.locator('.lead-confirmation').waitFor();await p.mouse.move(1300,820,{steps:35});});
 await record('history','conversations',9,async(p,click)=>{await wait(900);await click(p.locator('.conversation-item').first());await wait(2600);const resolve=p.getByRole('button',{name:'Решено',exact:true});if(await resolve.count())await click(resolve);await p.mouse.move(1250,740,{steps:40});});
}finally{await browser.close();await writeFile(path.join(root,'recording-manifest.json'),JSON.stringify(manifest,null,2));}
