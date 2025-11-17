// app.js
// نسخهٔ یک‌صفحه‌ای بازی‌محور — فارسی — بدون نیاز به فایل صوتی (WebAudio استفاده می‌شود).

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

/* ========== حالت کلی ========== */
const state = {
  currentLab: 'build',
  triangle: {
    a: {x:80, y:260},
    b: {x:300, y:80},
    c: {x:520, y:260}
  },
  dragging: null,
  score: 0,
  game: {level:1, target:null, attempts:0}
};

/* ========== WebAudio ساده برای افکت ========== */
const audioCtx = typeof AudioContext !== 'undefined' ? new AudioContext() : null;
function playBeep(freq=440, duration=0.08, type='sine', gain=0.08){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + duration);
}

/* ========== راه‌اندازی اولیه ========== */
document.addEventListener('DOMContentLoaded', ()=>{
  bindNav();
  bindTutorial();
  renderLab();
  updateScore(0);
  showTutorialOnce();
});

/* ======= نَویگیشن ======= */
function bindNav(){
  $$('.lab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.lab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.currentLab = btn.dataset.lab;
      renderLab();
    });
  });
}

/* ======= مودال آموزش ======= */
function bindTutorial(){
  $('#openTutorial').addEventListener('click', ()=> $('#tutorialModal').classList.remove('hidden'));
  $('#closeTutorial').addEventListener('click', ()=> $('#tutorialModal').classList.add('hidden'));
  $('#startLab').addEventListener('click', ()=> $('#tutorialModal').classList.add('hidden'));
  $('#dontShow')?.addEventListener('change', (e)=>{
    if(e.target.checked) localStorage.setItem('dontShowTutorial','1'); else localStorage.removeItem('dontShowTutorial');
  });
}
function showTutorialOnce(){
  if(!localStorage.getItem('dontShowTutorial')) $('#tutorialModal').classList.remove('hidden');
}

/* ======= رندر کل آزمایشگاه‌ها ======= */
function renderLab(){
  const area = $('#labArea'); area.innerHTML = '';
  $('#controlsBox').innerHTML = '';
  if(state.currentLab === 'build') area.appendChild(labBuild());
  if(state.currentLab === 'similar') area.appendChild(labSimilarity());
  if(state.currentLab === 'right') area.appendChild(labRight());
  if(state.currentLab === 'draw') area.appendChild(labDraw());
  if(state.currentLab === 'game') area.appendChild(labGame());
  updateInfo('آزمایش را لمس/کلیک کنید و پارامترها را تغییر دهید.');
}

/* ======= Helpers UI ======= */
function updateInfo(txt){ const el = $('#infoBox'); if(el) el.innerText = txt; }
function updateScore(delta){ state.score = Math.max(0, state.score + delta); $('#score').innerText = state.score; }

/* ================= LAB: ساخت مثلث (درگ نقطه) ================= */
function labBuild(){
  const wrap = document.createElement('div'); wrap.className='canvas-wrap';
  const canvas = document.createElement('canvas'); canvas.id = 'canvasBuild';
  wrap.appendChild(canvas);

  const controls = document.createElement('div'); controls.className='controls';
  controls.innerHTML = `<div class="control">طول اضلاع: <span id="sideInfo">---</span></div>
                        <div><button id="resetBuild" class="btn">ریست</button></div>`;
  wrap.appendChild(controls);
  $('#controlsBox').appendChild(controls);

  setupCanvas(canvas, true, ()=> drawTriangle(canvas));
  $('#resetBuild').addEventListener('click', ()=>{
    state.triangle = {a:{x:80,y:260},b:{x:300,y:80},c:{x:520,y:260}};
    drawTriangle(canvas);
  });
  drawTriangle(canvas);
  return wrap;
}

/* ================= LAB: شباهت ================= */
function labSimilarity(){
  const wrap = document.createElement('div'); wrap.className='canvas-wrap';
  const canvas = document.createElement('canvas'); canvas.id='canvasSim';
  wrap.appendChild(canvas);

  const controls = document.createElement('div'); controls.className='controls';
  controls.innerHTML = `<div class="control">مقیاس: <input id="scaleR" class="range" type="range" min="0.3" max="1.8" step="0.01" value="1"></div>
                        <div class="control">زاویه: <input id="rotR" class="range" type="range" min="0" max="360" step="1" value="0"></div>`;
  wrap.appendChild(controls);
  $('#controlsBox').appendChild(controls);

  const s = controls.querySelector('#scaleR'), r = controls.querySelector('#rotR');
  setupCanvas(canvas, false, ()=> drawSimilarity(canvas, parseFloat(s.value), parseFloat(r.value)));
  s.addEventListener('input', ()=> drawSimilarity(canvas, parseFloat(s.value), parseFloat(r.value)));
  r.addEventListener('input', ()=> drawSimilarity(canvas, parseFloat(s.value), parseFloat(r.value)));
  drawSimilarity(canvas,1,0);
  return wrap;
}

