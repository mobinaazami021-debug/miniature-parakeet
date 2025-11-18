const canvases = [
    null,
    document.getElementById("canvas1"),
    document.getElementById("canvas2")
];

const ctx = [
    null,
    canvases[1].getContext("2d"),
    canvases[2].getContext("2d")
];

let points = { 1: [], 2: [] };
let dragging = null;

function draw(i) {
    const c = ctx[i];
    c.clearRect(0,0,350,350);

    if (points[i].length === 3) {
        c.fillStyle = "#ffbfd6";
        c.beginPath();
        c.moveTo(points[i][0].x, points[i][0].y);
        c.lineTo(points[i][1].x, points[i][1].y);
        c.lineTo(points[i][2].x, points[i][2].y);
        c.closePath();
        c.fill();

        c.strokeStyle = "#000";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(points[i][0].x, points[i][0].y);
        c.lineTo(points[i][1].x, points[i][1].y);
        c.lineTo(points[i][2].x, points[i][2].y);
        c.closePath();
        c.stroke();
    }

    points[i].forEach(p => {
        c.fillStyle = "#ff7f50";
        c.beginPath();
        c.arc(p.x, p.y, 7, 0, Math.PI*2);
        c.fill();
    });
}

function rand(a,b){ return Math.random()*(b-a)+a; }

function randomTriangle(i) {
    const makeCongruent = Math.random() < 0.8;   // *** 80% هم‌نهشت ***

    if (i === 1 || !makeCongruent) {
        // مثلث معمولی
        points[i] = [
            {x: rand(50,290), y: rand(50,290)},
            {x: rand(50,290), y: rand(50,290)},
            {x: rand(50,290), y: rand(50,290)}
        ];
    } else {
        // ساخت مثلث هم‌نهشت از مثلث اول
        let base = points[1];

        // چرخش + انتقال
        let angle = rand(0, Math.PI*2);
        let dx = rand(-40,40);
        let dy = rand(-40,40);

        points[2] = base.map(p=>{
            let x = p.x - 175;
            let y = p.y - 175;
            let rx = x*Math.cos(angle) - y*Math.sin(angle);
            let ry = x*Math.sin(angle) + y*Math.cos(angle);
            return { x: rx+175+dx, y: ry+175+dy };
        });
    }

    draw(i);
}

function dist(a,b){ return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }

function checkCongruent(){
    if (points[1].length < 3 || points[2].length < 3) return;

    let s1 = [
        dist(points[1][0], points[1][1]),
        dist(points[1][1], points[1][2]),
        dist(points[1][2], points[1][0])
    ].sort((a,b)=>a-b);

    let s2 = [
        dist(points[2][0], points[2][1]),
        dist(points[2][1], points[2][2]),
        dist(points[2][2], points[2][0])
    ].sort((a,b)=>a-b);

    let ok = (
        Math.abs(s1[0]-s2[0]) < 12 &&
        Math.abs(s1[1]-s2[1]) < 12 &&
        Math.abs(s1[2]-s2[2]) < 12
    );

    if (ok) {
        document.getElementById("farz").innerText = "سه ضلع مثلث‌ها برابر است.";
        document.getElementById("hokm").innerText = "دو مثلث هم‌نهشت‌اند.";
        document.getElementById("proofBox").innerText =
            "چون (ض.ض.ض) برقرار است، پس مثلث‌ها هم‌نهشت هستند.";
        addScore();
    } else {
        document.getElementById("proofBox").innerText =
            "این دو مثلث هم‌نهشت نیستند.";
    }
}

function addScore(){
    let s = Number(document.getElementById("score").innerText);
    document.getElementById("score").innerText = s+1;
}

function snapAll(){
    for (let n=1;n<=2;n++){
        points[n].forEach(p=>{
            p.x = Math.round(p.x/10)*10;
            p.y = Math.round(p.y/10)*10;
        });
        draw(n);
    }
}

function startChallenge(){
    randomTriangle(1);
    randomTriangle(2);
    document.getElementById("proofBox").innerText = "—";
}
