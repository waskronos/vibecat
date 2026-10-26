const cat = document.getElementById('cat');

const FRAMES = 8; /* 8 frames in the spritesheet */
const FRAMES_PER_BEAT = 8; /* 8 frames per beat in the sheet */
const FRAME_WIDTH = 46 * 5; /* each frame, scaled up */

let bpm = 120; /* default bpm to test */
const startTime = performance.now(); /* this cuz more reliable than a system clock for animation timing */

function tick(now){
    const frameMs = (60000 / bpm) / FRAMES_PER_BEAT;
    const frames = Math.floor((now - startTime) / frameMs) % FRAMES; /* ok so how much time has passed since start -> how many frames fit in that time (floored cuz decimal bad here) -> wrap around 8 frames by mod */

    cat.style.backgroundPosition = `-${frames * FRAME_WIDTH}px 0px`;
    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
