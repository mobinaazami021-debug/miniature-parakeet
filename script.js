// نمایش بخش‌ها
function showSection(sec) {
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.getElementById(sec).style.display = "block";
}

// محاسبه طول
function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// تولید زاویه از سه نقطه
function angle(A, B, C) {
    const AB = dist(A, B);
    const BC = dist(B, C);
    const AC = dist(A, C);
    return Math.round(Math.acos((AB**2 + BC**2 - AC**2) / (2 * AB * BC)) * 180 / Math.PI);
}

// رسم مثلث
function drawTriangle(ctx, p) {
    ctx.clearRect(0, 0, 400, 400);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    ctx.lineTo(p[1].x, p[1].y);
    ctx.lineTo(p[2].x, p[2].y);
    ctx.closePath();
    ctx.stroke();

    let a = dist(p[1], p[2]);
    let b = dist(p[0], p[2]);
    let c = dist(p[0], p[1]);

    ctx.fillStyle = "blue";
    ctx.fillText("a=" + Math.round(a), (p[1].x + p[2].x)/2, (p[1].y + p[2].y)/2);
    ctx.fillText("b=" + Math.round(b), (p[0].x + p[2].x)/2, (p[0].y + p[2].y)/2);
    ctx.fillText("c=" + Math.round(c), (p[0].x + p[1].x)/2, (p[0].y + p[1].y)/2);

    ctx.fillText("∠A=" + angle(p[1], p[0], p[2]), p[0].x+5, p[0].y+5);
    ctx.fillText("∠B=" + angle(p[0], p[1], p[2]), p[1].x+5, p[1].y+5);
    ctx.fillText("∠C=" + angle(p[0], p[2], p[1]), p[2].x+5, p[2].y+5);
}

// تولید مثلث تصادفی
function randomTriangle() {
    return [
        {x: Math.random()*250+20, y: Math.random()*250+20},
        {x: Math.random()*250+20, y: Math.random()*250+20},
        {x: Math.random()*250+20, y: Math.random()*250+20}
    ];
}


// ------------------ حالت بازی ------------------

let tri1, tri2, areCongruent;

function newPair() {
    tri1 = randomTriangle();

    if (Math.random() < 0.8) {
        let dx = Math.random()*40+20;
        let dy = Math.random()*40+20;
        tri2 = tri1.map(p => ({x: p.x + dx, y: p.y + dy}));
        areCongruent = true;
    } else {
        tri2 = randomTriangle();
        areCongruent = false;
    }

    drawTriangle(document.getElementById("triangle1").getContext("2d"), tri1);
    drawTriangle(document.getElementById("triangle2").getContext("2d"), tri2);

    document.getElementById("resultBox").innerHTML = "";
}


// بررسی هم‌نهشتی
function checkAnswer(answer) {
    let box = document.getElementById("resultBox");

    if (answer === areCongruent) {
        box.innerHTML = "<b style='color:green'>✔ درست گفتی!</b><br>فرض: اضلاع و زاویه‌ها برابرند<br>حکم: مثلث‌ها هم‌نهشت‌اند<br>اثبات: با یکی از حالت‌های هم‌نهشتی ض‌.ض‌.ض ، ض‌.ز‌.ض ، ز‌.ض‌.ز ، و‌.ض ، و‌.ز نتیجه می‌شود.";
    } else {
        box.innerHTML = "<b style='color:red'>✘ اشتباه شد</b><br>اندازه ضلع‌ها و زاویه‌ها با هم برابر نیستند پس هم‌نهشت نیستند.";
    }
}
