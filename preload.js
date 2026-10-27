const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vibecat', {
    onSong: (callback) =>
        ipcRenderer.on('song', (event, song) => callback(song)),
});