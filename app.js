// app.js — منطق کامل: ساخت مثلث، بازی، تشخیص روش‌ها، اثبات، صدا داخلی

/* ---------- تنظیمات ---------- */
const PROB_CONGRUENT = 0.8; // احتمال اینکه چالش/تصادفی دو مثلث هم‌نهشت تولید کند
let sensitivityLevel = 'med'; // low/med/high -> تغییر آستانه‌ها
const TOL = { low: 10, med: 6, high: 3 }; // tolerance pixels برای اضلاع
const ANG = { low: 6.5, med: 4.5, high: 2.0 }; // tolerance در درجه برای زوایا

/* ---------- WebAudio ــ تولید افکت ساده داخلی ---------- */
const audioCtx = (typeof AudioContext !== 'undefined') ? new AudioContext() : null;
function beep(freq=440, time=0.06, gain=0.002){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + time);
  o.stop(audioCtx.currentTime + time);
}

/* ---------- ابزارهای هندسی ---------- */
function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
function angle(A,B,C){
  const AB = dist(A,B), CB = dist(C,B), AC = dist(A,C);
  const cosv = (AB*AB + CB*CB - AC*AC) / (2*AB*CB);
  return Math.acos(Math.max(-1, Math.min(1, cosv))) * 180 / Math.PI;
}
function isRight(tri){
  const angs = [ angle(tri[1],tri[0],tri[2]), angle(tri[0],tri[1],tri[2]), angle(tri[0],tri[2],tri[1]) ];
  return angs.some(a => Math.abs(a - 90) < 3.0);
}

/* ---------- Canvas wrapper (ساخت/درگ/ریز) ---------- */
function CanvasBoard(id){
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  let pts = [], dragging = null;

  function toLocal(e){
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    const cy = (e.clientY !== undefined) ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
    return { x: cx - r.left, y: cy - r.top };
  }

  function redraw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw triangle
    if(pts.length === 3){
      ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); ctx.lineTo(pts[1].x,pts[1].y); ctx.lineTo(pts[2].x,pts[2].y); ctx.closePath();
      ctx.fillStyle = 'rgba(255,154,162,0.12)'; ctx.fill();
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2; ctx.stroke();
    }
    // handles
    for(let i=0;i<pts.length;i++){
      const p = pts[i];
      ctx.beginPath(); ctx.fillStyle = '#ffb347'; ctx.arc(p.x,p.y,10,0,2*Math.PI); ctx.fill();
      ctx.strokeStyle='#b84a6a'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='#021428'; ctx.font='12px Vazirmatn, system-ui'; ctx.fillText(['A','B','C'][i], p.x-5, p.y+5);
    }
  }

  canvas.addEventListener('pointerdown', e=>{
    const pos = toLocal(e);
    // اگر کمتر از 3 نقطه است، اضافه کن
    if(pts.length < 3){
      pts.push(pos); beep(880,0.05,0.0015); redraw(); return;
    }
    // در غیر اینصورت نزدیک‌ترین نقطه را برای drag پیدا کن
    let nearest = -1, md = 9999;
    pts.forEach((p,i)=>{ const d = dist(p,pos); if(d < md && d < 20){ md = d; nearest = i; }});
    if(nearest >= 0){ dragging = nearest; try{ canvas.setPointerCapture(e.pointerId); }catch(e){}; beep(1200,0.04,0.0012); }
  });

  canvas.addEventListener('pointermove', e=>{
    if(dragging === null) return;
    const pos = toLocal(e);
    pos.x = Math.max(8, Math.min(canvas.clientWidth - 8, pos.x));
    pos.y = Math.max(8, Math.min(canvas.clientHeight - 8, pos.y));
    pts[dragging].x = pos.x; pts[dragging].y = pos.y; redraw();
  });

  canvas.addEventListener('pointerup', e=>{
    if(dragging !== null){ try{ canvas.releasePointerCapture(e.pointerId); }catch(e){}; dragging = null; beep(660,0.06,0.0018); }
  });

  function clear(){ pts = []; redraw(); }
  function getPoints(){ return pts.slice(); }
  function setPoints(arr){ pts = arr.map(p=>({x:p.x,y:p.y})); redraw(); }
  function ensureRandom(baseX){
    if(pts.length >=3) return;
    const x = baseX + Math.random()*80; const y = 60 + Math.random()*160;
    setPoints([{x:x,y:y},{x:x+80+Math.random()*30,y:y-40},{x:x+120+Math.random()*20,y:y+60}]);
  }
  redraw();
  return { clear, getPoints, setPoints, ensureRandom, redraw };
}

/* ---------- سرور محلی UI ---------- */
const A = CanvasBoard('canvasA');
const B = CanvasBoard('canvasB');

