// ساده، بدون فریمورک — قابل توسعه
document.addEventListener('DOMContentLoaded', () => {
  const mSlider = document.getElementById('mSlider');
  const bSlider = document.getElementById('bSlider');
  const mVal = document.getElementById('mVal');
  const bVal = document.getElementById('bVal');
  const equation = document.getElementById('equation');
  const plotDiv = document.getElementById('plot');
  const randomBtn = document.getElementById('randomBtn');
  const feedback = document.getElementById('feedback');
  const exerciseText = document.getElementById('exerciseText');
  const answerInput = document.getElementById('answerInput');
  const submitAnswer = document.getElementById('submitAnswer');
  const scoreSpan = document.getElementById('score');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');

  let score = 0;
  let currentProblem = null;

  function updateEquation(){
    const m = parseFloat(mSlider.value);
    const b = parseFloat(bSlider.value);
    mVal.textContent = m;
    bVal.textContent = b;
    equation.textContent = `y = ${m}x + ${b}`;
    drawLine(m,b);
  }

  function drawLine(m,b){
    // رسم خط با استفاده از Plotly
    const xs = [];
    const ys = [];
    for(let x=-10;x<=10;x+=0.5){ xs.push(x); ys.push(m*x + b); }
    const trace = { x: xs, y: ys, mode: 'lines', name: `y=${m}x+${b}` };
    const layout = { margin:{t:10,b:30,l:40,r:10}, xaxis:{range:[-10,10]}, yaxis:{range:[-15,15]} };
    Plotly.react(plotDiv, [trace], layout, {responsive:true});
  }

  // نمونهٔ سوالات ساده (بعدا از فایل JSON بارگذاری کنید)
  const problems = [
    {id:1, prompt: "خطی با شیب 2 و عرض از مبدأ 3 بنویسید.", answer: "y = 2x + 3"},
    {id:2, prompt: "اگر خطی از نقاط (0, -1) و (2, 3) بگذرد، معادله را پیدا کنید.", answer: "y = 2x - 1"},
    {id:3, prompt: "شیب خطی که بین (1,2) و (3,6) است چه مقدار است؟", answer: "2"},
    {id:4, prompt: "معادله‌ای که عرض از مبدأ آن 4 و شیب -1 باشد بنویسید.", answer: "y = -1x + 4"}
  ];

  function randomProblem(){
    currentProblem = problems[Math.floor(Math.random()*problems.length)];
    exerciseText.textContent = currentProblem.prompt;
    feedback.textContent = '';
    answerInput.value = '';
  }

  function normalize(s){
    return String(s).replace(/\s+/g,'').replace(/−/g,'-').toLowerCase();
  }

  function checkAnswer(){
    if(!currentProblem){
      feedback.textContent = "ابتدا یک سوال انتخاب کنید (سوال تصادفی).";
      return;
    }
    const user = normalize(answerInput.value);
    const correct = normalize(currentProblem.answer);
    if(!user){
      feedback.textContent = "لطفاً جواب را وارد کنید.";
      return;
    }
    if(user === correct){
      feedback.textContent = "آفرین! جواب درست است ✅";
      score += 10;
    } else {
      feedback.textContent = `نزدیک است — جواب درست: ${currentProblem.answer}`;
      score = Math.max(0, score - 2);
    }
    scoreSpan.textContent = score;
  }

  // ذخیره/بارگذاری ساده محلی
  saveBtn.addEventListener('click', () => {
    const data = {score, lastProblem: currentProblem ? currentProblem.id : null, timestamp: Date.now()};
    localStorage.setItem('equationLab_v1', JSON.stringify(data));
    feedback.textContent = 'ذخیره شد.';
  });

  loadBtn.addEventListener('click', () => {
    const raw = localStorage.getItem('equationLab_v1');
    if(!raw){ feedback.textContent = 'چیزی برای بارگذاری پیدا نشد.'; return; }
    const data = JSON.parse(raw);
    score = data.score || 0;
    scoreSpan.textContent = score;
    if(data.lastProblem){
      currentProblem = problems.find(p=>p.id===data.lastProblem) || null;
      exerciseText.textContent = currentProblem ? currentProblem.prompt : 'سوال قبلی یافت نشد.';
    }
    feedback.textContent = 'بارگذاری انجام شد.';
  });

  // رویدادها
  mSlider.addEventListener('input', updateEquation);
  bSlider.addEventListener('input', updateEquation);
  randomBtn.addEventListener('click', randomProblem);
  submitAnswer.addEventListener('click', checkAnswer);
  answerInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') checkAnswer(); });

  // مقداردهی اولیه
  updateEquation();
});
