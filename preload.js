const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vibecat', {
    onSong: (callback) =>
        ipcRenderer.on('song', (event, song) => callback(song)),
    onBPM: (callback) =>
        ipcRenderer.on('bpm', (event, bpm) => callback(bpm)),
    onChorus: (callback) =>
        ipcRenderer.on('chorus', (event, sections) => callback(sections)),
});