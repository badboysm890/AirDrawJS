"use strict";
/**
 * @fileoverview Demonstrates a minimal use case for MediaPipe face tracking.
 */
const controls = window;
const mpSelfieSegmentation = window;
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};
let activeEffect = 'mask';
function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = 'source-in';
    if (activeEffect === 'mask' || activeEffect === 'both') {
        // This can be a color or a texture or whatever...
        canvasCtx.fillStyle = '#00FF00';
        canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    }
    else {
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }
    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    if (activeEffect === 'background' || activeEffect === 'both') {
        // This can be a color or a texture or whatever...
        canvasCtx.fillStyle = '#0000FF';
        canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    }
    else {
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }
    canvasCtx.restore();
}
const selfieSegmentation = new SelfieSegmentation({ locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`;
    } });
selfieSegmentation.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, {
    selfieMode: true,
    modelSelection: 1,
    effect: 'mask',
})
    .add([
    new controls.StaticText({ title: 'MediaPipe Selfie Segmentation' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onSourceChanged: () => {
            selfieSegmentation.reset();
        },
        onFrame: async (input, size) => {
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            canvasElement.width = width;
            canvasElement.height = height;
            await selfieSegmentation.send({ image: input });
        },
        examples: {
            videos: [],
            images: [],
        }
    }),
    new controls.Slider({
        title: 'Model Selection',
        field: 'modelSelection',
        discrete: ['General', 'Landscape'],
    }),
    new controls.Slider({
        title: 'Effect',
        field: 'effect',
        discrete: { 'background': 'Background', 'mask': 'Foreground' },
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    activeEffect = x['effect'];
    selfieSegmentation.setOptions(options);
});