document.getElementById('randA').addEventListener('click', ()=> A.ensureRandom(40));
document.getElementById('randB').addEventListener('click', ()=> B.ensureRandom(160));
document.getElementById('snapBtn').addEventListener('click', snapAll);
document.getElementById('checkBtn').addEventListener('click', checkAndShow);
document.getElementById('newChallenge').addEventListener('click', startChallenge);
document.getElementById('btnTutorial').addEventListener('click', showTutorial);
document.getElementById('closeTutorial').addEventListener('click', hideTutorial);
document.getElementById('startNow').addEventListener('click', hideTutorial);
document.getElementById('btnModeBuild').addEventListener('click', ()=> setMode('build'));
document.getElementById('btnModeGame').addEventListener('click', ()=> setMode('game'));
document.getElementById('btnReset').addEventListener('click', ()=> { A.clear(); B.clear(); clearResult(); });

document.getElementById('sensitivity').addEventListener('change',(e)=>{
  sensitivityLevel = e.target.value;
});

/* ---------- حالت‌ها و بازی ---------- */
let gameState = { level:0, score:0, target:null };

function setMode(mode){
  if(mode === 'build'){ document.getElementById('gameHint').innerText='حالت ساخت فعال شد — می‌توانید مثلث رسم کنید.'; }
  else { document.getElementById('gameHint').innerText='حالت بازی فعال شد — چالش‌ها را شروع کن.';}
}

/* ---------- هوشمندی تشخیص: ض.ض.ض, ض.ز.ض, ز.ض.ز, و.ض, و.ز ---------- */
function approx(a,b,eps){ return Math.abs(a-b) <= eps; }