/* ================= LAB: مثلث قائم (نسبت‌ها) ================= */
function labRight(){
  const wrap = document.createElement('div'); wrap.className='canvas-wrap';
  const canvas = document.createElement('canvas'); canvas.id='canvasRight';
  wrap.appendChild(canvas);

  const controls = document.createElement('div'); controls.className='controls';
  controls.innerHTML = `
    <div class="control">θ: <input id="angleR" class="range" type="range" min="10" max="80" step="1" value="40"></div>
    <div class="control">وتر: <input id="hypR" class="range" type="range" min="60" max="300" step="1" value="160"></div>
    <div class="control">sin: <span id="sinVal">-</span> cos: <span id="cosVal">-</span> tan: <span id="tanVal">-</span></div>`;
  wrap.appendChild(controls);
  $('#controlsBox').appendChild(controls);

  const a = controls.querySelector('#angleR'), h = controls.querySelector('#hypR');
  setupCanvas(canvas, false, ()=> drawRight(canvas, parseFloat(a.value), parseFloat(h.value)));
  a.addEventListener('input', ()=> drawRight(canvas, parseFloat(a.value), parseFloat(h.value)));
  h.addEventListener('input', ()=> drawRight(canvas, parseFloat(a.value), parseFloat(h.value)));
  drawRight(canvas,40,160);
  return wrap;
}

/* ================= LAB: رسم و ذخیره ================= */
function labDraw(){
  const wrap = document.createElement('div'); wrap.className='canvas-wrap';
  const canvas = document.createElement('canvas'); canvas.id='canvasDraw';
  wrap.appendChild(canvas);

  const controls = document.createElement('div'); controls.className='controls';
  controls.innerHTML = `<div class="control">راهنما: نقاط را بکشید</div>
                        <div><button id="saveImg" class="btn">ذخیره تصویر</button></div>`;
  wrap.appendChild(controls);
  $('#controlsBox').appendChild(controls);

  setupCanvas(canvas, true, ()=> drawTriangle(canvas));
  $('#saveImg').addEventListener('click', ()=>{
    try{
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = 'triangle.png'; a.click();
      updateInfo('تصویر ذخیره شد.');
      playBeep(880,0.06,'sine',0.06);
      updateScore(2);
    }catch(e){ updateInfo('ذخیره ممکن نیست.'); }
  });
  drawTriangle(canvas);
  return wrap;
}

/* ================= LAB: بازی چالش ================= */
function labGame(){
  const wrap = document.createElement('div'); wrap.className='canvas-wrap';
  const canvas = document.createElement('canvas'); canvas.id='canvasGame';
  wrap.appendChild(canvas);

  const controls = document.createElement('div'); controls.className='controls';
  controls.innerHTML = `<div class="control">مرحله: <span id="gameLevel">1</span></div>
                        <div class="control">چالش: <span id="gameTask">---</span></div>
                        <div><button id="checkBtn" class="btn">بررسی</button> <button id="nextBtn" class="btn">مرحله بعد</button></div>`;
  wrap.appendChild(controls);
  $('#controlsBox').appendChild(controls);

  setupCanvas(canvas, true, ()=> drawTriangle(canvas));
  prepareGame(canvas);

  $('#checkBtn').addEventListener('click', ()=>{
    const ok = checkGame();
    if(ok){ updateInfo('آفرین! +10 امتیاز'); updateScore(10); playBeep(1100,0.08,'sine',0.08); state.game.attempts=0;}
    else { updateInfo('نزدیک‌تر شو.'); state.game.attempts++; playBeep(180,0.06,'sawtooth',0.04); }
  });
  $('#nextBtn').addEventListener('click', ()=>{ state.game.level++; prepareGame(canvas); });
  return wrap;
}
function prepareGame(canvas){
  // مثلث تصادفی و هدف طول AB
  state.triangle = randomTriangle(canvas);
  drawTriangle(canvas);
  const ab = dist(state.triangle.a, state.triangle.b);
  state.game.target = {kind:'AB',value:ab,tol: Math.max(6,ab*0.07)};
  $('#gameTask').innerText = حدس بزن طول AB چقدر است (±${Math.round(state.game.target.tol)});
  $('#gameLevel').innerText = state.game.level;
}
function checkGame(){ const ab = dist(state.triangle.a,state.triangle.b); return Math.abs(ab - state.game.target.value) <= state.game.target.tol; }
function randomTriangle(canvas){
  const w = Math.max(360, canvas.getBoundingClientRect().width || 480);
  const h = Math.max(220, canvas.getBoundingClientRect().height || 320);
  return { a:{x:rand(40,w*0.35), y:rand(80,h-40)}, b:{x:rand(w*0.3,w-40), y:rand(40,h*0.6)}, c:{x:rand(w*0.25,w-60), y:rand(h*0.3,h-20)} };
}
function rand(min,max){ return Math.floor(min + Math.random()*(max-min)); }

