const cat = document.getElementById('cat');
const songText = document.getElementById('song');

//---Settings---
const SCALE = 5;
const FRAMES = 8; // 8 frames in the spritesheet 
const FRAMES_PER_BEAT = 8; // 8 frames per beat in the sheet
const FRAME_WIDTH = 52 * SCALE; // each frame, scaled up
const FRAME_HEIGHT = 52 * SCALE; 
const THINK_FRAME_MS = 125; // how long each frame should last in ms when thinking

let skin = 'cat'; //set default to cat
const DEFAULT_SKIN = 'cat'; 

const SKINS = {
    cat: {
        'chill-normal':       { frames: 8,  speed: 1.0 },
        'chill-drop':         { frames: 16,  speed: 1.0 },
        'hype-normal':        { frames: 8,  speed: 0.5 },
        'hype-drop':          { frames: 16, speed: 1.0 },
        'intense-normal':     { frames: 8,  speed: 1.0 },
        'intense-drop':       { frames: 16, speed: 1.0 },
        'bittersweet-normal': { frames: 32, speed: 1.0 },
        'bittersweet-drop':   { frames: 8,  speed: 1.0 },
        'somber-normal':      { frames: 16, speed: 0.5 },
        'somber-drop':        { frames: 8,  speed: 1.0 },
        'think-normal':       { frames: 8 },
    },
    girl: {
        'chill-normal': { frames: 8, speed: 1.0 },
    },
};

let mood = null;
const POSITIVITY = { somber: -2, melancholic: -1, neutral: 0, upbeat: 1, exuberant: 2 }; // used to determine which sheet to use based on the vibe of the song

let choruses = []; // store the chorus sections so we can use them to animate the cat
let wasInChorus = false; // store whether the cat is in a chorus section so we can animate it differently

function pickMood(data){
    const positivity = POSITIVITY[data.vibe] ?? (data.mode === 'minor' ? -1 : 1); // if the vibe is not in the list, we use the mode to determine positivity (minor = negative, major = positive)
    const loud = data.energy === 'high';

    if(positivity < 0 && loud) return 'intense';
    if(positivity === -2) return 'somber';
    if(positivity < 0) return 'bittersweet';
    if(positivity === 2 && loud) return 'hype';
    return 'chill'; // default to chill if none of the above
}

//---the knowns---
let state = 'idle'; //default when nothing is playing
let bpm = null; // default bpm for idle
let snapshot = null; 
let sheet = null;


//---helpersss---
function useSheet(name) {
    const from = SKINS[skin][name] ? skin : DEFAULT_SKIN; // if the skin doesn't have the sheet, use the default skin
    const next = SKINS[from][name];
    if (sheet === next) return;

    sheet = next;
    cat.style.backgroundImage = `url(assets/skins/${from}/${name}.png)`;
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
        const pos = songPosition();
        const inChorus = choruses.some(c => pos >= c.start && pos <= c.end); // check if the current position is within any of the chorus sections T / F

        useSheet(`${mood}-${inChorus ? 'drop' : 'normal'}`); // if we are in a chorus section, we use the drop sheet, else we use the normal sheet

        const frameMs = (60000 / bpm) / FRAMES_PER_BEAT / sheet.speed; // how long each frame should last in ms, based on bpm and speed of the sheet
        frame = Math.floor(songPosition() / frameMs) % sheet.frames; // where in song are we / how much for each frame = frame number, floored to remove decimal and then modded w number of frames to wrap around 
    } else {
        frame = Math.floor(now / THINK_FRAME_MS) % sheet.frames; // if we are not playing, we just animate at a constant speed (THINK_FRAME_MS)
    }

    cat.style.backgroundPosition = `-${frame * FRAME_WIDTH}px 0px`;

    if(snapshot){
        const pos = songPosition();
        const inChorus = choruses.some(s => pos >= s.start && pos <= s.end); // check if the current position is within any of the chorus sections (TRUE/FALSE)

        if(inChorus !== wasInChorus){ // if the chorus state has changed, we update the sheet and the wasInChorus variable
            wasInChorus = inChorus;
            console.log(inChorus ? 'BEAT DROP' : 'back to normal', Math.floor(pos/1000), 's'); // log the time in seconds when the chorus state changes
        }
    }
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
        mood = pickMood(data);
        bpm = data.tempo;
        useSheet(`${mood}-normal`);
    } else {
        useSheet('think-normal');
    }   
});

window.vibecat.onChorus((sections) => {
    choruses = sections;
    wasInChorus = false;
});

//---start---

useSheet('think-normal');
requestAnimationFrame(tick);