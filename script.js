const canvas = document.getElementById("cnv");
const ctx = canvas.getContext("2d");
const clickSound = document.getElementById("clickSound");

let mode = "move";

let A = {x: 150, y: 150};
let B = {x: 200, y: 80};
let C = {x: 250, y: 150};

let A2 = {x: 300, y: 250};
let B2 = {x: 350, y: 180};
let C2 = {x: 400, y: 250};

function setMode(m){
    mode = m;
    clickSound.play();
}

function drawTriangle(p1, p2, p3, color){
    ctx.beginPath();
    ctx.moveTo(p1.x,p1.y);
    ctx.lineTo(p2.x,p2.y);
    ctx.lineTo(p3.x,p3.y);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
}

function render(){
    ctx.clearRect(0,0,500,400);

    drawTriangle(A,B,C,"#ff2f2f");  
    drawTriangle(A2,B2,C2,"#325dff"); 
}

render();

// -----------------------
//  انتخاب با ماوس
// -----------------------
function inside(px,py,A,B,C){
    let area = Math.abs((A.x*(B.y-C.y)+B.x*(C.y-A.y)+C.x*(A.y-B.y))/2);
    let area1 = Math.abs((px*(B.y-C.y)+B.x*(C.y-py)+C.x*(py-B.y))/2);
    let area2 = Math.abs((A.x*(py-C.y)+px*(C.y-A.y)+C.x*(A.y-py))/2);
    let area3 = Math.abs((A.x*(B.y-py)+B.x*(py-A.y)+px*(A.y-B.y))/2);

    return Math.abs(area - (area1+area2+area3)) < 0.1;
}

// -----------------------
//   حرکت با ماوس
// -----------------------
let dragging = false;
let offsetX = 0;
let offsetY = 0;

canvas.addEventListener("mousedown", e=>{
    let r = canvas.getBoundingClientRect();
    let mx = e.clientX - r.left;
    let my = e.clientY - r.top;

    if(inside(mx,my,A2,B2,C2)){
        dragging = true;
        offsetX = mx;
        offsetY = my;
        clickSound.play();
    }
});

canvas.addEventListener("mouseup", ()=> dragging=false);

canvas.addEventListener("mousemove", e=>{
    if(!dragging) return;

    let r = canvas.getBoundingClientRect();
    let mx = e.clientX - r.left;
    let my = e.clientY - r.top;

    let dx = mx - offsetX;
    let dy = my - offsetY;

    if(mode==="move"){
        A2.x+=dx; B2.x+=dx; C2.x+=dx;
        A2.y+=dy; B2.y+=dy; C2.y+=dy;
    }

    if(mode==="rotate"){
        rotateTriangle(0.07);
    }

    if(mode==="reflect"){
        reflectTriangle();
    }

    if(mode==="scale"){
        scaleTriangle(1.02);
    }

    offsetX = mx;
    offsetY = my;

    render();
});

// -----------------------
//   هندسه
// -----------------------
function rotatePoint(p,c,angle){
    let s = Math.sin(angle);
    let co = Math.cos(angle);

    let nx = co*(p.x-c.x) - s*(p.y-c.y) + c.x;
    let ny = s*(p.x-c.x) + co*(p.y-c.y) + c.y;
    return {x:nx,y:ny};
}

function rotateTriangle(angle){
    let center = A2; 
    B2 = rotatePoint(B2,center,angle);
    C2 = rotatePoint(C2,center,angle);
}

function reflectTriangle(){
    B2.y = 400 - B2.y;
    C2.y = 400 - C2.y;
    A2.y = 400 - A2.y;
}

function scaleTriangle(f){
    let cx = A2.x;
    let cy = A2.y;

    B2.x = cx + (B2.x - cx)*f;
    B2.y = cy + (B2.y - cy)*f;
    C2.x = cx + (C2.x - cx)*f;
    C2.y = cy + (C2.y - cy)*f;
}