/* ========== رسم‌های مشترک ========== */
function setupCanvas(canvas, interactive, redraw){
  // حذف listener قدیمی اگر وجود داشت
  if(canvas._resizeHandler) window.removeEventListener('resize', canvas._resizeHandler);
  const handler = ()=>{ if(!document.contains(canvas)) return; resizeCanvas(canvas); if(typeof redraw==='function') redraw(); };
  canvas._resizeHandler = handler;
  window.addEventListener('resize', handler);
  handler();

  if(interactive){
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerout', onPointerUp);
  }
}
function resizeCanvas(canvas){
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(200, Math.round(rect.width));
  const h = Math.max(120, Math.round(rect.height || Math.min(window.innerHeight*0.45,360)));
  if(canvas.width !== w*dpr || canvas.height !== h*dpr){
    canvas.width = w*dpr; canvas.height = h*dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  }
}

/* رسم مثلث اصلی */
function drawTriangle(canvas){
  const ctx = canvas.getContext('2d'); resizeCanvas(canvas); ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid(ctx, canvas);
  const t = state.triangle;
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(96,165,250,0.95)'; ctx.fillStyle = 'rgba(96,165,250,0.06)';
  ctx.beginPath(); ctx.moveTo(t.a.x,t.a.y); ctx.lineTo(t.b.x,t.b.y); ctx.lineTo(t.c.x,t.c.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  drawHandle(ctx,t.a.x,t.a.y, 'A'); drawHandle(ctx,t.b.x,t.b.y,'B'); drawHandle(ctx,t.c.x,t.c.y,'C');
  const ab = dist(t.a,t.b), bc = dist(t.b,t.c), ca = dist(t.c,t.a);
  $('#sideInfo')?.innerText = AB=${ab.toFixed(1)} | BC=${bc.toFixed(1)} | CA=${ca.toFixed(1)};
  updateInfo(طول اضلاع: AB=${ab.toFixed(1)}, BC=${bc.toFixed(1)}, CA=${ca.toFixed(1)}.);
}
function drawHandle(ctx,x,y,label){
  ctx.beginPath(); ctx.fillStyle = '#60a5fa'; ctx.arc(x,y,12,0,Math.PI*2); ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.stroke();
  ctx.fillStyle = '#021428'; ctx.font = '12px system-ui'; ctx.fillText(label, x-4, y+4);
}
function drawGrid(ctx, canvas){
  ctx.save(); ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=1;
  const w = canvas.width/(window.devicePixelRatio||1), h = canvas.height/(window.devicePixelRatio||1);
  for(let x=0;x<w;x+=30){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for(let y=0;y<h;y+=30){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  ctx.restore();
}

/* رسم شباهت */
function drawSimilarity(canvas, scale, rotDeg){
  const ctx = canvas.getContext('2d'); resizeCanvas(canvas); ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid(ctx, canvas);
  const base = [{x:80,y:260},{x:220,y:100},{x:420,y:260}];
  ctx.lineWidth=2; ctx.strokeStyle='rgba(125,211,252,0.9)'; ctx.fillStyle='rgba(125,211,252,0.06)'; drawPoly(ctx, base);
  const cx = (base[0].x+base[1].x+base[2].x)/3, cy=(base[0].y+base[1].y+base[2].y)/3;
  const rad = rotDeg*Math.PI/180;
  const trans = base.map(p=>{
    const dx=p.x-cx, dy=p.y-cy; const sx=dx*scale, sy=dy*scale;
    const rx = sx*Math.cos(rad)-sy*Math.sin(rad), ry = sx*Math.sin(rad)+sy*Math.cos(rad);
    return {x:cx+rx+80,y:cy+ry-10};
  });
  ctx.strokeStyle='rgba(96,165,250,0.95)'; ctx.fillStyle='rgba(96,165,250,0.06)'; drawPoly(ctx, trans);
  ctx.setLineDash([6,6]); ctx.strokeStyle='rgba(255,255,255,0.06)'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(base[i].x,base[i].y); ctx.lineTo(trans[i].x,trans[i].y); ctx.stroke(); } ctx.setLineDash([]);
  updateInfo(مقیاس: ${scale.toFixed(2)} — چرخش: ${rotDeg}°);
}
function drawPoly(ctx, pts){ ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath(); ctx.fill(); ctx.stroke(); }

/* رسم مثلث قائم */
function drawRight(canvas, deg, hyp){
  const ctx = canvas.getContext('2d'); resizeCanvas(canvas); ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid(ctx, canvas);
  const baseX=80, baseY = canvas.height/(window.devicePixelRatio||1) - 60;
  const theta = deg*Math.PI/180; const opp = Math.sin(theta)*hyp; const adj = Math.cos(theta)*hyp;
  const A={x:baseX,y:baseY}, B={x:baseX+adj,y:baseY}, C={x:baseX,y:baseY-opp};
  ctx.lineWidth=2; ctx.strokeStyle='rgba(125,211,252,0.95)'; ctx.fillStyle='rgba(125,211,252,0.04)'; drawPoly(ctx,[A,B,C]);
  ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(A.x+20,A.y); ctx.lineTo(A.x+20,A.y-20); ctx.lineTo(A.x,A.y-20); ctx.stroke();
  ctx.fillStyle='#e6eef8'; ctx.font='14px system-ui'; ctx.fillText(θ = ${deg.toFixed(0)}°, B.x+10,B.y-10);
  $('#sinVal') && ($('#sinVal').innerText = (opp/hyp).toFixed(3));
  $('#cosVal') && ($('#cosVal').innerText = (adj/hyp).toFixed(3));
  $('#tanVal') && ($('#tanVal').innerText = (opp/adj).toFixed(3));
  updateInfo(قائم — مقابل=${opp.toFixed(1)}, مجاور=${adj.toFixed(1)});
}

/* ========== تعاملات لمسی/ماوس برای درگ نقاط ========== */
function onPointerDown(e){
  e.preventDefault();
  const canvas = e.currentTarget;
  const pos = getEventPos(e, canvas);
  const keys = ['a','b','c'];
  let nearest = null, minD=9999;
  keys.forEach(k=>{
    const p = state.triangle[k]; const d = Math.hypot(p.x-pos.x, p.y-pos.y);
    if(d<minD && d<28){ minD=d; nearest=k; }
  });
  if(nearest){
    state.dragging = nearest;
    try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    playBeep(880,0.06,'sine',0.06);
    canvas.classList.add('handle-glow');
  }
}
function onPointerMove(e){
  if(!state.dragging) return;
  const canvas = e.currentTarget;
  const p = getEventPos(e, canvas);
  const dpr = window.devicePixelRatio || 1;
  const x = Math.max(8, Math.min(canvas.width/dpr - 8, p.x));
  const y = Math.max(8, Math.min(canvas.height/dpr - 8, p.y));
  // انیمیشن ساده: مستقیم به نقطه می‌رویم (انیمیشن کوچک با easing)
  state.triangle[state.dragging].x = x;
  state.triangle[state.dragging].y = y;
  // redraw
  if(typeof drawTriangle === 'function') try{ drawTriangle(canvas); }catch(_){}
}
function onPointerUp(e){
  if(!state.dragging) return;
  const canvas = e.currentTarget;
  try{ canvas.releasePointerCapture(e.pointerId);}catch(_){}
  playBeep(520,0.05,'triangle',0.05);
  canvas.classList.remove('handle-glow');
  state.dragging = null;
}

/* ========== ابزارهای عمومی ========== */
function getEventPos(e, canvas){
  const rect = canvas.getBoundingClientRect();
  const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
  const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
  return { x: clientX - rect.left, y: clientY - rect.top };
}
function dist(p,q){ return Math.hypot(p.x-q.x, p.y-q.y); }
function rand(min,max){ return Math.floor(min + Math.random()*(max-min)); }
function updateInfoBoxForDebug(){ console.log(state); }