const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const AUTH_PORTS_FILE = path.join(app.getPath('userData'), 'authorized-ports.json');

function loadJsonFile(filePath) {
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { return []; }
}

function saveJsonFile(filePath, data) {
    try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); } catch { }
}

function loadAuthorizedPorts() {
    return loadJsonFile(AUTH_PORTS_FILE);
}

function saveAuthorizedPort(portInfo) {
    const ports = loadAuthorizedPorts();
    const exists = ports.some(p =>
        p.vendorId === portInfo.vendorId &&
        p.productId === portInfo.productId &&
        p.serialNumber === portInfo.serialNumber
    );
    if (!exists) {
        ports.push(portInfo);
        saveJsonFile(AUTH_PORTS_FILE, ports);
    }
}

// Treat file:// as secure context (required for Web Serial API in Electron)
app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', 'file://');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'Serial Debug Tool',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webSerial: true,
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    });

    win.loadFile('Serial Debug.html');

    win.once('ready-to-show', () => {
        win.show();
    });

    return win;
}

let mainWindow = null;
let pendingSerialCallback = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        // Remove default menu bar (File, Edit, View, etc.)
        Menu.setApplicationMenu(null);

        // Grant access to all serial devices
        session.defaultSession.setDevicePermissionHandler((details) => {
            if (details.deviceType === 'serial') return true;
            return false;
        });

        // Intercept serial port selection for custom modal
        session.defaultSession.on('select-serial-port', (event, portList, serialPortManager, callback) => {
            event.preventDefault();
            pendingSerialCallback = callback;

            const ports = portList.map(p => ({
                portId: p.portId,
                displayName: p.displayName || p.portName || 'Serial Port',
                portName: p.portName || '',
                vendorId: p.vendorId,
                productId: p.productId,
            }));
            mainWindow.webContents.send('serial-ports', ports);
        });

        mainWindow = createWindow();

        // IPC: save authorized port info for persistence
        ipcMain.on('save-authorized-port', (_event, portInfo) => {
            saveAuthorizedPort(portInfo);
        });

        // IPC: user selected a port from the custom modal
        ipcMain.on('serial-port-selected', (_event, selectedPortId) => {
            if (pendingSerialCallback) {
                pendingSerialCallback(selectedPortId || '');
                pendingSerialCallback = null;
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
