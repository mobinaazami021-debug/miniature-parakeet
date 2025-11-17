// app.js — نسخهٔ کارتونی آزمایشگاهی با بازی و تمرین
document.addEventListener('DOMContentLoaded', () => {
  // المان‌ها
  const mSlider = document.getElementById('mSlider');
  const bSlider = document.getElementById('bSlider');
  const mVal = document.getElementById('mVal');
  const bVal = document.getElementById('bVal');
  const equation = document.getElementById('equation'); // ممکن استفاده نشود؛ ولی MathJax داریم
  const plotDiv = document.getElementById('plot');
  const randomBtn = document.getElementById('randomBtn');
  const feedback = document.getElementById('feedback');
  const exerciseText = document.getElementById('exerciseText');
  const answerInput = document.getElementById('answerInput');
  const submitAnswer = document.getElementById('submitAnswer');
  const scoreSpan = document.getElementById('score');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');
  const exportCSV = document.getElementById('exportCSV');
  const presetBtn = document.getElementById('presetBtn');
  const xPoint = document.getElementById('xPoint');
  const yPoint = document.getElementById('yPoint');
  const checkPt = document.getElementById('checkPt');
  const pointFeedback = document.getElementById('pointFeedback');
  const showGrid = document.getElementById('showGrid');
  const showPoints = document.getElementById('showPoints');
  const hintBubble = document.getElementById('hintBubble');
  const guessM = document.getElementById('guessM');
  const guessB = document.getElementById('guessB');
  const gameMsg = document.getElementById('gameMsg');

  let score = 0;
  let exercises = [];
  let currentProblem = null;
  let history = [];

  // بارگذاری سوالات
  async function loadProblems(){
    try{
      const res = await fetch('exercises/problems.json');
      if(!res.ok) throw new Error('no file');
      exercises = await res.json();
    }catch(e){
      exercises = [
        {"id":1,"prompt":"خطی با شیب 2 و عرض از مبدأ 3 بنویسید.","answer":"y=2x+3","level":"easy"},
        {"id":2,"prompt":"اگر خطی از نقاط (0,-1) و (2,3) بگذرد، معادله را پیدا کنید.","answer":"y=2x-1","level":"easy"},
        {"id":3,"prompt":"شیب خط بین (1,2) و (3,6) چه مقدار است؟","answer":"2","level":"easy"},
        {"id":4,"prompt":"معادله‌ای که عرض از مبدأ آن 4 و شیب -1 باشد بنویسید.","answer":"y=-1x+4","level":"medium"}
      ];
    }
  }

  // رسم خط
  function drawLine(m,b,points=[]){
    const xs=[]; const ys=[];
    for(let x=-12;x<=12;x+=0.5){ xs.push(x); ys.push(Number((m*x + b).toFixed(6))); }
    const traceLine = { x: xs, y: ys, mode: 'lines', line:{width:3, color:'#0f1724'} };
    const traces = [traceLine];
    if(showPoints.checked && points.length){
      traces.push({ x: points.map(p=>p.x), y: points.map(p=>p.y), mode:'markers', marker:{size:8, color:'#f59e0b'} });
    }
    const layout = {
      margin:{t:6,b:30,l:40,r:6},
      xaxis:{range:[-12,12], showgrid: showGrid.checked, zeroline:true},
      yaxis:{range:[-20,20], showgrid: showGrid.checked, zeroline:true},
    };
    Plotly.react(plotDiv, traces, layout, {responsive:true});
  }

  function updateUI(){
    const m = parseFloat(mSlider.value), b = parseFloat(bSlider.value);
    mVal.textContent = m; bVal.textContent = b;
    hintBubble.textContent = `برای شروع: m=${m} ، b=${b}\nیک سوال انتخاب کن یا یک نقطه وارد کن.`;
    drawLine(m,b);
  }

  // normalize
  function normalize(s){
    return String(s).replace(/\s+/g,'').replace(/−/g,'-').replace(/\+/g,'+').replace(/(\s)*x/,'x').toLowerCase();
  }

  // سوال تصادفی
  function randomProblem(){
    if(!exercises.length){ exerciseText.textContent = 'سوال موجود نیست.'; return; }
    currentProblem = exercises[Math.floor(Math.random()*exercises.length)];
    exerciseText.textContent = currentProblem.prompt;
    feedback.textContent = '';
    answerInput.value = '';
  }

  // بررسی پاسخ
  function checkAnswer(){
    if(!currentProblem){ feedback.textContent = 'ابتدا سوالی انتخاب کنید.'; return; }
    const user = normalize(answerInput.value || '');
    const correct = normalize(currentProblem.answer);
    if(!user){ feedback.textContent = 'لطفاً پاسخ را وارد کنید.'; return; }
    const ok = user === correct;
    if(ok){ feedback.textContent = 'آفرین! پاسخ درست است 🎉'; score += 10; }
    else { feedback.textContent = `پاسخ نادرست — جواب صحیح: ${currentProblem.answer}`; score = Math.max(0, score - 2); }
    scoreSpan.textContent = score;
    history.push({time: Date.now(), id: currentProblem.id, prompt: currentProblem.prompt, given: answerInput.value, correct: currentProblem.answer, ok});
  }

  // بررسی نقطه
  function checkPoint(){
    const x = parseFloat(xPoint.value), y = parseFloat(yPoint.value);
    if(Number.isNaN(x) || Number.isNaN(y)){ pointFeedback.textContent = 'x و y را صحیح وارد کنید.'; return; }
    const m = parseFloat(mSlider.value), b = parseFloat(bSlider.value);
    const yCalc = m*x + b;
    const ok = Math.abs(yCalc - y) < 1e-6;
    pointFeedback.textContent = ok ? 'نقطه روی خط قرار دارد ✅' : `خیر — مقدار روی خط: ${yCalc.toFixed(2)}`;
    drawLine(m,b, [{x,y}]);
  }

  // پیش‌تنظیم‌ها
  presetBtn.addEventListener('click', ()=> {
    const presets = [{m:1,b:0},{m:2,b:3},{m:-1,b:4},{m:0.5,b:-2}];
    const p = presets[Math.floor(Math.random()*presets.length)];
    mSlider.value = p.m; bSlider.value = p.b;
    updateUI();
  });

  // بازی: حدس m یا b (ساده)
  function playGuess(kind){
    // kind: 'm' or 'b'
    const m = parseFloat(mSlider.value), b = parseFloat(bSlider.value);
    const actual = kind === 'm' ? m : b;
    const guess = prompt(`حدس بزن ${kind === 'm' ? 'شیب (m)' : 'عرض از مبدأ (b)'} چقدر است؟\n(عدد را وارد کنید)`);
    if(guess === null) return;
    const g = parseFloat(guess);
    if(Number.isNaN(g)){ gameMsg.textContent = 'ورودی نامعتبر بود.'; return; }
    const diff = Math.abs(g - actual);
    if(diff < 0.5){ gameMsg.textContent = 'آفرین! نزدیک بودی — +5 امتیاز'; score += 5; }
    else { gameMsg.textContent = `نزدیک نبود — مقدار درست ${actual}`; }
    scoreSpan.textContent = score;
    history.push({time: Date.now(), kind:'guess', target:kind, actual, guess:g, ok: diff < 0.5});
  }

  // ذخیره و بارگذاری
  function saveLocal(){
    const data = {score, history, last: Date.now()};
    localStorage.setItem('equationLab_cartoon_v1', JSON.stringify(data));
    alert('ذخیره انجام شد.');
  }
  function loadLocal(){
    const raw = localStorage.getItem('equationLab_cartoon_v1');
    if(!raw){ alert('داده‌ای برای بارگذاری نیست.'); return; }
    const d = JSON.parse(raw);
    score = d.score || 0; history = d.history || [];
    scoreSpan.textContent = score;
    alert('بارگذاری انجام شد.');
  }

  // خروجی CSV
  function exportToCSV(){
    if(!history.length){ alert('داده‌ای وجود ندارد.'); return; }
    const header = ['time','type','info','ok'];
    const rows = history.map(h => {
      const t = h.id ? `problem:${h.id}` : (h.kind ? h.kind : 'other');
      const info = h.prompt ? h.prompt : JSON.stringify(h);
      return [h.time, t, `"${String(info).replace(/"/g,'""')}"`, h.ok ? 'TRUE' : 'FALSE'].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'equation_lab_history.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // رویدادها
  mSlider.addEventListener('input', updateUI);
  bSlider.addEventListener('input', updateUI);
  randomBtn.addEventListener('click', randomProblem);
  submitAnswer.addEventListener('click', checkAnswer);
  answerInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') checkAnswer(); });
  checkPt.addEventListener('click', checkPoint);
  saveBtn.addEventListener('click', saveLocal);
  loadBtn.addEventListener('click', loadLocal);
  exportCSV.addEventListener('click', exportToCSV);
  guessM.addEventListener('click', ()=>playGuess('m'));
  guessB.addEventListener('click', ()=>playGuess('b'));
  showGrid.addEventListener('change', updateUI);
  showPoints.addEventListener('change', updateUI);

  // مقداردهی اولیه
  (async () => {
    await loadProblems();
    updateUI();
    scoreSpan.textContent = score;
  })();
});
