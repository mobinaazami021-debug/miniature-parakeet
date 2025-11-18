// DOM ready
document.addEventListener('DOMContentLoaded', ()=> {
  // Config
  const PROB_CONGRUENT = 0.8;
  const TOL = { low: 10, med: 6, high: 3 };
  const ANG = { low: 6.5, med: 4.5, high: 2.0 };
  let sensitivity = 'med';
  let muted = false;

  // Elements
  const canvasA = document.getElementById('canvasA');
  const canvasB = document.getElementById('canvasB');
  const randA = document.getElementById('randA');
  const randB = document.getElementById('randB');
  const clearA = document.getElementById('clearA');
  const clearB = document.getElementById('clearB');
  const snapBtn = document.getElementById('snapBtn');
  const checkBtn = document.getElementById('checkBtn');
  const challengeBtn = document.getElementById('challengeBtn');
  const btnRandA = document.getElementById('btnRandA');
  const btnRandB = document.getElementById('btnRandB');
  const btnReset = document.getElementById('btnReset');
  const btnTutorial = document.getElementById('btnTutorial');
  const btnHelp = document.getElementById('btnHelp');
  const btnModeBuild = document.getElementById('btnModeBuild');
  const btnModeGame = document.getElementById('btnModeGame');
  const sensitivitySel = document.getElementById('sensitivity');
  const methodEl = document.getElementById('method');
  const farzEl = document.getElementById('farz');
  const hokmEl = document.getElementById('hokm');
  const proofEl = document.getElementById('proofText');
  const levelEl = document.getElementById('level');
  const scoreEl = document.getElementById('score');
  const gameHint = document.getElementById('gameHint');
  const tutorialModal = document.getElementById('tutorialModal');
  const closeTutorial = document.getElementById('closeTutorial');
  const startNow = document.getElementById('startNow');
  const dontShow = document.getElementById('dontShow');
  const btnMute = document.getElementById('btnMute');

  // Boards (wrapper object with drag support)
  function CanvasBoard(el){
    const c = el;
    const ctx = c.getContext('2d');
    let pts = [], drag = null;

    function toLocal(e){
      const r = c.getBoundingClientRect();
      const clientX = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      const clientY = (e.clientY !== undefined) ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
      return { x: clientX - r.left, y: clientY - r.top };
    }

    function redraw(){
      ctx.clearRect(0,0,c.width,c.height);
      // draw triangle
      if(pts.length===3){
        ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); ctx.lineTo(pts[1].x,pts[1].y); ctx.lineTo(pts[2].x,pts[2].y); ctx.closePath();
        ctx.fillStyle='rgba(96,165,250,0.12)'; ctx.fill();
        ctx.strokeStyle='#213547'; ctx.lineWidth=2; ctx.stroke();
      }
      // draw handles
      for(let i=0;i<pts.length;i++){
        const p=pts[i];
        ctx.beginPath(); ctx.fillStyle='#ffb347'; ctx.arc(p.x,p.y,9,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#b84a6a'; ctx.lineWidth=1.2; ctx.stroke();
        ctx.fillStyle='#021428'; ctx.font='12px Vazirmatn, system-ui'; ctx.fillText(['A','B','C'][i], p.x-6, p.y+5);
      }
    }

    c.addEventListener('pointerdown', e=>{
      const pos = toLocal(e);
      if(pts.length < 3){ pts.push(pos); playClick(); redraw(); return; }
      let nearest=-1, md=9999;
      pts.forEach((p,i)=>{ const d = Math.hypot(p.x-pos.x,p.y-pos.y); if(d<md && d<20){ md=d; nearest=i; }});
      if(nearest>=0){ drag = nearest; try{ c.setPointerCapture(e.pointerId); }catch(_){}; playClick(); }
    });

    c.addEventListener('pointermove', e=>{
      if(drag === null) return;
      const pos = toLocal(e);
      pos.x = Math.max(8, Math.min(c.clientWidth-8, pos.x));
      pos.y = Math.max(8, Math.min(c.clientHeight-8, pos.y));
      pts[drag].x = pos.x; pts[drag].y = pos.y; redraw();
    });

    c.addEventListener('pointerup', e=>{
      if(drag !== null){ try{ c.releasePointerCapture(e.pointerId); }catch(_){}; drag=null; playSuccess(); }
    });

    function clear(){ pts=[]; redraw(); }
    function setPoints(arr){ pts = arr.map(p=>({x:p.x,y:p.y})); redraw(); }
    function getPoints(){ return pts.slice(); }
    function ensureRandom(baseX){
      if(pts.length>=3) return;
      const x = baseX + Math.random()*80;
      const y = 60 + Math.random()*160;
      setPoints([{x:x,y:y},{x:x+80+Math.random()*30,y:y-40},{x:x+120+Math.random()*20,y:y+60}]);
    }
    redraw();
    return { clear, setPoints, getPoints, ensureRandom, redraw };
  }

  const A = CanvasBoard(canvasA);
  const B = CanvasBoard(canvasB);

  // sound (WebAudio)
  const audioCtx = (typeof AudioContext !== 'undefined') ? new AudioContext() : null;
  function playClick(){ if(!audioCtx || muted) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='sine'; o.frequency.value=900; g.gain.value=0.002; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.00001,audioCtx.currentTime+0.03); o.stop(audioCtx.currentTime+0.03); }
  function playSuccess(){ if(!audioCtx || muted) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='sine'; o.frequency.value=1200; g.gain.value=0.003; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.00001,audioCtx.currentTime+0.06); o.stop(audioCtx.currentTime+0.06); }

  // helpers geometry
  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
  function angle(A,B,C){ const AB=dist(A,B), CB=dist(C,B), AC=dist(A,C); const cosv=(AB*AB+CB*CB-AC*AC)/(2*AB*CB); return Math.acos(Math.max(-1,Math.min(1,cosv)))*180/Math.PI; }
  function isRight(tri){ const angs=[ angle(tri[1],tri[0],tri[2]), angle(tri[0],tri[1],tri[2]), angle(tri[0],tri[2],tri[1]) ]; return angs.some(a=>Math.abs(a-90)<3.0); }

  // set up listeners (buttons)
  btnRandA.addEventListener('click', ()=> { A.ensureRandom(40); if(currentMode==='game') maybeMakeBCongruent(); });
  btnRandB.addEventListener('click', ()=> B.ensureRandom(160));
  randA.addEventListener('click', ()=> A.ensureRandom(40));
  randB.addEventListener('click', ()=> B.ensureRandom(160));
  clearA.addEventListener('click', ()=> A.clear());
  clearB.addEventListener('click', ()=> B.clear());
  snapBtn.addEventListener('click', snapAlign);
  checkBtn.addEventListener('click', checkAndShow);
  challengeBtn.addEventListener('click', startChallenge);
  btnReset.addEventListener('click', ()=>{ A.clear(); B.clear(); clearResult(); });
  btnTutorial.addEventListener('click', ()=> { tutorialModal.classList.remove('hidden'); });
  closeTutorial && closeTutorial.addEventListener('click', ()=> tutorialModal.classList.add('hidden'));
  startNow && startNow.addEventListener('click', ()=> { tutorialModal.classList.add('hidden'); if(dontShow && dontShow.checked) localStorage.setItem('noTutor','1'); });
  btnHelp.addEventListener('click', ()=> alert('راهنما:\n- در حالت ساخت ۳ کلیک بزن تا مثلث رسم شود. \n- در حالت بازی چالش ایجاد کن و سپس بررسی کن.'));
  btnModeBuild.addEventListener('click', ()=> setMode('build'));
  btnModeGame.addEventListener('click', ()=> setMode('game'));
  sensitivitySel.addEventListener('change', (e)=> sensitivity = e.target.value);
  btnMute && btnMute.addEventListener('click', ()=> { muted = !muted; btnMute.innerText = muted ? '🔇' : '🔈 بی‌صدا'; });

  // mode
  let currentMode = 'build';
  function setMode(m){
    currentMode = m;
    if(m==='build'){ gameHint.innerText='حالت ساخت فعال شد — کلیک کن و مثلث بساز.'; btnModeBuild.classList.add('primary'); btnModeGame.classList.remove('primary'); }
    else { gameHint.innerText='حالت بازی فعال شد — چالش بزن.'; btnModeGame.classList.add('primary'); btnModeBuild.classList.remove('primary'); }
  }
  setMode('build');

  // detection
  function approx(a,b,eps){ return Math.abs(a-b) <= eps; }
  function detectMethod(tA,tB){
    const sA=[ dist(tA[0],tA[1]), dist(tA[1],tA[2]), dist(tA[2],tA[0]) ].sort((a,b)=>a-b);
    const sB=[ dist(tB[0],tB[1]), dist(tB[1],tB[2]), dist(tB[2],tB[0]) ].sort((a,b)=>a-b);
    const angA=[ angle(tA[1],tA[0],tA[2]), angle(tA[0],tA[1],tA[2]), angle(tA[0],tA[2],tA[1]) ];
    const angB=[ angle(tB[1],tB[0],tB[2]), angle(tB[0],tB[1],tB[2]), angle(tB[0],tB[2],tB[1]) ];
    const angAs=angA.slice().sort((a,b)=>a-b), angBs=angB.slice().sort((a,b)=>a-b);
    const tolS = TOL[sensitivity], tolAng = ANG[sensitivity];

    if( approx(sA[0],sB[0],tolS) && approx(sA[1],sB[1],tolS) && approx(sA[2],sB[2],tolS) ){
      return { method:'ض.ض.ض', farz:'سه ضلع مثلث اول برابر سه ضلع مثلث دوم است.', hokm:'دو مثلث هم‌نهشت‌اند.', proof:'طبق ض.ض.ض ⇒ هم‌نهشتی.' };
    }
    if( approx(sA[0],sB[0],tolS) && approx(sA[2],sB[2],tolS) && approx(angAs[1],angBs[1],tolAng) ){
      return { method:'ض.ز.ض', farz:'دو ضلع و زاویه بین آنها برابر است.', hokm:'دو مثلث هم‌نهشت‌اند.', proof:'طبق ض.ز.ض ⇒ هم‌نهشتی.' };
    }
    if( approx(angAs[0],angBs[0],tolAng) && approx(angAs[2],angBs[2],tolAng) && approx(sA[1],sB[1],tolS) ){
      return { method:'ز.ض.ز', farz:'دو زاویه و ضلع بین آنها برابر است.', hokm:'دو مثلث هم‌نهشت‌اند.', proof:'طبق ز.ض.ز ⇒ هم‌نهشتی.' };
    }
    if( isRight(tA) && isRight(tB) && approx(sA[1],sB[1],tolS) ){
      return { method:'و.ض', farz:'وتر و یک ضلع قائمه برابر است.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof:'طبق و.ض ⇒ هم‌نهشتی.' };
    }
    if( isRight(tA) && isRight(tB) && approx(angAs[1],angBs[1],tolAng) ){
      return { method:'و.ز', farz:'وتر و یک زاویه برابر است.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof:'طبق و.ز ⇒ هم‌نهشتی.' };
    }
    return null;
  }

  function setResult(obj){
    if(!obj){ methodEl.innerText='—'; farzEl.innerText='—'; hokmEl.innerText='—'; proofEl.innerText='هیچ‌یک از معیارها برقرار نیست.'; return; }
    methodEl.innerText = obj.method; farzEl.innerText = obj.farz; hokmEl.innerText = obj.hokm; proofEl.innerText = obj.proof;
  }

  // check
  function checkAndShow(){
    const tA = A.getPoints(), tB = B.getPoints();
    if(tA.length!==3 || tB.length!==3){ alert('هر دو مثلث باید ۳ نقطه داشته باشند.'); return; }
    const res = detectMethod(tA,tB);
    setResult(res);
    if(res){ playSuccess(); scoreInc(10); } else playClick();
  }

  // snap
  function snapAlign(){
    const tA = A.getPoints(), tB = B.getPoints();
    if(tA.length !==3){ A.ensureRandom(40); return; }
    if(tB.length !==3){ B.setPoints([{x:tA[0].x+30,y:tA[0].y},{x:tA[1].x+30,y:tA[1].y},{x:tA[2].x+30,y:tA[2].y}]); return; }
    const cxA = (tA[0].x+tA[1].x+tA[2].x)/3, cyA=(tA[0].y+tA[1].y+tA[2].y)/3;
    const cxB = (tB[0].x+tB[1].x+tB[2].x)/3, cyB=(tB[0].y+tB[1].y+tB[2].y)/3;
    const dx = cxA-cxB, dy = cyA-cyB;
    B.setPoints(tB.map(p=>({x:p.x+dx,y:p.y+dy})));
    playClick();
  }

  // game
  let gameState = { level:0, score:0, target:null };
  function startChallenge(){
    gameState.level += 1; levelEl.innerText = gameState.level; gameHint.innerText = 'در حال تولید...';
    A.clear(); B.clear();
    A.ensureRandom(40);
    const make = Math.random() < PROB_CONGRUENT;
    if(make){
      const base = A.getPoints();
      const ang = Math.random()*Math.PI*2; const sc = 0.95+Math.random()*0.12;
      const tx = (Math.random()*60)-30; const ty = (Math.random()*60)-30;
      const newB = transformCopy(base,{rotate:ang, scale:sc, tx:tx, ty:ty});
      B.setPoints(newB);
      gameHint.innerText = 'هدف: برقراری هم‌نهشتی (سیستم انتخاب کرد).';
    } else {
      B.ensureRandom(160); gameHint.innerText = 'هدف: غیرهم‌نهشت (آزمون سخت).';
    }
  }

  function transformCopy(pts, opts){
    const cx = canvasA.width/2, cy = canvasA.height/2;
    const angle = opts.rotate || 0, scale = opts.scale || 1, tx = opts.tx || 0, ty = opts.ty || 0;
    return pts.map(p=>{
      const x = p.x - cx, y = p.y - cy;
      const rx = x*Math.cos(angle) - y*Math.sin(angle);
      const ry = x*Math.sin(angle) + y*Math.cos(angle);
      return { x: Math.round(rx*scale + cx + tx), y: Math.round(ry*scale + cy + ty) };
    });
  }

  function maybeMakeBCongruent(){ if(Math.random() < PROB_CONGRUENT && A.getPoints().length===3){ const base = A.getPoints(); const ang = Math.random()*Math.PI*2; const sc = 0.95 + Math.random()*0.1; const tx = (Math.random()*80)-40; const ty = (Math.random()*80)-40; const newB = transformCopy(base,{rotate:ang, scale:sc, tx:tx, ty:ty}); B.setPoints(newB); } }

  // score
  function scoreInc(n){ gameState.score += n; scoreEl.innerText = gameState.score; }

  // result clear
  function clearResult(){ setResult(null); }

  // expose some useful for debug
  window.A = A; window.B = B; window.checkAndShow = checkAndShow; window.startChallenge = startChallenge;

  // init: create demo triangles
  A.setPoints([{x:60,y:220},{x:150,y:80},{x:260,y:240}]);
  B.setPoints([{x:320,y:200},{x:400,y:90},{x:420,y:240}]);
  scoreEl.innerText = 0; levelEl.innerText = 0;

  // attach global simple buttons (those outside canvases)
  btnRandA.addEventListener('click', ()=> { A.ensureRandom(40); if(currentModeIsGame()) maybeMakeBCongruent(); });
  btnRandB.addEventListener('click', ()=> { B.ensureRandom(160); });
  checkBtn.addEventListener('click', checkAndShow);
  snapBtn.addEventListener('click', snapAlign);
  challengeBtn.addEventListener('click', startChallenge);
  btnReset.addEventListener('click', ()=> { A.clear(); B.clear(); clearResult(); });

  function currentModeIsGame(){ return currentMode === 'game'; }

  // small helpers: playClick/Success for other places
  function playClick(){ if(!audioCtx || muted) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='sine'; o.frequency.value=700; g.gain.value=0.002; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.00001,audioCtx.currentTime+0.04); o.stop(audioCtx.currentTime+0.04); }
  function playSuccess(){ if(!audioCtx || muted) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='sine'; o.frequency.value=1200; g.gain.value=0.003; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.00001,audioCtx.currentTime+0.06); o.stop(audioCtx.currentTime+0.06); }

}); // DOMContentLoaded end