function detectMethod(tA, tB){
  // محاسبات
  const sA = [ dist(tA[0],tA[1]), dist(tA[1],tA[2]), dist(tA[2],tA[0]) ].sort((a,b)=>a-b);
  const sB = [ dist(tB[0],tB[1]), dist(tB[1],tB[2]), dist(tB[2],tB[0]) ].sort((a,b)=>a-b);
  const angA = [ angle(tA[1],tA[0],tA[2]), angle(tA[0],tA[1],tA[2]), angle(tA[0],tA[2],tA[1]) ];
  const angB = [ angle(tB[1],tB[0],tB[2]), angle(tB[0],tB[1],tB[2]), angle(tB[0],tB[2],tB[1]) ];
  const angAs = angA.slice().sort((a,b)=>a-b), angBs = angB.slice().sort((a,b)=>a-b);

  const tolS = TOL[sensitivityLevel];
  const tolAng = ANG[sensitivityLevel];

  // ض.ض.ض
  if( approx(sA[0],sB[0],tolS) && approx(sA[1],sB[1],tolS) && approx(sA[2],sB[2],tolS) ){
    return { method:'ض.ض.ض', farz:'سه ضلع مثلث اول برابر سه ضلع مثلث دوم است.', hokm:'دو مثلث هم‌نهشت‌اند.', proof:'طبق ض.ض.ض، سه ضلع متناظر برابر ⇒ هم‌نهشتی.' };
  }
  // ض.ز.ض — دو ضلع و زاویه بین
  if( approx(sA[0],sB[0],tolS) && approx(sA[2],sB[2],tolS) && approx(angAs[1],angBs[1],tolAng) ){
    return { method:'ض.ز.ض', farz:'دو ضلع و زاویهٔ بین آن‌ها در دو مثلث برابر است.', hokm:'دو مثلث هم‌نهشت‌اند.', proof:'طبق ض.ز.ض، دو ضلع و زاویهٔ بین ⇒ هم‌نهشتی.' };
  }
  // ز.ض.ز — دو زاویه و ضلع بین
  if( approx(angAs[0],angBs[0],tolAng) && approx(angAs[2],angBs[2],tolAng) && approx(sA[1],sB[1],tolS) ){
    return { method:'ز.ض.ز', farz:'دو زاویه و ضلع بین آن‌ها در دو مثلث برابر است.', hokm:'دو مثلث هم‌نهشت‌اند.', proof:'طبق ز.ض.ز، دو زاویه و ضلع بین ⇒ هم‌نهشتی.' };
  }
  // و.ض — دو مثلث قائمه، وتر و ضلع قائم
  if( isRight(tA) && isRight(tB) && approx(sA[1],sB[1],tolS) ){
    return { method:'و.ض', farz:'وتر و یک ضلع قائمه در دو مثلث قائمه برابر است.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof:'در مثلث‌های قائمه اگر وتر و یک ضلع قائمه برابر باشند ⇒ هم‌نهشتی.' };
  }
  // و.ز — وتر و زاویه
  if( isRight(tA) && isRight(tB) && approx(angAs[1],angBs[1],tolAng) ){
    return { method:'و.ز', farz:'وتر و یک زاویه در دو مثلث قائمه برابر است.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof:'در مثلث‌های قائمه اگر وتر و یک زاویه برابر باشند ⇒ هم‌نهشتی.' };
  }

  return null;
}

/* ---------- نمایش نتیجه ---------- */
function setResult(obj){
  if(!obj){
    document.getElementById('method').innerText = '—';
    document.getElementById('farz').innerText = '—';
    document.getElementById('hokm').innerText = '—';
    document.getElementById('proofText').innerText = 'هیچ‌یک از معیارها (با دقت انتخابی) برقرار نیست.';
    return;
  }
  document.getElementById('method').innerText = obj.method;
  document.getElementById('farz').innerText = obj.farz;
  document.getElementById('hokm').innerText = obj.hokm;
  document.getElementById('proofText').innerText = obj.proof;
}

/* ---------- بررسی هم‌نهشتی (دکمه) ---------- */
function checkAndShow(){
  const tA = A.getPoints(), tB = B.getPoints();
  if(tA.length !== 3 || tB.length !==3){ alert('هر دو مثلث باید ۳ نقطه داشته باشند.'); return; }
  const res = detectMethod(tA,tB);
  setResult(res);
  if(res){ gameState.score += 10; updateScore(); beep(1200,0.06,0.002); } else beep(400,0.05,0.0012);
}

/* ---------- Snap ---------- */
function snapAll(){
  [A,B].forEach(board=>{
    const pts = board.getPoints();
    pts.forEach(p=>{
      p.x = Math.round(p.x/12)*12;
      p.y = Math.round(p.y/12)*12;
    });
    board.setPoints(pts);
  });
}

/* ---------- بازی: تولید چالش ---------- */
function startChallenge(){
  gameState.level += 1;
  document.getElementById('level').innerText = gameState.level;
  document.getElementById('gameHint').innerText = 'سیستم در حال تولید هدف...';

  // تصمیم می‌گیریم آیا هم‌نهشت بسازیم یا نه
  const makeCongruent = Math.random() < PROB_CONGRUENT;
  // ابتدا مثلث تصادفی برای A بساز
  A.clear(); B.clear();
  A.ensureRandom(40);

  if(makeCongruent){
    // تولید B بر اساس روش تصادفی از 5 حالت
    const methods = ['SSS','SAS','ASA','RHS','RHS2'];
    const chosen = methods[Math.floor(Math.random()*methods.length)];
    const base = A.getPoints();
    // تولید بر اساس روش
    let newB;
    if(chosen === 'SSS'){
      // کپی + تغییر چرخش/ترجمه/مقیاس کمی
      newB = transformCopy(base, { rotate: randRange(0, Math.PI*2), translate: {x: randRange(-40,40), y: randRange(-40,40)}, scale: randRange(0.9,1.1) });
    } else if(chosen === 'SAS'){
      // قالب: مقیاسی جزئی و حفظ زاویه بین ضلع‌ها
      newB = transformCopy(base, { rotate: randRange(0, Math.PI*2), translate: {x: randRange(-30,30), y: randRange(-30,30)}, scale: randRange(0.95,1.05) });
    } else if(chosen === 'ASA'){
      newB = transformCopy(base, { rotate: randRange(0, Math.PI*2), translate: {x: randRange(-40,40), y: randRange(-40,40)}, scale: randRange(0.92,1.08) });
    } else { // RHS (قائمه) — شاید باید یکی از اضلاع قائمه باشد؛ ما کمی دست‌کاری می‌کنیم تا قائمه شود
      // برای RHS: تلاش می‌کنیم مثلث پایه را به یک مثلث قائمه نزدیک کنیم (با چرخش و مقیاس)
      newB = transformCopy(base, { rotate: randRange(0, Math.PI*2), translate: {x: randRange(-30,30), y: randRange(-30,30)}, scale: randRange(0.95,1.05) });
    }
    B.setPoints(newB);
    document.getElementById('gameHint').innerText = 'هدف: برقراری یک حالت هم‌نهشتی (سیستم انتخاب می‌کند).';
  } else {
    // دو مثلث ناهم‌نهشت تولید کن
    B.ensureRandom(160);
    document.getElementById('gameHint').innerText = 'هدف: غیرهم‌نهشت — گاهی آزمون سخت می‌شود!';
  }
}

/* ---------- کمکی‌ها: تبدیل کپی با تبدیلات هندسی ---------- */
function randRange(a,b){ return Math.random()*(b-a)+a; }
function transformCopy(pts, opts){
  const cx = 175, cy = 175;
  const angle = opts.rotate || 0, sx = opts.scale || 1, tx = (opts.translate && opts.translate.x) || 0, ty = (opts.translate && opts.translate.y) || 0;
  return pts.map(p=>{
    const x = p.x - cx, y = p.y - cy;
    const rx = x*Math.cos(angle) - y*Math.sin(angle);
    const ry = x*Math.sin(angle) + y*Math.cos(angle);
    return { x: Math.round((rx*sx + cx + tx)), y: Math.round((ry*sx + cy + ty)) };
  });
}

/* ---------- UI helpers ---------- */
function updateScore(){ document.getElementById('score').innerText = gameState.score; document.getElementById('scorePanel') && (document.getElementById('scorePanel').innerText = gameState.score); }
function clearResult(){ setResult(null); }

/* ---------- init ---------- */
document.getElementById('score').innerText = 0;
document.getElementById('level').innerText = 0;
setMode('build');

/* expose some helpers to console for debugging */
window.A = A; window.B = B; window.startChallenge = startChallenge; window.checkAndShow = checkAndShow;
