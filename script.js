// script.js — موتور اصلی آزمایشگاه هم‌نهشتی
document.addEventListener('DOMContentLoaded', () => {
  // ---------- تنظیمات ----------
  const PROB_CONGRUENT = 0.8; // احتمال هم‌نهشتی در "ارائه مثل جدید"
  const TOL = { low: 12, med: 7, high: 3 };
  const ANG = { low: 6.5, med: 4.5, high: 2.0 };

  // DOM
  const labSection = document.getElementById('lab');
  const btnLab = document.getElementById('openLab');
  const btnGame = document.getElementById('openGame');
  const btnNewPair = document.getElementById('btnNewPair');
  const btnSnap = document.getElementById('btnSnap');
  const btnClear = document.getElementById('btnClear');
  const btnCheck = document.getElementById('btnCheck');
  const btnShowProof = document.getElementById('btnShowProof');
  const guessYes = document.getElementById('guessYes');
  const guessNo = document.getElementById('guessNo');
  const metricsA = document.getElementById('metricsA');
  const metricsB = document.getElementById('metricsB');
  const methodEl = document.getElementById('method');
  const farzEl = document.getElementById('farz');
  const hokmEl = document.getElementById('hokm');
  const proofEl = document.getElementById('proof');
  const levelEl = document.getElementById('level');
  const scoreEl = document.getElementById('score');
  const sensitivitySel = document.getElementById('sensitivity');

  // canvases
  const canvasA = document.getElementById('canvasA'), ctxA = canvasA.getContext('2d');
  const canvasB = document.getElementById('canvasB'), ctxB = canvasB.getContext('2d');

  // state
  let sensitivity = 'med';
  let level = 0, score = 0;
  let tA = [], tB = [];
  let gameState = { isCongruent: null, method: null };

  // audio (کوتاه و محلی)
  const audioEnabled = true;
  function tone(freq=880, time=0.05){
    try{
      if(!audioEnabled) return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type='sine'; o.frequency.value=freq; g.gain.value=0.01;
      o.connect(g); g.connect(ctx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time);
      o.stop(ctx.currentTime+time);
    }catch(e){}
  }

  // ---------- هندسه ----------
  function dist(p,q){ return Math.hypot(p.x-q.x, p.y-q.y); }
  function angle(A,B,C){
    const AB = dist(A,B), CB = dist(C,B), AC = dist(A,C);
    if(AB===0 || CB===0) return 0;
    const cosv = (AB*AB + CB*CB - AC*AC)/(2*AB*CB);
    return Math.acos(Math.max(-1,Math.min(1,cosv))) * 180/Math.PI;
  }
  function approx(a,b,eps){ return Math.abs(a-b) <= eps; }
  function isRight(pts){
    const angs = [ angle(pts[1],pts[0],pts[2]), angle(pts[0],pts[1],pts[2]), angle(pts[0],pts[2],pts[1]) ];
    return angs.some(a => Math.abs(a-90) < 3.5);
  }

  // ---------- رسم و نمایش متریک‌ها ----------
  function clearCanvas(ctx){
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    // grid
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    for(let x=0;x<ctx.canvas.width;x+=24){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,ctx.canvas.height); ctx.stroke(); }
    for(let y=0;y<ctx.canvas.height;y+=24){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(ctx.canvas.width,y); ctx.stroke(); }
    ctx.restore();
  }

  function drawTriangle(ctx, pts, highlight=false){
    clearCanvas(ctx);
    if(pts.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(96,165,250,0.06)';
    ctx.fill();
    ctx.strokeStyle = highlight ? '#ff7a7a' : '#234';
    ctx.lineWidth = 2;
    ctx.stroke();

    // vertices
    pts.forEach((p,i)=>{
      ctx.beginPath(); ctx.fillStyle = '#ffb347'; ctx.arc(p.x,p.y,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#021428'; ctx.font='12px Vazirmatn, sans-serif'; ctx.fillText(['A','B','C'][i], p.x-6, p.y+5);
      ctx.fillStyle = '#ffb347';
    });

    // sides & angles
    const a = dist(pts[1],pts[2]), b = dist(pts[0],pts[2]), c = dist(pts[0],pts[1]);
    ctx.fillStyle = '#0b2340'; ctx.font='13px Vazirmatn, sans-serif';
    ctx.fillText('a=' + Math.round(a), (pts[1].x+pts[2].x)/2, (pts[1].y+pts[2].y)/2 +6);
    ctx.fillText('b=' + Math.round(b), (pts[0].x+pts[2].x)/2, (pts[0].y+pts[2].y)/2 +6);
    ctx.fillText('c=' + Math.round(c), (pts[0].x+pts[1].x)/2, (pts[0].y+pts[1].y)/2 -6);

    ctx.fillText('∠A=' + Math.round(angle(pts[1],pts[0],pts[2])) + '°', pts[0].x+8, pts[0].y+10);
    ctx.fillText('∠B=' + Math.round(angle(pts[0],pts[1],pts[2])) + '°', pts[1].x+8, pts[1].y+10);
    ctx.fillText('∠C=' + Math.round(angle(pts[0],pts[2],pts[1])) + '°', pts[2].x+8, pts[2].y-6);
  }

  function updateMetrics(){
    if(tA.length===3){
      const a = Math.round(dist(tA[1],tA[2])), b = Math.round(dist(tA[0],tA[2])), c = Math.round(dist(tA[0],tA[1]));
      const Aang = Math.round(angle(tA[1],tA[0],tA[2])), Bang = Math.round(angle(tA[0],tA[1],tA[2])), Cang = Math.round(angle(tA[0],tA[2],tA[1]));
      metricsA.innerText = `اضلاع: ${a} — ${b} — ${c}  |  زوایا: ${Aang}° ${Bang}° ${Cang}°`;
    } else metricsA.innerText = 'اضلاع: — | زوایا: —';

    if(tB.length===3){
      const a = Math.round(dist(tB[1],tB[2])), b = Math.round(dist(tB[0],tB[2])), c = Math.round(dist(tB[0],tB[1]));
      const Aang = Math.round(angle(tB[1],tB[0],tB[2])), Bang = Math.round(angle(tB[0],tB[1],tB[2])), Cang = Math.round(angle(tB[0],tB[2],tB[1]));
      metricsB.innerText = `اضلاع: ${a} — ${b} — ${c}  |  زوایا: ${Aang}° ${Bang}° ${Cang}°`;
    } else metricsB.innerText = 'اضلاع: — | زوایا: —';
  }

  // ---------- تشخیص هم‌نهشتی (حالت‌های مورد نظر شما) ----------
  function detectMethod(pA, pB){
    const sA = [dist(pA[0],pA[1]), dist(pA[1],pA[2]), dist(pA[2],pA[0])].sort((a,b)=>a-b);
    const sB = [dist(pB[0],pB[1]), dist(pB[1],pB[2]), dist(pB[2],pB[0])].sort((a,b)=>a-b);
    const angA = [ angle(pA[1],pA[0],pA[2]), angle(pA[0],pA[1],pA[2]), angle(pA[0],pA[2],pA[1]) ].sort((a,b)=>a-b);
    const angB = [ angle(pB[1],pB[0],pB[2]), angle(pB[0],pB[1],pB[2]), angle(pB[0],pB[2],pB[1]) ].sort((a,b)=>a-b);

    const tol = TOL[sensitivity];

    // ض.ض.ض
    if( approx(sA[0],sB[0],tol) && approx(sA[1],sB[1],tol) && approx(sA[2],sB[2],tol) ){
      return { method:'ض.ض.ض', farz:'سه ضلع متناظر برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proof: sssProof() };
    }
    // ض.ز.ض  (دو ضلع و زاویه بین)
    if( approx(sA[0],sB[0],tol) && approx(sA[2],sB[2],tol) && approx(angA[1],angB[1],ANG[sensitivity]) ){
      return { method:'ض.ز.ض', farz:'دو ضلع و زاویهٔ بین آن‌ها برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proof: sasProof() };
    }
    // ز.ض.ز
    if( approx(angA[0],angB[0],ANG[sensitivity]) && approx(angA[2],angB[2],ANG[sensitivity]) && approx(sA[1],sB[1],tol) ){
      return { method:'ز.ض.ز', farz:'دو زاویه و ضلع بین آن‌ها برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proof: asaProof() };
    }
    // و.ض (مثلث‌های قائمه: وتر و یک ضلع)
    if( isRight(pA) && isRight(pB) && approx(sA[1],sB[1],tol) ){
      return { method:'و.ض', farz:'دو مثلث قائمه‌اند و وتر و یک ضلع قائمهٔ متناظر برابرند.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof: rhsProof() };
    }
    // و.ز (وتر و یک زاویه)
    if( isRight(pA) && isRight(pB) && approx(angA[1],angB[1],ANG[sensitivity]) ){
      return { method:'و.ز', farz:'دو مثلث قائمه‌اند و وتر و یک زاویهٔ متناظر برابرند.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof: rangleProof() };
    }

    return null;
  }

  // ---------- اثبات‌های متنی کوتاه (قابل گسترش) ----------
  function sssProof(){
    return 'فرض: سه ضلع متناظر برابرند. طبق قضیهٔ ض.ض.ض، دو مثلث هم‌نهشت‌اند (زاویه‌ها متناظر برابر خواهند شد).';
  }
  function sasProof(){
    return 'فرض: دو ضلع و زاویهٔ بین‌شان برابرند. طبق ض.ز.ض، مثلث‌ها هم‌نهشت‌اند.';
  }
  function asaProof(){
    return 'فرض: دو زاویه و ضلع میان آن‌ها برابر است. طبق ز.ض.ز، مثلث‌ها هم‌نهشت‌اند.';
  }
  function rhsProof(){
    return 'فرض: دو مثلث قائمه‌اند و وتر و یک ضلع قائمه برابرند. طبق قضیهٔ و.ض => هم‌نهشتی.';
  }
  function rangleProof(){
    return 'فرض: دو مثلث قائمه‌اند و وتر و یک زاویهٔ متناظر برابرند. طبق و.ز => هم‌نهشتی.';
  }

  // ---------- helpers برای تولید تصادفی (جفت) ----------
  function randomTriangle(w,h){
    return [
      { x: 40 + Math.random()*(w-80), y: 40 + Math.random()*(h-80) },
      { x: 40 + Math.random()*(w-80), y: 40 + Math.random()*(h-80) },
      { x: 40 + Math.random()*(w-80), y: 40 + Math.random()*(h-80) }
    ];
  }

  function transformCopy(pts){
    // rotate + small scale + translate
    const angleR = (Math.random()*2-1) * 1.6; // -1.6..1.6 rad
    const scale = 0.92 + Math.random()*0.16;
    const tx = 40 + Math.random()*80;
    const ty = -20 + Math.random()*100;
    const cx = canvasA.width/2, cy = canvasA.height/2;
    return pts.map(p=>{
      const x = p.x - cx, y = p.y - cy;
      const rx = x*Math.cos(angleR) - y*Math.sin(angleR);
      const ry = x*Math.sin(angleR) + y*Math.cos(angleR);
      return { x: Math.round(rx*scale + cx + tx), y: Math.round(ry*scale + cy + ty) };
    });
  }

  // ---------- تولید جفت جدید ----------
  function newPair(){
    tA = randomTriangle(canvasA.width, canvasA.height);
    if(Math.random() < PROB_CONGRUENT){
      tB = transformCopy(tA);
      gameState.isCongruent = true;
    } else {
      tB = randomTriangle(canvasB.width, canvasB.height);
      gameState.isCongruent = false;
    }
    drawTriangle(ctxA, tA, false); drawTriangle(ctxB, tB, false);
    updateMetrics();
    clearResult();
    tone(880,0.06);
  }

  // ---------- UI actions ----------
  btnLab.addEventListener('click', ()=> { labSection.classList.remove('hidden'); window.scrollTo({top:labSection.offsetTop, behavior:'smooth'}); });
  document.getElementById('btnLabLarge').addEventListener('click', ()=> { labSection.classList.remove('hidden'); window.scrollTo({top:labSection.offsetTop, behavior:'smooth'}); });

  btnNewPair.addEventListener('click', ()=> { level++; levelEl.innerText = level; newPair(); });
  btnSnap.addEventListener('click', ()=> {
    [tA, tB].forEach(tr=>{
      for(let p of tr){ p.x = Math.round(p.x/12)*12; p.y = Math.round(p.y/12)*12; }
    });
    drawTriangle(ctxA,tA,false); drawTriangle(ctxB,tB,false); updateMetrics(); tone(720,0.04);
  });
  btnClear.addEventListener('click', ()=> {
    tA=[]; tB=[]; drawTriangle(ctxA, [], false); drawTriangle(ctxB, [], false); updateMetrics(); clearResult(); tone(420,0.04);
  });

  guessYes.addEventListener('click', ()=> { if(gameState.isCongruent===null){ alert('ابتدا «ارائه مثل جدید» بزن'); return; } handleGuess(true); });
  guessNo.addEventListener('click', ()=> { if(gameState.isCongruent===null){ alert('ابتدا «ارائه مثل جدید» بزن'); return; } handleGuess(false); });

  function handleGuess(choice){
    if(choice === gameState.isCongruent){
      score += 10; scoreEl.innerText = score; alert('حدس درست! ✅ حالا برای دیدن تشخیص رسمی روی «بررسی هم‌نهشتی» بزن.');
      tone(1200,0.06);
    } else {
      alert('حدس اشتباه بود. ❌ — روی «بررسی هم‌نهشتی» بزن تا علت را ببینی.');
      tone(320,0.06);
    }
  }

  btnCheck.addEventListener('click', ()=>{
    if(!tA || !tB || tA.length!==3 || tB.length!==3){ alert('ابتدا «ارائه مثل جدید» بزن.'); return; }
    sensitivity = sensitivitySel ? sensitivitySel.value : 'med';
    const res = detectMethod(tA,tB);
    gameState.method = res ? res.method : null;
    if(res){ score += 5; scoreEl.innerText = score; }
    showResult(res);
  });

  btnShowProof.addEventListener('click', ()=>{
    if(!gameState.method){ alert('ابتدا «بررسی هم‌نهشتی» را بزن تا روش پیدا شود.'); return; }
    // اجزای فرض، حکم، اثبات قبلاً در showResult نمایش دارد؛ فقط تاکید می‌کنیم
    alert('در بخش نتایج، فرض/حکم/اثبات نمایش داده شده است.');
  });

  function showResult(res){
    if(!res){ methodEl.innerText='—'; farzEl.innerText='—'; hokmEl.innerText='—'; proofEl.innerText='هیچ معیار هم‌نهشتی برقرار نیست.'; return; }
    methodEl.innerText = res.method; farzEl.innerText = res.farz; hokmEl.innerText = res.hokm; proofEl.innerText = res.proof;
  }
  function clearResult(){ methodEl.innerText='—'; farzEl.innerText='—'; hokmEl.innerText='—'; proofEl.innerText='—'; }

  // init: set empty canvases and metrics
  drawTriangle(ctxA, [], false); drawTriangle(ctxB, [], false);
  updateMetrics(); levelEl.innerText = level; scoreEl.innerText = score;

  // expose for debug
  window.newPair = newPair;
  window.tA = tA; window.tB = tB;

}); // DOMContentLoaded end
