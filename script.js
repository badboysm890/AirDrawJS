const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
var clientHeight = document.getElementById('huh').clientHeight;
var clientWidth = document.getElementById('huh').clientWidth;
const canvas = document.querySelector('#board');
const ctx = canvas.getContext('2d');
const strokeVal = document.querySelector('input[name="brushStroke"]');
const brushColor = document.querySelector('input[name="brushColor"]');
const clearBtn = document.querySelector('#clear');
const roundLine = document.querySelector('#round');
const squareLine = document.querySelector('#square');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.lineJoin = 'round';
ctx.lineCap = 'round'
let isDrawing = false;
let lastX = 0;
let lastY = 0;
ctx.lineWidth = 12;
canvasCtx.canvas.width = clientWidth;
canvasCtx.canvas.height = clientHeight;
let lastx = ""
let lasty = ""
let x = ""
let y = ""
let writingCounter = 0;
let state;

async function onResults(results) {

    let currentState = ""
    try {
        palmx = results.multiHandLandmarks[0][0].x;
        palmy = results.multiHandLandmarks[0][0].y;
        x = results.multiHandLandmarks[0][8].x;
        y = results.multiHandLandmarks[0][8].y;
        x2 = results.multiHandLandmarks[0][16].x;
        y2 = results.multiHandLandmarks[0][16].y;
        x3 = results.multiHandLandmarks[0][12].x;
        y3 = results.multiHandLandmarks[0][12].y;

        console.log(Math.hypot(x3 - x, y3 - y))
        if (Math.hypot(x3 - x, y3 - y) >= 0.2) {
            state = 0
            writingCounter += 1
        } else if (Math.hypot(x2 - x, y2 - y) >= 0.2) {
            state = 1
        }
        if (Math.hypot(palmx - x, y - palmy) < 0.3) {
            state = "eraser";
            writingCounter += 1
        }
    } catch {
        console.log("moving fast idiot or i think there no hand")
    }
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (state == "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 30;
        draw(x * clientWidth, (y * clientHeight) - 50)
    } else if (state) {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 12;
        draw(x * clientWidth, (y * clientHeight) - 50)
    } else if (state == 0 && writingCounter >= 30) {
        lastx = x * clientWidth
        lasty = (y * clientHeight) - 50
    }
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#FFA500', lineWidth: 1 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });
        }
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});
hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.1,
    minTrackingConfidence: 0.1
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async() => {
        await hands.send({ image: videoElement });
    },
    width: clientWidth,
    height: clientHeight
});

camera.start();

function getStrokeVal() {
    ctx.lineWidth = this.value;
    console.log(ctx.lineWidth)
}

function getColor() {
    ctx.strokeStyle = this.value;
    console.log(ctx.globalCompositeOperation)
}

function eraser() {
    // ctx.globalCompositeOperation = "destination-out";
    source - over

}

function draw(x, y) {

    // if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastx, lasty);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastx, lasty] = [x, y];

}

strokeVal.addEventListener('change', getStrokeVal);
brushColor.addEventListener('change', getColor);
clear.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    console.log('mousdown');
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});