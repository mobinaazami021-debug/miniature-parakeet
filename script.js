// script.js — نسخه با اندازه اضلاع/زاویه، حدس هم‌نهشتی، فرض/حکم/اثبات
document.addEventListener('DOMContentLoaded', () => {

  const PROB_CONGRUENT = 0.8;
  const TOL = { low: 10, med: 6, high: 3 };
  const ANG = { low: 6.5, med: 4.5, high: 2.0 };
  let sensitivity = 'med';
  let muted = false;

  // elements
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
  const btnPresent = document.getElementById('btnPresent');
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
  const btnGuessYes = document.getElementById('btnGuessYes');
  const btnGuessNo = document.getElementById('btnGuessNo');
  const metricsA = document.getElementById('metricsA');
  const metricsB = document.getElementById('metricsB');

  // audio (WebAudio short tones)
  const audioCtx = (typeof AudioContext !== 'undefined') ? new AudioContext() : null;
  function tone(freq=880, time=0.06, gain=0.002){
    if(!audioCtx || muted) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + time);
    o.stop(audioCtx.currentTime + time);
  }

  // geometry helpers
  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
  function angle(A,B,C){
    const AB = dist(A,B), CB = dist(C,B), AC = dist(A,C);
    if(AB === 0 || CB === 0) return 0;
    const cosv = (AB*AB + CB*CB - AC*AC)/(2*AB*CB);
    return Math.acos(Math.max(-1, Math.min(1, cosv)))*180/Math.PI;
  }
  function isRight(tri){
    const angs = [ angle(tri[1],tri[0],tri[2]), angle(tri[0],tri[1],tri[2]), angle(tri[0],tri[2],tri[1]) ];
    return angs.some(a => Math.abs(a - 90) < 3.5);
  }

  // CanvasBoard
  function CanvasBoard(canvas){
    const c = canvas;
    const ctx = c.getContext('2d');
    let pts = [], dragging = null;

    function toLocal(e){
      const r = c.getBoundingClientRect();
      const clientX = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      const clientY = (e.clientY !== undefined) ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
      return { x: clientX - r.left, y: clientY - r.top };
    }

    function redraw(){
      ctx.clearRect(0,0,c.width,c.height);
      if(pts.length === 3){
        ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); ctx.lineTo(pts[1].x,pts[1].y); ctx.lineTo(pts[2].x,pts[2].y); ctx.closePath();
        ctx.fillStyle = 'rgba(99,102,241,0.08)'; ctx.fill();
        ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; ctx.stroke();
      }
      for(let i=0;i<pts.length;i++){
        const p = pts[i];
        ctx.beginPath(); ctx.fillStyle = '#ffb347'; ctx.arc(p.x,p.y,8,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#b84a6a'; ctx.lineWidth=1.2; ctx.stroke();
        ctx.fillStyle='#021428'; ctx.font='12px Vazirmatn, system-ui'; ctx.fillText(['A','B','C'][i], p.x-6, p.y+5);
      }
    }

    c.addEventListener('pointerdown', e=>{
      const pos = toLocal(e);
      if(pts.length < 3){
        pts.push(pos); tone(880,0.04,0.002); redraw(); updateAllMetrics(); return;
      }
      let nearest=-1, md=9999;
      pts.forEach((p,i)=>{ const d=dist(p,pos); if(d<md && d<20){ md=d; nearest=i; }});
      if(nearest>=0){ dragging = nearest; try{ c.setPointerCapture(e.pointerId); }catch(_){ } tone(1200,0.03,0.0015); }
    });

    c.addEventListener('pointermove', e=>{
      if(dragging === null) return;
      const pos = toLocal(e);
      pos.x = Math.max(8, Math.min(c.clientWidth-8, pos.x));
      pos.y = Math.max(8, Math.min(c.clientHeight-8, pos.y));
      pts[dragging].x = pos.x; pts[dragging].y = pos.y; redraw(); updateAllMetrics();
    });

    c.addEventListener('pointerup', e=>{
      if(dragging !== null){ try{ c.releasePointerCapture(e.pointerId); }catch(_){ } dragging = null; tone(660,0.05,0.002); updateAllMetrics(); }
    });

    function clear(){ pts=[]; redraw(); updateAllMetrics(); }
    function setPoints(arr){ pts = arr.map(p=>({x:p.x,y:p.y})); redraw(); updateAllMetrics(); }
    function getPoints(){ return pts.slice(); }
    function ensureRandom(baseX){
      if(pts.length >= 3) return;
      const x = baseX + Math.random()*80;
      const y = 60 + Math.random()*160;
      setPoints([{x:x,y:y},{x:x+80+Math.random()*30,y:y-40},{x:x+120+Math.random()*20,y:y+60}]);
    }
    return { clear, setPoints, getPoints, ensureRandom, redraw };
  }

  const A = CanvasBoard(canvasA);
  const B = CanvasBoard(canvasB);

  // UI bindings
  btnRandA.addEventListener('click', ()=> { A.ensureRandom(40); if(currentMode === 'game') maybeMakeBCongruent(); });
  btnRandB.addEventListener('click', ()=> { B.ensureRandom(160); });
  randA.addEventListener('click', ()=> A.ensureRandom(40));
  randB.addEventListener('click', ()=> B.ensureRandom(160));
  clearA.addEventListener('click', ()=> A.clear());
  clearB.addEventListener('click', ()=> B.clear());
  snapBtn.addEventListener('click', snapAll);
  checkBtn.addEventListener('click', checkAndShow);
  challengeBtn.addEventListener('click', startChallenge);
  btnPresent.addEventListener('click', presentExample);
  btnTutorial.addEventListener('click', ()=> tutorialModal.classList.remove('hidden'));
  closeTutorial && closeTutorial.addEventListener('click', ()=> tutorialModal.classList.add('hidden'));
  startNow && startNow.addEventListener('click', ()=> { tutorialModal.classList.add('hidden'); if(dontShow && dontShow.checked) localStorage.setItem('noTutor','1'); });
  btnHelp.addEventListener('click', ()=> alert('راهنما: توضیحات آموزشی در دکمهٔ آموزش موجود است.'));
  btnModeBuild.addEventListener('click', ()=> setMode('build'));
  btnModeGame.addEventListener('click', ()=> setMode('game'));
  sensitivitySel.addEventListener('change', (e)=> sensitivity = e.target.value);
  btnMute && btnMute.addEventListener('click', ()=> { muted = !muted; btnMute.innerText = muted ? '🔇' : '🔈 بی‌صدا'; });

  btnGuessYes.addEventListener('click', ()=> makeGuess(true));
  btnGuessNo.addEventListener('click', ()=> makeGuess(false));

  // initial data + UI
  A.setPoints([{x:60,y:220},{x:150,y:80},{x:260,y:240}]);
  B.setPoints([{x:320,y:200},{x:400,y:90},{x:420,y:240}]);
  scoreEl.innerText = 0; levelEl.innerText = 0;

  let currentMode = 'build';
  function setMode(m){
    currentMode = m;
    if(m === 'build'){ gameHint.innerText = 'حالت ساخت فعال شد — کلیک کن و مثلث بساز.'; btnModeBuild.classList.add('primary'); btnModeGame.classList.remove('primary'); }
    else { gameHint.innerText = 'حالت بازی فعال شد — چالش بزن.'; btnModeGame.classList.add('primary'); btnModeBuild.classList.remove('primary'); }
  }
  setMode('build');

  // detection methods (same as خواسته تو: ض.ض.ض، ض.ز.ض، ز.ض.ز، و.ض، و.ز)
  function approx(a,b,eps){ return Math.abs(a-b) <= eps; }
  function detectMethod(tA,tB){
    const sA = [ dist(tA[0],tA[1]), dist(tA[1],tA[2]), dist(tA[2],tA[0]) ].sort((a,b)=>a-b);
    const sB = [ dist(tB[0],tB[1]), dist(tB[1],tB[2]), dist(tB[2],tB[0]) ].sort((a,b)=>a-b);
    const angA = [ angle(tA[1],tA[0],tA[2]), angle(tA[0],tA[1],tA[2]), angle(tA[0],tA[2],tA[1]) ];
    const angB = [ angle(tB[1],tB[0],tB[2]), angle(tB[0],tB[1],tB[2]), angle(tB[0],tB[2],tB[1]) ];
    const angAs = angA.slice().sort((a,b)=>a-b), angBs = angB.slice().sort((a,b)=>a-b);

    const tolS = TOL[sensitivity], tolAng = ANG[sensitivity];

    if( approx(sA[0],sB[0],tolS) && approx(sA[1],sB[1],tolS) && approx(sA[2],sB[2],tolS) ){
      return { method:'ض.ض.ض', farz:'سه ضلع متناظر برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proofSteps:sssProof() };
    }
    if( approx(sA[0],sB[0],tolS) && approx(sA[2],sB[2],tolS) && approx(angAs[1],angBs[1],tolAng) ){
      return { method:'ض.ز.ض', farz:'دو ضلع و زاویهٔ بین آن‌ها برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proofSteps:sasProof() };
    }
    if( approx(angAs[0],angBs[0],tolAng) && approx(angAs[2],angBs[2],tolAng) && approx(sA[1],sB[1],tolS) ){
      return { method:'ز.ض.ز', farz:'دو زاویه و ضلع بین آن‌ها برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proofSteps:asaProof() };
    }
    if( isRight(tA) && isRight(tB) && approx(sA[1],sB[1],tolS) ){
      return { method:'و.ض', farz:'وتر و یک ضلع قائمه برابرند.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proofSteps:rhsProof() };
    }
    if( isRight(tA) && isRight(tB) && approx(angAs[1],angBs[1],tolAng) ){
      return { method:'و.ز', farz:'وتر و یک زاویه برابرند.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proofSteps:rAngleProof() };
    }
    return null;
  }

  // proof templates
  function sssProof(){ return ['فرض: سه ضلع متناظر برابرند.','نتیجه: طبق ض.ض.ض ⇒ هم‌نهشتی.'].join(' '); }
  function sasProof(){ return ['فرض: دو ضلع و زاویهٔ بین برابرند.','نتیجه: طبق ض.ز.ض ⇒ هم‌نهشتی.'].join(' '); }
  function asaProof(){ return ['فرض: دو زاویه و ضلع بین آن‌ها برابرند.','نتیجه: طبق ز.ض.ز ⇒ هم‌نهشتی.'].join(' '); }
  function rhsProof(){ return ['فرض: مثلث‌ها قائمه و وتر و یک ضلع برابرند.','نتیجه: طبق و.ض ⇒ هم‌نهشتی.'].join(' '); }
  function rAngleProof(){ return ['فرض: مثلث‌ها قائمه و وتر و یک زاویه برابرند.','نتیجه: طبق و.ز ⇒ هم‌نهشتی.'].join(' '); }

  function setResult(obj){
    if(!obj){ methodEl.innerText='—'; farzEl.innerText='—'; hokmEl.innerText='—'; proofEl.innerText='هیچ‌یک از معیارها برقرار نیست.'; return; }
    methodEl.innerText = obj.method; farzEl.innerText = obj.farz; hokmEl.innerText = obj.hokm; proofEl.innerText = obj.proofSteps;
  }

  // check
  function checkAndShow(){
    const tA = A.getPoints(), tB = B.getPoints();
    if(tA.length !==3 || tB.length !==3){ alert('هر دو مثلث باید ۳ نقطه داشته باشند.'); return; }
    const res = detectMethod(tA,tB);
    setResult(res);
    if(res) { tone(1200,0.06,0.003); incrementScore(10); } else tone(380,0.05,0.002);
  }

  // show metrics (lengths & angles)
  function formatNum(n){ return Math.round(n); }
  function computeMetrics(pts){
    if(pts.length !== 3) return { sides: ['—','—','—'], angles: ['—','—','—'] };
    const s = [ dist(pts[0],pts[1]), dist(pts[1],pts[2]), dist(pts[2],pts[0]) ].map(formatNum);
    const ang = [ angle(pts[1],pts[0],pts[2]), angle(pts[0],pts[1],pts[2]), angle(pts[0],pts[2],pts[1]) ].map(a => Math.round(a));
    return { sides: s, angles: ang };
  }
  function updateAllMetrics(){
    const mA = computeMetrics(A.getPoints()), mB = computeMetrics(B.getPoints());
    metricsA.innerText = `اضلاع: ${mA.sides.join(' — ')}  |  زوایا: ${mA.angles.join('°  ')}°`;
    metricsB.innerText = `اضلاع: ${mB.sides.join(' — ')}  |  زوایا: ${mB.angles.join('°  ')}°`;
  }

  // snap (grid align)
  function snapAll(){
    [A,B].forEach(board=>{
      const pts = board.getPoints();
      pts.forEach(p=>{ p.x = Math.round(p.x/12)*12; p.y = Math.round(p.y/12)*12; });
      board.setPoints(pts);
    });
    tone(800,0.05,0.002);
  }

  // game
  let gameState = { level:0, score:0, isCongruent:null, method:null };
  function startChallenge(){
    gameState.level += 1; levelEl.innerText = gameState.level; gameHint.innerText = 'در حال تولید چالش...';
    A.clear(); B.clear();
    A.ensureRandom(40);

    // choose uniformly among methods (we map to Persian ones)
    const methods = ['SSS','SAS','ASA','RHS','R-angle'];
    const chosen = methods[Math.floor(Math.random()*methods.length)];
    gameState.method = chosen;

    const make = Math.random() < PROB_CONGRUENT;
    gameState.isCongruent = make;

    if(make){
      const base = A.getPoints();
      const newB = transformCopy(base, {rotate: Math.random()*Math.PI*2, scale:1, tx: 30 + Math.random()*40, ty: -30 + Math.random()*60});
      B.setPoints(newB);
      gameHint.innerText = 'سیستم: اکنون دو مثلث هم‌نهشت هستند — حدس بزن.';
    } else {
      B.ensureRandom(160);
      gameHint.innerText = 'سیستم: اکنون دو مثلث هم‌نهشت نیستند — حدس بزن.';
    }
    clearResult();
    updateAllMetrics();
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

  function maybeMakeBCongruent(){ if(Math.random() < PROB_CONGRUENT && A.getPoints().length===3){ const base = A.getPoints(); const newB = transformCopy(base,{rotate:Math.random()*Math.PI*2, scale:0.98 + Math.random()*0.04, tx:(Math.random()*80)-40, ty:(Math.random()*80)-40}); B.setPoints(newB); } }

  // presentExample (جایگزین پاکسازی) - ارائه یک مثل نمونه آموزنده
  function presentExample(){
    A.clear(); B.clear();
    // یک مثال آموزنده: یک مثلث قائم به همراه یک هم‌نهشت مطابق
    A.setPoints([{x:80,y:260},{x:170,y:120},{x:260,y:260}]); // یک مثلث
    const copy = transformCopy(A.getPoints(), {rotate: 0.6, scale:1, tx: 120, ty:-40});
    B.setPoints(copy);
    gameHint.innerText = 'مثال: این دو مثلث برای آموزش ارائه شدند — روی «بررسی هم‌نهشتی» بزن.';
    updateAllMetrics();
  }

  // guess handling
  function makeGuess(guessYes){
    if(gameState.isCongruent === null){ alert('ابتدا روی «چالش جدید» بزن'); return; }
    const correct = gameState.isCongruent === guessYes;
    if(correct){
      tone(1200,0.06,0.003); incrementScore(15); alert('آفرین! حدست درست بود ✅ — حالا روی «بررسی هم‌نهشتی» بزن تا فرض/حکم/اثبات را ببینی.');
    } else {
      tone(360,0.06,0.002); alert('حدست درست نبود ❌ — روی «بررسی هم‌نهشتی» بزن تا علت را ببینی.');
    }
  }

  // score
  function incrementScore(n){ gameState.score += n; scoreEl.innerText = gameState.score; }

  // clear result
  function clearResult(){ setResult(null); }

  // expose for debug
  window.A = A; window.B = B; window.startChallenge = startChallenge; window.checkAndShow = checkAndShow;

  // ensure metrics visible
  updateAllMetrics();

}); // DOMContentLoaded end
