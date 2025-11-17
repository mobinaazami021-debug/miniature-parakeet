const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let animationFrame = null;

// حالت نقاط
const tri = {
  a: { x: 80,  y: 260 },
  b: { x: 300, y: 80  },
  c: { x: 520, y: 260 }
};

let dragging = null;
let dragStartSound = null;
let dragEndSound = null;

document.addEventListener("DOMContentLoaded", () => {
  
  dragStartSound = $("#dragStartSound");
  dragEndSound   = $("#dragEndSound");

  $$(".lab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".lab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadLab(btn.dataset.lab);
    });
  });

  loadLab("lab1");
});

function loadLab(mode){
  $("#labArea").innerHTML = "";

  if(mode === "lab1") loadLab1();
  if(mode === "lab2") loadLab2();
  if(mode === "lab3") loadLab3();
  if(mode === "lab4") loadLab4();
}

// ===================
// 🎮 Lab 1
// ===================
function loadLab1(){
  $("#infoBox").innerText = "نقاط را بکشید تا مثلث بسازید!";

  const wrap = document.createElement("div");
  wrap.className = "canvas-wrap";

  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);

  $("#labArea").appendChild(wrap);

  setupInteractiveCanvas(canvas, drawTriangle);
  drawTriangle(canvas);
}

// Setup canvas with drag
function setupInteractiveCanvas(canvas, drawFn){
  resizeCanvas(canvas);

  window.addEventListener("resize", ()=>resizeCanvas(canvas));

  canvas.addEventListener("pointerdown", e => {
    const p = getPos(e, canvas);

    for (const key in tri){
      const d = Math.hypot(tri[key].x - p.x, tri[key].y - p.y);

      if(d < 24){
        dragging = key;
        canvas.classList.add("handle-glow");
        dragStartSound.play();
      }
    }
  });

  canvas.addEventListener("pointermove", e => {
    if(!dragging) return;

    const p = getPos(e, canvas);

    // انیمیشن نرم به سمت نقطه جدید
    animateTo(tri[dragging], {x: p.x, y: p.y}, () => drawFn(canvas));
  });

  canvas.addEventListener("pointerup", () => {
    if(dragging){
      dragEndSound.play();
      canvas.classList.remove("handle-glow");
    }
    dragging = null;
  });
}

// انیمیشن easing
function animateTo(point, target, cb){
  const duration = 120;
  const start = {x: point.x, y: point.y};
  const startTime = performance.now();

  const ease = t => t*(2-t); // easeOut

  function step(now){
    const progress = Math.min(1, (now - startTime)/duration);
    const e = ease(progress);

    point.x = start.x + (target.x - start.x) * e;
    point.y = start.y + (target.y - start.y) * e;

    cb();

    if(progress < 1){
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

// رسم مثلث با انیمیشن و رنگ جذاب
function drawTriangle(canvas){
  const ctx = canvas.getContext("2d");
  resizeCanvas(canvas);

  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawGrid(ctx, canvas);

  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(96,165,250,0.95)";
  ctx.fillStyle = "rgba(96,165,250,0.06)";

  ctx.beginPath();
  ctx.moveTo(tri.a.x, tri.a.y);
  ctx.lineTo(tri.b.x, tri.b.y);
  ctx.lineTo(tri.c.x, tri.c.y);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  drawHandle(ctx, tri.a.x, tri.a.y);
  drawHandle(ctx, tri.b.x, tri.b.y);
  drawHandle(ctx, tri.c.x, tri.c.y);

  $("#infoBox").innerText =
      `AB=${dist(tri.a, tri.b).toFixed(1)}  |  
       BC=${dist(tri.b, tri.c).toFixed(1)}  |  
       CA=${dist(tri.c, tri.a).toFixed(1)}`;
}

// گرید زیبا
function drawGrid(ctx, canvas){
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  for(let x=0; x<canvas.width; x+=30){
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,canvas.height);
    ctx.stroke();
  }
  for(let y=0; y<canvas.height; y+=30){
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
    ctx.stroke();
  }
}

function drawHandle(ctx, x, y){
  ctx.beginPath();
  ctx.fillStyle = "#60a5fa";
  ctx.arc(x, y, 10, 0, Math.PI*2);
  ctx.fill();
}

function resizeCanvas(canvas){
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  canvas.getContext("2d").scale(devicePixelRatio, devicePixelRatio);
}

function getPos(e, canvas){
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function dist(a,b){
  return Math.hypot(a.x-b.x, a.y-b.y);
}

// بقیهٔ آزمایشگاه‌ها (۲–۴) را هم می‌توانم اضافه کنم (همراه انیمیشن و صدا)