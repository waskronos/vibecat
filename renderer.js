const cat = document.getElementById('cat');
const songText = document.getElementById('song');

//---Settings---
const SCALE = 5;
const FRAMES = 8; // 8 frames in the spritesheet 
const FRAMES_PER_BEAT = 8; // 8 frames per beat in the sheet
const FRAME_WIDTH = 46 * SCALE; // each frame, scaled up
const FRAME_HEIGHT = 37 * SCALE; 
const THINK_FRAME_MS = 125; // how long each frame should last in ms when thinking

const SHEETS = {
    chill: { file: 'assets/cat-chill.png', frames: 8, speed: 1.0 },
    intense: { file: 'assets/cat-intense.png', frames: 8, speed: 1.0 },
    bittersweet: { file: 'assets/cat-bittersweet.png', frames: 32, speed: 0.5 },
    think: { file: 'assets/cat-think.png', frames: 8},
};

//---the knowns---
let state = 'idle'; //default when nothing is playing
let bpm = null; // default bpm for idle
let snapshot = null; 
let sheet = null;


//---helpersss---
function useSheet(name) {
    if (sheet === SHEETS[name]) return;
    sheet = SHEETS[name];
    cat.style.backgroundImage = `url(${sheet.file})`;
    cat.style.backgroundSize = `${sheet.frames * FRAME_WIDTH}px ${FRAME_HEIGHT}px`;
}

function songPosition(){
    if(snapshot.status !== 'Playing') return snapshot.position; //paused or stopped, so just return the last known position
    return snapshot.position + (Date.now() - Date.parse(snapshot.updated)); // if the song is playing, we add the time since the last snapshot 
}


//---animation---
function tick(now){
    let frame;
    if(state === 'found' && snapshot){
        const frameMs = (60000 / bpm) / FRAMES_PER_BEAT / sheet.speed; // how long each frame should last in ms, based on bpm and speed of the sheet
        frame = Math.floor(songPosition() / frameMs) % sheet.frames; // where in song are we / how much for each frame = frame number, floored to remove decimal and then modded w number of frames to wrap around 
    } else {
        frame = Math.floor(now / THINK_FRAME_MS) % sheet.frames; // if we are not playing, we just animate at a constant speed (THINK_FRAME_MS)
    }

    cat.style.backgroundPosition = `-${frame * FRAME_WIDTH}px 0px`;
    requestAnimationFrame(tick);
}



//---MESSAGES from main process---
window.vibecat.onSong((song) => {
    snapshot = song.playing ? song : null; // if the song is playing, we store it, else we set it to null
    songText.textContent = song.playing ? `${song.artist} - ${song.title}` : '';
});

window.vibecat.onBPM((data) => 
    {state = data.status;
    if (state === 'found'){
        bpm = data.tempo;
        useSheet('chill');
    } else {
        useSheet('think');
    }   
});

//---start---

useSheet('think');
requestAnimationFrame(tick);