const canvas = document.getElementById("triangleCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.6;

let triangles = {
    1: [{x:70,y:200},{x:150,y:80},{x:250,y:220}],
    2: [{x:320,y:200},{x:400,y:80},{x:500,y:220}],
};

let dragPoint = null;
let currentTriangle = null;

function drawTriangles() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for (let t=1; t<=2; t++) {
        ctx.fillStyle = t === 1 ? "#ff77a9" : "#77a9ff";
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 3;

        ctx.beginPath();
        let p = triangles[t];
        ctx.moveTo(p[0].x, p[0].y);
        ctx.lineTo(p[1].x, p[1].y);
        ctx.lineTo(p[2].x, p[2].y);
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;

        p.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 10, 0, Math.PI*2);
            ctx.fill();
        });
    }
}

function randomTriangle(n) {
    const s = canvas.width / 3;
    const x = Math.random() * s + (n===1?20:canvas.width/2);
    const y = Math.random() * (canvas.height-80) + 40;

    triangles[n] = [
        {x:x, y:y},
        {x:x+80, y:y-50},
        {x:x+120, y:y+70}
    ];

    document.getElementById("magicSound").play();
    drawTriangles();
}

canvas.onmousedown = e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (let t=1; t<=2; t++) {
        for (let p of triangles[t]) {
            if (Math.hypot(mx-p.x, my-p.y) < 12) {
                dragPoint = p;
                currentTriangle = t;
                return;
            }
        }
    }
};

canvas.onmousemove = e => {
    if (!dragPoint) return;

    const rect = canvas.getBoundingClientRect();
    dragPoint.x = e.clientX - rect.left;
    dragPoint.y = e.clientY - rect.top;

    drawTriangles();
};

canvas.onmouseup = () => dragPoint = null;

function sideLengths(tri) {
    const [A,B,C] = tri;
    return [
        Math.hypot(A.x-B.x, A.y-B.y),
        Math.hypot(B.x-C.x, B.y-C.y),
        Math.hypot(C.x-A.x, C.y-A.y)
    ].sort((a,b)=>a-b);
}

function checkCongruency() {
    let s1 = sideLengths(triangles[1]);
    let s2 = sideLengths(triangles[2]);

    let ok = Math.abs(s1[0]-s2[0])<2 &&
             Math.abs(s1[1]-s2[1])<2 &&
             Math.abs(s1[2]-s2[2])<2;

    document.getElementById("result").innerText = 
        ok ? "✔ مثلث‌ها هم‌نهشت هستند!" : "✘ هم‌نهشت نیستند.";
}

document.getElementById("checkBtn").onclick = checkCongruency;

document.getElementById("startBtn").onclick = () => {
    document.getElementById("tutorialModal").style.display = "none";
    drawTriangles();
};
