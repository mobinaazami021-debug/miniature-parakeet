const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 600;

let mode = "edu";
let tri1 = null;
let tri2 = null;

// ----------------------------
// حالت ها
// ----------------------------
function setMode(m) {
    mode = m;
    alert("حالت فعال شد: " + m);
}

// ----------------------------
// پاکسازی
// ----------------------------
function clearAll() {
    tri1 = null;
    tri2 = null;
    ctx.clearRect(0,0,600,600);
    drawGrid();
}

// ----------------------------
// شبکه
// ----------------------------
function drawGrid() {
    for (let x=0; x<600; x+=30) {
        for (let y=0; y<600; y+=30) {
            ctx.strokeStyle = "#ddd";
            ctx.strokeRect(x,y,30,30);
        }
    }
}
drawGrid();

// ----------------------------
// ساخت مثلث تصادفی
// ----------------------------
function randPoint() {
    return {
        x: Math.floor(Math.random()*18)*30,
        y: Math.floor(Math.random()*18)*30
    };
}

function randomTriangle(id) {
    let p1 = randPoint();
    let p2 = randPoint();
    let p3 = randPoint();

    let tri = { p1, p2, p3 };

    // 🎯 ۸۰٪ مواقع دو مثلث هم‌نهشت ساخته می‌شوند
    if (id === 2 && Math.random() < 0.80 && tri1) {
        tri = makeCongruentCopy(tri1);
    }

    if (id === 1) tri1 = tri;
    if (id === 2) tri2 = tri;

    drawAll();
}

// ----------------------------
// ساخت مثلث هم‌نهشت
// ----------------------------
function makeCongruentCopy(t) {
    let dx = (Math.random()*150) - 75;
    let dy = (Math.random()*150) - 75;

    return {
        p1: {x: t.p1.x+dx, y: t.p1.y+dy},
        p2: {x: t.p2.x+dx, y: t.p2.y+dy},
        p3: {x: t.p3.x+dx, y: t.p3.y+dy}
    };
}

// ----------------------------
// رسم مثلث
// ----------------------------
function drawTriangle(t, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(t.p1.x, t.p1.y);
    ctx.lineTo(t.p2.x, t.p2.y);
    ctx.lineTo(t.p3.x, t.p3.y);
    ctx.closePath();
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
}

// ----------------------------
function drawAll() {
    clearAll();
    if (tri1) drawTriangle(tri1, "red");
    if (tri2) drawTriangle(tri2, "blue");
}

// ----------------------------
// بررسی هم‌نهشتی (هوش مصنوعی کم‌دقت)
// ----------------------------
function checkCongruent() {
    if (!tri1 || !tri2) {
        alert("⛔ لطفاً هر دو مثلث را بسازید.");
        return;
    }

    // دقت عمداً پایین (۳۰٪ احتمال اشتباه)
    let aiError = Math.random() < 0.30;

    let real = isCongruent(tri1, tri2);

    let answer = aiError ? !real : real;

    if (answer)
        alert("🤖 نتیجه: مثلث‌ها هم‌نهشت هستند!");
    else
        alert("🤖 نتیجه: مثلث‌ها هم‌نهشت نیستند!");
}

// ----------------------------
// محاسبه طول
// ----------------------------
function d(a,b) {
    return Math.hypot(a.x-b.x, a.y-b.y);
}

// ----------------------------
// چک واقعی هم‌نهشتی
// ----------------------------
function isCongruent(A, B) {
    let s1 = [d(A.p1,A.p2), d(A.p2,A.p3), d(A.p3,A.p1)].sort();
    let s2 = [d(B.p1,B.p2), d(B.p2,B.p3), d(B.p3,B.p1)].sort();

    for (let i=0;i<3;i++)
        if (Math.abs(s1[i] - s2[i]) > 1) return false;

    return true;
}

// ----------------------------
// راهنما
// ----------------------------
function showHelp() {
    alert("🔹 آموزش\n🔹 ساخت مثلث\n🔹 حالت بازی\n🔹 تشخیص هم‌نهشتی\n🔹 تولید مثلث‌های تصادفی");
}
