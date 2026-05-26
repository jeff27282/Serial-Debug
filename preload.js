const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Listen for serial port list (one-time, for custom modal)
    onSerialPorts: (callback) => {
        ipcRenderer.once('serial-ports', (_event, ports) => callback(ports));
    },
    // Send selected port back to main process
    selectSerialPort: (portId) => {
        ipcRenderer.send('serial-port-selected', portId);
    },
    // Save authorized port info for persistence across sessions
    saveAuthorizedPort: (portInfo) => {
        ipcRenderer.send('save-authorized-port', portInfo);
    },
    // Check if running in Electron
    isElectron: true,
});
