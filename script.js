// script.js — موتور آزمایشگاه هم‌نهشتی (نسخه نهایی، استیکری، بدون گیج‌کننده بودن زاویه‌ها)

document.addEventListener('DOMContentLoaded', () => {
  // ---------- تنظیمات ----------
  const PROB_CONGRUENT = 0.8;
  const TOL = { low: 12, med: 7, high: 3 };
  const ANG = { low: 7.5, med: 4.5, high: 2.2 };

  // DOM
  const btnNew = document.getElementById('btnNew');
  const btnCheck = document.getElementById('btnCheck');
  const btnShowProof = document.getElementById('btnShowProof');
  const btnClear = document.getElementById('btnClear');
  const btnGuessYes = document.getElementById('btnGuessYes');
  const btnGuessNo = document.getElementById('btnGuessNo');
  const metricsA = document.getElementById('metricsA');
  const metricsB = document.getElementById('metricsB');
  const methodEl = document.getElementById('method');
  const farzEl = document.getElementById('farz');
  const hokmEl = document.getElementById('hokm');
  const proofEl = document.getElementById('proof');
  const levelEl = document.getElementById('level');
  const scoreEl = document.getElementById('score');
  const sensitivitySel = document.getElementById('sensitivity');

  const canvasA = document.getElementById('canvasA');
  const canvasB = document.getElementById('canvasB');
  const ctxA = canvasA.getContext('2d');
  const ctxB = canvasB.getContext('2d');
  const stickerImg = document.getElementById('stickerSource');

  // state
  let level = 0, score = 0;
  let tA = [], tB = [];
  let gameState = { isCongruent: null, method: null };
  let templates = [
    // angle triples (degrees) — system chooses from these to keep angles "rond"
    [60,60,60],
    [90,45,45],
    [30,60,90],
    [36,72,72],
    [50,60,70],
    [40,40,100],
    [54,54,72] // some common integer-angle triangles
  ];

  // ---------- صوت برای بازخورد کوتاه ----------
  function tone(freq=880, t=0.05){
    try{
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(); const g = ac.createGain();
      o.type = 'sine'; o.frequency.value = freq; g.gain.value = 0.01;
      o.connect(g); g.connect(ac.destination); o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t); o.stop(ac.currentTime + t + 0.02);
    } catch(e){}
  }

  // ---------- توابع هندسی ----------
  function toRad(d){ return d * Math.PI / 180; }
  function dist(p,q){ return Math.hypot(p.x-q.x, p.y-q.y); }
  function angle(A,B,C){
    const AB = dist(A,B), CB = dist(C,B), AC = dist(A,C);
    if(AB===0 || CB===0) return 0;
    const cosv = (AB*AB + CB*CB - AC*AC)/(2*AB*CB);
    return Math.acos(Math.max(-1,Math.min(1,cosv))) * 180/Math.PI;
  }
  function approx(a,b,eps){ return Math.abs(a-b) <= eps; }

  // ---------- رسم شبکه و مثلث با استیکر برچسب ----------
  function clearGrid(ctx){
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for(let x=0;x<ctx.canvas.width;x+=24){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,ctx.canvas.height); ctx.stroke(); }
    for(let y=0;y<ctx.canvas.height;y+=24){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(ctx.canvas.width,y); ctx.stroke(); }
    ctx.restore();
  }

  function drawSticker(ctx, x, y, text){
    const w = 72, h = 30, r = 8;
    // rounded rect
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, x - w/2, y - h/2, w, h, r);
    ctx.fill();
    // small image left
    if(stickerImg && stickerImg.complete){
      const imgSize = 22;
      try{ ctx.drawImage(stickerImg, x - w/2 + 6, y - imgSize/2, imgSize, imgSize); } catch(e){}
    } else {
      // fallback colored dot
      ctx.fillStyle = '#ffb347';
      ctx.beginPath(); ctx.arc(x - w/2 + 16, y, 10,0,Math.PI*2); ctx.fill();
    }
    // text
    ctx.fillStyle = '#072033';
    ctx.font = '12px Vazirmatn, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(text, x - w/2 + 34, y + 4);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTriangle(ctx, pts, labels, highlight=false){
    clearGrid(ctx);
    if(!pts || pts.length < 3) return;
    // polygon
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(96,165,250,0.06)';
    ctx.fill();
    ctx.strokeStyle = highlight ? '#ff6b6b' : '#123';
    ctx.lineWidth = 2;
    ctx.stroke();

    // vertices
    pts.forEach((p,i)=>{
      ctx.beginPath(); ctx.fillStyle = '#ffb347'; ctx.arc(p.x,p.y,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#021428'; ctx.font = '12px Vazirmatn, sans-serif'; ctx.fillText(['A','B','C'][i], p.x-7, p.y+5);
    });

    // side lengths and angle labels via stickers
    const a = dist(pts[1],pts[2]), b = dist(pts[0],pts[2]), c = dist(pts[0],pts[1]);
    const Aang = Math.round(angle(pts[1],pts[0],pts[2]));
    const Bang = Math.round(angle(pts[0],pts[1],pts[2]));
    const Cang = Math.round(angle(pts[0],pts[2],pts[1]));

    // pick label positions (midpoints and near vertices)
    const midAB = { x:(pts[0].x+pts[1].x)/2, y:(pts[0].y+pts[1].y)/2 };
    const midBC = { x:(pts[1].x+pts[2].x)/2, y:(pts[1].y+pts[2].y)/2 };
    const midCA = { x:(pts[2].x+pts[0].x)/2, y:(pts[2].y+pts[0].y)/2 };

    // draw stickers (text has units removed for compactness)
    drawSticker(ctx, midBC.x, midBC.y - 18, 'a=' + Math.round(a));
    drawSticker(ctx, midCA.x, midCA.y - 18, 'b=' + Math.round(b));
    drawSticker(ctx, midAB.x, midAB.y - 18, 'c=' + Math.round(c));

    drawSticker(ctx, pts[0].x + 36, pts[0].y - 18, '∠A=' + Aang + '°');
    drawSticker(ctx, pts[1].x + 36, pts[1].y - 18, '∠B=' + Bang + '°');
    drawSticker(ctx, pts[2].x + 36, pts[2].y - 18, '∠C=' + Cang + '°');

    // also update labels param (if provided) with clean round values
    if(labels){
      labels.sides = { a: Math.round(a), b: Math.round(b), c: Math.round(c) };
      labels.angles = { A: Aang, B: Bang, C: Cang };
    }
  }

  // ---------- تولید مثلث از قالب زاویه‌ای (تا زاویه‌ها رُند بمانند) ----------
  // می‌خواهیم سه ضلع برحسب سه زاویه (α,β,γ) تولید شوند با قانون سینوس
  function triangleFromAngles(anglesDeg, scale=140, canvas){
    // anglesDeg: [A,B,C] in degrees (sum 180)
    const [Adeg, Bdeg, Cdeg] = anglesDeg;
    // law of sines: side opposite A proportional to sin(A)
    const sA = Math.sin(toRad(Adeg));
    const sB = Math.sin(toRad(Bdeg));
    const sC = Math.sin(toRad(Cdeg));
    // choose scale k such that longest side about scale
    const k = scale / Math.max(sA, sB, sC);
    const a = k * sA, b = k * sB, c = k * sC; // lengths proportional to opposite angles
    // Now place base between p1(x1,y1) and p2(x2,y2) with length c (we'll use c as base)
    const cx = canvas.width / 2;
    const baseY = canvas.height * 0.72;
    const x1 = cx - c/2, y1 = baseY;
    const x2 = cx + c/2, y2 = baseY;
    // third point from intersection of circles center x1 radius b, center x2 radius a
    const dx = x2 - x1, dy = y2 - y1;
    const d = Math.hypot(dx, dy);
    // law of cosines to find h
    const cosTheta = (b*b + d*d - a*a) / (2*b*d);
    // clamp
    const cosClamped = Math.max(-1, Math.min(1, cosTheta));
    const px = x1 + (b * (dx/d) * cosClamped) - (b * (dy/d) * Math.sqrt(Math.max(0,1 - cosClamped*cosClamped)));
    const py = y1 + (b * (dy/d) * cosClamped) + (b * (dx/d) * Math.sqrt(Math.max(0,1 - cosClamped*cosClamped)));
    const P1 = { x: x1, y: y1 }, P2 = { x: x2, y: y2 }, P3 = { x: px, y: py };
    // return vertices in order A,B,C corresponding to anglesDeg
    // map: angle A opposite side a (between B-C). We used base c between P1-P2.
    // Let's return [P3 (A), P1 (B), P2 (C)] so that opposite corresponding lengths match approximately.
    return { pts: [P3, P1, P2], sides: { a: a, b: b, c: c }, angles: { A: Adeg, B: Bdeg, C: Cdeg } };
  }

  // ---------- تبدیل (چرخش+ترجمه+اسکیل کوچک) برای ایجاد یک مثلث هم‌نهشت ولی متفاوت ظاهری ----------
  function transformCopy(pts, canvas){
    const angleR = (Math.random()*2-1) * 1.2;
    const scale = 0.95 + Math.random()*0.12;
    const tx = 30 + Math.random()*100;
    const ty = -40 + Math.random()*120;
    const cx = canvas.width/2, cy = canvas.height/2;
    return pts.map(p=>{
      const x = p.x - cx, y = p.y - cy;
      const rx = x*Math.cos(angleR) - y*Math.sin(angleR);
      const ry = x*Math.sin(angleR) + y*Math.cos(angleR);
      return { x: Math.round(rx*scale + cx + tx), y: Math.round(ry*scale + cy + ty) };
    });
  }

  // ---------- انتخاب قالب و تولید جفت ----------
  function pickTemplate(){
    return templates[Math.floor(Math.random() * templates.length)];
  }

  function newPair(){
    // pick template
    const tpl = pickTemplate(); // e.g. [60,60,60]
    const scale = 140 + Math.random()*30;
    const base = triangleFromAngles(tpl, scale, canvasA);
    tA = base.pts;
    // 80% congruent
    if(Math.random() < PROB_CONGRUENT){
      tB = transformCopy(tA, canvasB);
      gameState.isCongruent = true;
      gameState.template = base.angles; // remember template angles
    } else {
      // pick a different template for non-congruent to ensure clear difference
      let tpl2 = tpl;
      while(tpl2 === tpl) tpl2 = pickTemplate();
      const base2 = triangleFromAngles(tpl2, 120 + Math.random()*40, canvasB);
      tB = base2.pts;
      gameState.isCongruent = false;
      gameState.template = null;
    }
    drawTriangle(ctxA, tA, { sides:{}, angles:{} }, false);
    drawTriangle(ctxB, tB, { sides:{}, angles:{} }, false);
    updateMetricsFromTemplates();
    clearResult();
    tone(880,0.05);
  }

  // ---------- نمایش متریک‌ها — مهم: اگر جفت از قالب تولید شده بود، زاویه‌ها دقیق از قالب خوانده می‌شوند */
  function updateMetricsFromTemplates(){
    // For tA: if gameState.template exists, use template angles for display for that triangle; else compute rounded
    if(gameState.template){
      // tA corresponds to template angles
      const Aang = gameState.template.A || gameState.template[0] || null;
      // But our template saved as {A:,B:,C:} when congruent; earlier we saved base.angles as object
    }
    // compute actual measured and display rounded but if template exists use template
    if(tA && tA.length===3){
      const a = Math.round(dist(tA[1],tA[2])), b = Math.round(dist(tA[0],tA[2])), c = Math.round(dist(tA[0],tA[1]));
      let Aang = Math.round(angle(tA[1],tA[0],tA[2])), Bang = Math.round(angle(tA[0],tA[1],tA[2])), Cang = Math.round(angle(tA[0],tA[2],tA[1]));
      if(gameState.isCongruent && gameState.template){
        // template stored as object or array; handle both
        const tpl = gameState.template;
        if(tpl.A !== undefined){ Aang = tpl.A; Bang = tpl.B; Cang = tpl.C; }
        else if(Array.isArray(tpl)){ Aang = tpl[0]; Bang = tpl[1]; Cang = tpl[2]; }
      }
      metricsA.innerText = `اضلاع: ${a} — ${b} — ${c}  |  زوایا: ${Aang}° ${Bang}° ${Cang}°`;
    } else metricsA.innerText = 'اضلاع: — | زوایا: —';

    if(tB && tB.length===3){
      const a = Math.round(dist(tB[1],tB[2])), b = Math.round(dist(tB[0],tB[2])), c = Math.round(dist(tB[0],tB[1]));
      let Aang = Math.round(angle(tB[1],tB[0],tB[2])), Bang = Math.round(angle(tB[0],tB[1],tB[2])), Cang = Math.round(angle(tB[0],tB[2],tB[1]));
      if(gameState.isCongruent && gameState.template){
        // if tB is transformed copy, show same template angles
        const tpl = gameState.template;
        if(tpl.A !== undefined){ Aang = tpl.A; Bang = tpl.B; Cang = tpl.C; }
        else if(Array.isArray(tpl)){ Aang = tpl[0]; Bang = tpl[1]; Cang = tpl[2]; }
      }
      metricsB.innerText = `اضلاع: ${a} — ${b} — ${c}  |  زوایا: ${Aang}° ${Bang}° ${Cang}°`;
    } else metricsB.innerText = 'اضلاع: — | زوایا: —';
  }

  // ---------- تشخیص حالت‌های هم‌نهشتی ----------
  function isRightTriangle(pts){
    const angs = [ angle(pts[1],pts[0],pts[2]), angle(pts[0],pts[1],pts[2]), angle(pts[0],pts[2],pts[1]) ];
    return angs.some(a => Math.abs(a - 90) < 4);
  }

  function detectMethod(pA, pB){
    const sA = [dist(pA[0],pA[1]), dist(pA[1],pA[2]), dist(pA[2],pA[0])].sort((a,b)=>a-b);
    const sB = [dist(pB[0],pB[1]), dist(pB[1],pB[2]), dist(pB[2],pB[0])].sort((a,b)=>a-b);
    const angA = [ angle(pA[1],pA[0],pA[2]), angle(pA[0],pA[1],pA[2]), angle(pA[0],pA[2],pA[1]) ].sort((a,b)=>a-b);
    const angB = [ angle(pB[1],pB[0],pB[2]), angle(pB[0],pB[1],pB[2]), angle(pB[0],pB[2],pB[1]) ].sort((a,b)=>a-b);

    const tol = TOL[sensitivitySel ? sensitivitySel.value : 'med'];
    const angTol = ANG[sensitivitySel ? sensitivitySel.value : 'med'];

    // ض.ض.ض
    if( approx(sA[0],sB[0],tol) && approx(sA[1],sB[1],tol) && approx(sA[2],sB[2],tol) ){
      return { method:'ض.ض.ض', farz:'سه ضلع متناظر برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proof: sssProof() };
    }
    // ض.ز.ض  (دو ضلع و زاویه بین) — we check middle angle equality approx
    if( approx(sA[0],sB[0],tol) && approx(sA[2],sB[2],tol) && approx(angA[1],angB[1],angTol) ){
      return { method:'ض.ز.ض', farz:'دو ضلع و زاویهٔ بین آن‌ها برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proof: sasProof() };
    }
    // ز.ض.ز
    if( approx(angA[0],angB[0],angTol) && approx(angA[2],angB[2],angTol) && approx(sA[1],sB[1],tol) ){
      return { method:'ز.ض.ز', farz:'دو زاویه و ضلع بین آن‌ها برابرند.', hokm:'دو مثلث هم‌نهشت‌اند.', proof: asaProof() };
    }
    // و.ض (قائمه)
    if(isRightTriangle(pA) && isRightTriangle(pB) && approx(sA[1],sB[1],tol)){
      return { method:'و.ض', farz:'دو مثلث قائمه‌اند و وتر و یک ضلع قائمهٔ متناظر برابرند.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof: rhsProof() };
    }
    // و.ز (قائمه)
    if(isRightTriangle(pA) && isRightTriangle(pB) && approx(angA[1],angB[1],angTol)){
      return { method:'و.ز', farz:'دو مثلث قائمه‌اند و وتر و یک زاویهٔ متناظر برابرند.', hokm:'دو مثلث قائمه هم‌نهشت‌اند.', proof: rangleProof() };
    }
    return null;
  }

  // ---------- اثبات‌های متنی ----------
  function sssProof(){ return 'فرض: سه ضلع متناظر برابرند. طبق قضیهٔ ض.ض.ض، دو مثلث هم‌نهشت‌اند؛ بنابراین زاویه‌ها متناظر برابرند.'; }
  function sasProof(){ return 'فرض: دو ضلع و زاویهٔ بین آن‌ها برابرند. طبق قضیهٔ ض.ز.ض، مثلث‌ها هم‌نهشت‌اند.'; }
  function asaProof(){ return 'فرض: دو زاویه و ضلع میان آن‌ها برابرند؛ طبق ز.ض.ز، هم‌نهشتی برقرار است.'; }
  function rhsProof(){ return 'فرض: دو مثلث قائمه‌اند و وتر و یک ضلع قائمهٔ متناظر برابرند؛ طبق و.ض ⇒ هم‌نهشتی.'; }
  function rangleProof(){ return 'فرض: دو مثلث قائمه‌اند و وتر و یک زاویهٔ متناظر برابرند؛ طبق و.ز ⇒ هم‌نهشتی.'; }

  // ---------- قابلیت درگ/افزودن نقطه روی هر کانواس ----------
  function enableDrag(canvas, pts, drawFn){
    let dragging = null;
    let pointerId = null;

    canvas.addEventListener('pointerdown', (e)=>{
      const r = canvas.getBoundingClientRect();
      const p = { x: e.clientX - r.left, y: e.clientY - r.top };
      // اگر کمتر از 3 نقطه است: اضافه کن (این امکان به دانش‌آموز اجازه می‌دهد مثلث بسازد)
      if(pts.length < 3){
        pts.push(p); drawFn(); updateMetricsFromTemplates(); tone(880,0.04); return;
      }
      // پیدا کردن نزدیک‌ترین نقطه برای درگ
      let nearest = -1, md = 9999;
      pts.forEach((pt,i)=>{ const d = dist(pt,p); if(d < md){ md = d; nearest = i; }});
      if(md < 18){ dragging = nearest; try{ canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); pointerId = e.pointerId; } catch(_){} }
    });

    canvas.addEventListener('pointermove', (e)=>{
      if(dragging === null || dragging === undefined) return;
      const r = canvas.getBoundingClientRect();
      const p = { x: e.clientX - r.left, y: e.clientY - r.top };
      pts[dragging].x = Math.max(8, Math.min(canvas.width - 8, p.x));
      pts[dragging].y = Math.max(8, Math.min(canvas.height - 8, p.y));
      drawFn(); updateMetricsFromTemplates();
    });

    canvas.addEventListener('pointerup', (e)=>{
      if(dragging !== null && dragging !== undefined){
        try{ canvas.releasePointerCapture && canvas.releasePointerCapture(pointerId); } catch(_){}
        dragging = null; pointerId = null; tone(660,0.04);
      }
    });
  }

  // bind drag
  enableDrag(canvasA, tA, ()=> drawTriangle(ctxA, tA, {}, false));
  enableDrag(canvasB, tB, ()=> drawTriangle(ctxB, tB, {}, false));

  // ---------- رویداد دکمه‌ها ----------
  btnNew.addEventListener('click', ()=>{ level++; levelEl.innerText = level; newPair(); });
  btnClear.addEventListener('click', ()=>{ tA = []; tB = []; drawTriangle(ctxA, [], false); drawTriangle(ctxB, [], false); updateMetricsFromTemplates(); clearResult(); tone(420,0.04); });

  btnCheck.addEventListener('click', ()=>{
    if(!tA || !tB || tA.length !==3 || tB.length !==3){ alert('ابتدا «ارائه مثل جدید» یا سه نقطه برای هر مثلث بساز.'); return; }
    const res = detectMethod(tA,tB);
    gameState.method = res ? res.method : null;
    if(res) score += 5;
    scoreEl.innerText = score;
    showResult(res);
    tone(res ? 1200 : 320,0.06);
  });

  btnShowProof.addEventListener('click', ()=>{
    if(!gameState.method){ alert('ابتدا «بررسی هم‌نهشتی» را بزن تا روش مشخص شود.'); return; }
    alert('فرض: ' + farzEl.innerText + '\nحکم: ' + hokmEl.innerText + '\nاثبات: ' + proofEl.innerText);
  });

  btnGuessYes.addEventListener('click', ()=> {
    if(gameState.isCongruent === null){ alert('ابتدا «ارائه مثل جدید» بزن.'); return; }
    if(gameState.isCongruent){ score += 10; scoreEl.innerText = score; alert('حدس درست بود! ✅ برای مشاهده اثبات، «بررسی هم‌نهشتی» را بزن.'); }
    else { alert('حدس اشتباه بود ❌ — برای دیدن علت، «بررسی هم‌نهشتی» را بزن.'); }
  });

  btnGuessNo.addEventListener('click', ()=> {
    if(gameState.isCongruent === null){ alert('ابتدا «ارائه مثل جدید» بزن.'); return; }
    if(!gameState.isCongruent){ score += 10; scoreEl.innerText = score; alert('حدس درست بود! ✅ برای مشاهده اثبات، «بررسی هم‌نهشتی» را بزن.'); }
    else { alert('حدس اشتباه بود ❌ — برای دیدن علت، «بررسی هم‌نهشتی» را بزن.'); }
  });

  // ---------- نمایش نتیجه در پنل ----------
  function showResult(res){
    if(!res){ methodEl.innerText='—'; farzEl.innerText='—'; hokmEl.innerText='—'; proofEl.innerText='هیچ‌یک از معیارها برقرار نیست.'; return; }
    methodEl.innerText = res.method; farzEl.innerText = res.farz; hokmEl.innerText = res.hokm; proofEl.innerText = res.proof;
  }
  function clearResult(){ methodEl.innerText='—'; farzEl.innerText='—'; hokmEl.innerText='—'; proofEl.innerText='—'; gameState.method = null; }

  // ---------- مقداردهی اولیه canvases خالی ----------
  drawTriangle(ctxA, [], false);
  drawTriangle(ctxB, [], false);
  updateMetricsFromTemplates();
  levelEl.innerText = level; scoreEl.innerText = score;

  // expose for debug if needed
  window.newPair = newPair;
  window.tA = tA; window.tB = tB;

}); // DOMContentLoaded end
