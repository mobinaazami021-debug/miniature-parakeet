// نهایی — همه دکمه‌ها وصل و تست‌شده
document.addEventListener('DOMContentLoaded', ()=> {
  // config
  const PROB_CONGRUENT = 0.8;
  const TOL = { low: 10, med: 6, high: 3 };
  let sensitivity = 'med';
  let muted = false;
  let level=0, score=0;

  // DOM
  const btnLearn = document.getElementById('btnLearn');
  const btnBuild = document.getElementById('btnBuild');
  const btnGame = document.getElementById('btnGame');
  const btnPresent = document.getElementById('btnPresent');
  const btnMute = document.getElementById('btnMute');

  const panelBuild = document.getElementById('panelBuild');
  const panelGame = document.getElementById('panelGame');
  const learnCard = document.getElementById('learnCard');

  const buildCanvas = document.getElementById('canvasBuild');
  const ctxBuild = buildCanvas.getContext('2d');

  const canvasA = document.getElementById('canvasA'), ctxA = canvasA.getContext('2d');
  const canvasB = document.getElementById('canvasB'), ctxB = canvasB.getContext('2d');

  const metricsA = document.getElementById('metricsA'), metricsB = document.getElementById('metricsB');
  const methodEl = document.getElementById('method'), farzEl = document.getElementById('farz'), hokmEl = document.getElementById('hokm'), proofEl = document.getElementById('proof');

  const btnNewChallenge = document.getElementById('btnNewChallenge');
  const btnCheck = document.getElementById('btnCheck');
  const btnGuessYes = document.getElementById('btnGuessYes');
  const btnGuessNo = document.getElementById('btnGuessNo');
  const btnSnap = document.getElementById('btnSnap');
  const btnClearBuild = document.getElementById('btnClearBuild');

  const levelEl = document.getElementById('level'), scoreEl = document.getElementById('score');

  // utility geometry
  function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
  function angle(A,B,C){
    const BA = dist(B,A), BC=dist(B,C), AC=dist(A,C);
    const cosv = (BA*BA + BC*BC - AC*AC)/(2*BA*BC);
    return Math.round(Math.acos(Math.max(-1,Math.min(1,cosv)))*180/Math.PI);
  }

  // draw helpers (with grid)
  function clearCanvas(ctx, w, h){
    ctx.clearRect(0,0,w,h);
    // light grid
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for(let x=0;x<w;x+=24){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for(let y=0;y<h;y+=24){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.restore();
  }

  function drawTriangleOn(ctx, pts, highlight){
    const w=ctx.canvas.width, h=ctx.canvas.height;
    clearCanvas(ctx,w,h);
    if(pts.length<3) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x,pts[0].y);
    ctx.lineTo(pts[1].x,pts[1].y);
    ctx.lineTo(pts[2].x,pts[2].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(96,165,250,0.06)';
    ctx.fill();
    ctx.strokeStyle = highlight ? '#ff7a7a' : '#234';
    ctx.lineWidth = 2;
    ctx.stroke();

    // draw points
    ctx.fillStyle = '#ffb347';
    for(let i=0;i<3;i++){
      const p=pts[i];
      ctx.beginPath(); ctx.arc(p.x,p.y,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#021428';
      ctx.font='13px Vazirmatn, sans-serif';
      ctx.fillText(['A','B','C'][i], p.x-6, p.y+5);
      ctx.fillStyle='#ffb347';
    }

    // side lengths & angles
    const a = dist(pts[1],pts[2]), b = dist(pts[0],pts[2]), c = dist(pts[0],pts[1]);
    ctx.fillStyle='#0b2340'; ctx.font='13px Vazirmatn, sans-serif';
    ctx.fillText('a='+Math.round(a), (pts[1].x+pts[2].x)/2, (pts[1].y+pts[2].y)/2 +6);
    ctx.fillText('b='+Math.round(b), (pts[0].x+pts[2].x)/2, (pts[0].y+pts[2].y)/2 +6);
    ctx.fillText('c='+Math.round(c), (pts[0].x+pts[1].x)/2, (pts[0].y+pts[1].y)/2 -6);

    ctx.fillText('∠A='+angle(pts[1],pts[0],pts[2])+'°', pts[0].x+8, pts[0].y+10);
    ctx.fillText('∠B='+angle(pts[0],pts[1],pts[2])+'°', pts[1].x+8, pts[1].y+10);
    ctx.fillText('∠C='+angle(pts[0],pts[2],pts[1])+'°', pts[2].x+8, pts[2].y-6);
  }

  // detect methods (Persian labels)
  function approx(a,b,eps){ return Math.abs(a-b) <= eps; }
  function isRight(pts){
    const angs = [ angle(pts[1],pts[0],pts[2]), angle(pts[0],pts[1],pts[2]), angle(pts[0],pts[2],pts[1]) ];
    return angs.some(a=>Math.abs(a-90) < 3.5);
  }
  function detectMethod(t1,t2){
    const s1=[dist(t1[0],t1[1]),dist(t1[1],t1[2]),dist(t1[2],t1[0])].sort((a,b)=>a-b);
    const s2=[dist(t2[0],t2[1]),dist(t2[1],t2[2]),dist(t2[2],t2[0])].sort((a,b)=>a-b);
    const ang1=[ angle(t1[1],t1[0],t1[2]), angle(t1[0],t1[1],t1[2]), angle(t1[0],t1[2],t1[1]) ].sort((a,b)=>a-b);
    const ang2=[ angle(t2[1],t2[0],t2[2]), angle(t2[0],t2[1],t2[2]), angle(t2[0],t2[2],t2[1]) ].sort((a,b)=>a-b);
    const tol = 6;

    if(approx(s1[0],s2[0],tol) && approx(s1[1],s2[1],tol) && approx(s1[2],s2[2],tol)){
      return {method:'ض.ض.ض', farz:'سه ضلع متناظر برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proof:'طبق ض.ض.ض ⇒ هم‌نهشتی.'};
    }
    if(approx(s1[0],s2[0],tol) && approx(s1[2],s2[2],tol) && approx(ang1[1],ang2[1],4)){
      return {method:'ض.ز.ض', farz:'دو ضلع و زاویهٔ بین آن‌ها برابر است.', hokm:'دو مثلث هم‌نهشت‌اند.', proof:'طبق ض.ز.ض ⇒ هم‌نهشتی.'};
    }
    if(approx(ang1[0],ang2[0],4) && approx(ang1[2],ang2[2],4) && approx(s1[1],s2[1],tol)){
      return {method:'ز.ض.ز', farz:'دو زاویه و ضلع بین آن‌ها برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proof:'طبق ز.ض.ز ⇒ هم‌نهشتی.'};
    }
    if(isRight(t1) && isRight(t2) && approx(s1[1],s2[1],tol)){
      return {method:'و.ض', farz:'وتر و یک ضلع قائمه برابرند.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof:'طبق و.ض ⇒ هم‌نهشتی.'};
    }
    if(isRight(t1) && isRight(t2) && approx(ang1[1],ang2[1],4)){
      return {method:'و.ز', farz:'وتر و یک زاویه برابرند.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof:'طبق و.ز ⇒ هم‌نهشتی.'};
    }
    return null;
  }

  // proof templates use detectMethod result
  function showResult(res){
    if(!res){
      methodEl.innerText='—'; farzEl.innerText='—'; hokmEl.innerText='—'; proofEl.innerText='هیچ معیار هم‌نهشتی برقرار نیست.';
    } else {
      methodEl.innerText = res.method; farzEl.innerText = res.farz; hokmEl.innerText = res.hokm; proofEl.innerText = res.proof;
    }
  }

  // state
  let buildPts = [];
  let tA = [], tB = [];
  let gameState = {isCongruent:null, method:null};

  // ====== BUILD canvas handlers ======
  function redrawBuild(){ clearCanvas(ctxBuild, buildCanvas.width, buildCanvas.height); if(buildPts.length===3) drawTriangleOn(ctxBuild, buildPts, true); updateBuildInfo(); }
  function updateBuildInfo(){
    const el = document.getElementById('buildInfo');
    if(buildPts.length!==3){ el.innerText = 'اضلاع/زوایا: —'; return; }
    const a=Math.round(dist(buildPts[1],buildPts[2])), b=Math.round(dist(buildPts[0],buildPts[2])), c=Math.round(dist(buildPts[0],buildPts[1]));
    const Aang=angle(buildPts[1],buildPts[0],buildPts[2]), Bang=angle(buildPts[0],buildPts[1],buildPts[2]), Cang=angle(buildPts[0],buildPts[2],buildPts[1]);
    el.innerText = `اضلاع: a=${a} b=${b} c=${c}  |  زوایا: ∠A=${Aang}° ∠B=${Bang}° ∠C=${Cang}°`;
  }

  buildCanvas.addEventListener('pointerdown', (e)=>{
    const r = buildCanvas.getBoundingClientRect();
    const p = {x: e.clientX - r.left, y: e.clientY - r.top};
    if(buildPts.length < 3){ buildPts.push(p); redrawBuild(); return; }
    // else enable drag of nearest point
    let nearest=-1,md=9999; buildPts.forEach((pt,i)=>{ const d=dist(pt,p); if(d<md){md=d;nearest=i;}});
    if(md < 16){ // start dragging
      buildCanvas.isDragging = nearest;
      buildCanvas.setPointerCapture(e.pointerId);
    }
  });
  buildCanvas.addEventListener('pointermove',(e)=>{
    if(buildCanvas.isDragging !== undefined && buildCanvas.isDragging !== null){
      const r = buildCanvas.getBoundingClientRect();
      const p= {x: e.clientX - r.left, y: e.clientY - r.top};
      buildPts[buildCanvas.isDragging] = p; redrawBuild();
    }
  });
  buildCanvas.addEventListener('pointerup',(e)=>{ buildCanvas.isDragging = null; });

  btnClearBuild.addEventListener('click', ()=>{ buildPts = []; redrawBuild(); });

  btnSnap.addEventListener('click', ()=>{
    buildPts = buildPts.map(p=>({x: Math.round(p.x/12)*12, y: Math.round(p.y/12)*12})); redrawBuild();
  });

  // ====== GAME handlers ======
  function randomTriangleOn(w,h){
    return [
      {x: 40 + Math.random()*(w-80), y: 40 + Math.random()*(h-80)},
      {x: 40 + Math.random()*(w-80), y: 40 + Math.random()*(h-80)},
      {x: 40 + Math.random()*(w-80), y: 40 + Math.random()*(h-80)}
    ];
  }

  function presentPair(){
    // always create triA; triB either congruent copy (80%) or random
    tA = randomTriangleOn(canvasA.width, canvasA.height);
    if(Math.random() < PROB_CONGRUENT){
      // create congruent copy by translate+rotate+small scale
      const angleR = Math.random()*Math.PI*2;
      const scale = 0.96 + Math.random()*0.08;
      const tx = 30 + Math.random()*80;
      const ty = -20 + Math.random()*80;
      tB = tA.map(p=>{
        const cx = canvasA.width/2, cy = canvasA.height/2;
        const x = p.x - cx, y = p.y - cy;
        const rx = x*Math.cos(angleR) - y*Math.sin(angleR);
        const ry = x*Math.sin(angleR) + y*Math.cos(angleR);
        return {x: Math.round(rx*scale + cx + tx), y: Math.round(ry*scale + cy + ty)};
      });
      gameState.isCongruent = true;
    } else {
      tB = randomTriangleOn(canvasB.width, canvasB.height);
      gameState.isCongruent = false;
    }
    drawTriangleOn(ctxA, tA, false); drawTriangleOn(ctxB, tB, false);
    updateMetrics();
    clearResult();
  }

  function updateMetrics(){
    if(tA.length===3){
      const aA = Math.round(dist(tA[1],tA[2])), bA = Math.round(dist(tA[0],tA[2])), cA = Math.round(dist(tA[0],tA[1]));
      const Aang = angle(tA[1],tA[0],tA[2]), Bang = angle(tA[0],tA[1],tA[2]), Cang = angle(tA[0],tA[2],tA[1]);
      metricsA.innerText = `اضلاع: ${aA}—${bA}—${cA}  |  زوایا: ${Aang}° ${Bang}° ${Cang}°`;
    } else metricsA.innerText = 'اضلاع: — | زوایا: —';
    if(tB.length===3){
      const aB = Math.round(dist(tB[1],tB[2])), bB = Math.round(dist(tB[0],tB[2])), cB = Math.round(dist(tB[0],tB[1]));
      const Aang = angle(tB[1],tB[0],tB[2]), Bang = angle(tB[0],tB[1],tB[2]), Cang = angle(tB[0],tB[2],tB[1]);
      metricsB.innerText = `اضلاع: ${aB}—${bB}—${cB}  |  زوایا: ${Aang}° ${Bang}° ${Cang}°`;
    } else metricsB.innerText = 'اضلاع: — | زوایا: —';
  }

  function clearResult(){ methodEl.innerText='—'; farzEl.innerText='—'; hokmEl.innerText='—'; proofEl.innerText='—'; }

  btnNewChallenge.addEventListener('click', ()=>{
    level++; levelEl.innerText = level; presentPair();
  });

  btnGuessYes.addEventListener('click', ()=>{ if(gameState.isCongruent===null){ alert('ابتدا چالش جدید بزن.'); return;} handleGuess(true); });
  btnGuessNo.addEventListener('click', ()=>{ if(gameState.isCongruent===null){ alert('ابتدا چالش جدید بزن.'); return;} handleGuess(false); });

  function handleGuess(guess){
    if(guess === gameState.isCongruent){ score += 10; scoreEl.innerText = score; alert('حدس درست بود! حالا برای دیدن اثبات، روی «بررسی هم‌نهشتی» بزن.'); }
    else alert('حدست اشتباه بود — روی «بررسی هم‌نهشتی» بزن تا ببینی چرا.');
  }

  btnCheck.addEventListener('click', ()=>{
    if(!tA || !tB || tA.length!==3 || tB.length!==3){ alert('ابتدا چالش یا ارائه مثل جدید بزن.'); return; }
    const res = detectMethod(tA,tB);
    showResult(res);
    if(res){ score += 5; scoreEl.innerText = score; }
  });

  // present example / replace clear
  btnPresent.addEventListener('click', ()=>{
    level++; levelEl.innerText = level;
    // present educational pair (one likely congruent)
    const base = [{x:80,y:240},{x:160,y:100},{x:260,y:240}];
    tA = base;
    tB = base.map(p=>({x:p.x+140,y:p.y-40}));
    gameState.isCongruent = true;
    drawTriangleOn(ctxA,tA,false); drawTriangleOn(ctxB,tB,false);
    updateMetrics(); clearResult();
    alert('مثل نمونه ارائه شد — روی «بررسی هم‌نهشتی» بزن.');
  });

  // menu switching
  btnLearn.addEventListener('click', ()=> { panelBuild.classList.add('hidden'); panelGame.classList.add('hidden'); learnCard.style.display='block'; });
  btnBuild.addEventListener('click', ()=> { learnCard.style.display='none'; panelGame.classList.add('hidden'); panelBuild.classList.remove('hidden'); });
  btnGame.addEventListener('click', ()=> { learnCard.style.display='none'; panelBuild.classList.add('hidden'); panelGame.classList.remove('hidden'); });

  // mute
  btnMute.addEventListener('click', ()=> { muted = !muted; btnMute.innerText = muted ? '🔇' : '🔈 بی‌صدا'; });

  // init: show learn
  learnCard.style.display='block';
  panelBuild.classList.add('hidden'); panelGame.classList.add('hidden');
  levelEl.innerText = level; scoreEl.innerText = score;

}); // DOMContentLoaded end
