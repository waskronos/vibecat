const {app, BrowserWindow} = require('electron');
const { execFile } = require('child_process');
const path = require('path');

const { getSongData } = require('./src/songbpm.js');
const MUSIC_APPS = ['YouTube Music.exe', 'Spotify.exe']

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 300,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
     webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.webContents.openDevTools({ mode: 'detach' });

  win.loadFile('index.html');
}

function getNowPlaying(){
    return new Promise((resolve, reject) => { /* we use promise here cuz execFile is old school and doesnt support async/await but we need a promise, so we kind of build our OWN async func by returning the promise directly */
        const script = path.join(__dirname, 'src', 'now-playing.ps1'); /* taking into account that root dir could be different for each user */
        const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script]; /* powershell args - no profile to skip user settings, bypass exec policy to run fast and efficient, file script is just path to our 'script' */
        
        execFile('powershell.exe', args, (error, output) => {

            if (error) return reject(error);


            try {
                resolve(JSON.parse(output));
            } catch (parseError) {
                reject(parseError);
            } /* promise resolution and rejection!! */
        });
    });
}

let lastSong = null;

async function checkSong(){
    

    try {
        // console.log('poll at', new Date().toLocaleTimeString()); //debug to check poll working
        const song = await getNowPlaying();
        win.webContents.send('song', song); /* send the song to the renderer process so it can update the UI */

        const current = song.playing ? `${song.artist} - ${song.title}` : 'nothing'; /* if song.playing is true, then we get the artist and title, else we get nothing */
        
        if (current !== lastSong) {
            lastSong = current; // we store the last song so we can check if it changed, and only log if it did 
            console.log("Now Playing: ", current);
    
            if(song.playing && MUSIC_APPS.includes(song.app)) {
            lookUpBpm(song, current); // if the song is playing and the app is in our list, we look up the bpm 
        } else {
            win.webContents.send('bpm', {status : 'idle'}); // if the song is not playing, we send idle to the renderer process
        }
        }
    } catch (err) {
        console.error('Could not get song:', err.message);
    }
}

async function lookUpBpm(song, label){
    win.webContents.send('bpm', {status : 'thinking'}); /* send the song to the renderer process so it can update the UI */
    try{
        const data = await getSongData(song.artist, song.title);

        if(label !== lastSong) return; // if the song has changed while we waited, so throw this awayyyy
        if(data){
            win.webContents.send('bpm', {status : 'found', ...data});
        } else {
            win.webContents.send('bpm', {status : 'unknown'});
        }
    } catch(err){
            console.error('Could not get bpm:', err.message);
            win.webContents.send('bpm', {status : 'error'});
    }
}

app.whenReady().then(() => {
  createWindow();

  win.webContents.once('did-finish-load', () => {
    checkSong();
    setInterval(checkSong, 3000);
  });
});