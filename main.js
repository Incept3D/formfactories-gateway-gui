// main.js

const axios = require('axios')
const fs = require('fs')
const { exec } = require('child_process')
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { send } = require('process')
const kill = require('tree-kill')
require('update-electron-app')()

let win
const createWindow = () => {
    win = new BrowserWindow({
        width: 640,
        height: 640,
        titleBarStyle: 'hidden',
        title: 'formfactories gateway',
        webPreferences: {
        preload: path.join(__dirname, 'preload.js')
        }
    })

    // Load HTML
    win.loadFile('index.html')
//   win.webContents.openDevTools()

    // Handle window close
    win.on('close', async e => {
        if (!status.running) return
        e.preventDefault()

        const { response } = await dialog.showMessageBox(win, {
            type: 'question',
            buttons: ['Cancel', 'Quit Application'],
            title: 'quit formfactories gateway',
            message: 'Are you sure you want to quit? Your machines will stop communicating with formfactories.'
        })
        if (response) win.destroy()
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  initializeSettings()
  updateBinary()
})

app.on('before-quit', () => {
    // If the binary is running, stop it
    if (status.running) {
        status.restartOnClose = true
        stopBinary()
    }
})

// Check for updates every 5 minutes
setInterval(updateBinary, 5 * 60 * 1000)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let settings = {}
let status = {
    started: false,
    running: false,
    updating: false,
    launchAfterUpdate: false,
    installingUpdate: false,
    restartOnClose: false,
}

// Initialize settings file
function initializeSettings () {
    if (!fs.existsSync(path.join(app.getPath('userData'), 'settings.json'))) {
        fs.writeFileSync(path.join(app.getPath('userData'), 'settings.json'), JSON.stringify({
            apiKey: '',
            version: null,
        }))
    }

    readSettings()
    if (settings.apiKey) {
        status.launchAfterUpdate = true
        sendStatus()
    }
}

ipcMain.on('api-key', (event, apiKey) => {
    settings.apiKey = apiKey
    writeSettings()
})

ipcMain.on('start', (event, value) => {
    if (status.started) return
    if (status.updating) {
        status.launchAfterUpdate = true
        sendStatus()
        return
    }
    startBinary()
})

ipcMain.on('stop', (event, value) => {
    if (!status.started) return
    status.restartOnClose = false
    if (status.updating) {
        status.launchAfterUpdate = false
        sendStatus()
        return
    }
    stopBinary()
})

// Read settings file
function readSettings () {
    settings = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'settings.json')))
    win.webContents.send('api-key', settings.apiKey)
}

// Write settings file
function writeSettings () {
    fs.writeFileSync(path.join(app.getPath('userData'), 'settings.json'), JSON.stringify(settings))
}

function postLog (text) {
    console.log(text)
    try {
        win.webContents.send('log', text)
    } catch (e) {}
}

function sendStatus () {
    try {
        win.webContents.send('status', status)
    } catch (e) {}
}

// Install a gateway update if available
function updateBinary () {
    if (status.updating) return
    console.log('checking for updates... (' + process.arch + ', ' + process.platform + ')', status.updating)
    status.updating = true
    sendStatus()
    return checkForBinaryUpdates()
        .then(binary => {
            if (binary) {
                // postLog('gateway update is available (' + settings.version + ' -> ' + binary.version + ')')
                return installGatewayBinary(binary).then(() => true)
            } else {
                // postLog('gateway is up to date')
                return false
            }
        })
        .then(updated => {
            console.log('done updating, installed?', updated, status.launchAfterUpdate)
            if (status.launchAfterUpdate || (updated && status.running)) {
                console.log('starting binary after update')
                status.updating = false
                status.launchAfterUpdate = false
                if (proc) {
                    status.restartOnClose = true
                    stopBinary()
                } else {
                    startBinary()
                }               
            } else {
                status.updating = false
                status.launchAfterUpdate = false
                sendStatus()
            }
        })
}
  
// check for new updates
function checkForBinaryUpdates () {
    // console.log(process.arch, process.platform)
    // postLog('checking for updates... (' + process.arch + ', ' + process.platform + ')')
    return getGatewayBinaries()
        .then(res => {
            if (res.data.version > (settings.version || 0)) {
                // postLog('new version available')
                return res.data
            }
        })
        .catch(err => {
            console.log('no binary :(', err)
        })
}

// Get a gateway binary for the current platform
function getGatewayBinaries () {
    return axios.post('https://us-central1-formfactories-incept3d.cloudfunctions.net/downloadGateway', {
        arch: process.arch,
        platform: process.platform
    })
}

// Install a gateway binary
function installGatewayBinary (binary) {
    status.installingUpdate = true
    sendStatus()
    return new Promise((resolve, reject) => {
        postLog('download latest update (gateway v' + binary.version + ')...')
        const url = binary.url

        // Download the binary
        axios.get(url, { responseType: 'stream'})
            .then(res => {
                // Write the binary to disk
                res.data.pipe(fs.createWriteStream(path.join(app.getPath('userData'), 'gateway_binary_temp')))
                    .on('finish', () => {
                        postLog('finished downloading update, installing...')

                        // Add execute permissions to the binary
                        fs.chmodSync(path.join(app.getPath('userData'), 'gateway_binary_temp'), '755')
                        fs.renameSync(path.join(app.getPath('userData'), 'gateway_binary_temp'), path.join(app.getPath('userData'), 'gateway_binary'))

                        settings.version = binary.version
                        writeSettings()
                        status.installingUpdate = false
                        sendStatus()

                        postLog('gateway update installed')
                        resolve()
                    })
            })
            .catch(err => {
                console.log('error downloading binary', err)
                status.installingUpdate = false
                sendStatus()
                reject(err)
            })
    })
}


// Execute the gateway binary
let proc
function startBinary () {
    // Execute the binary
    postLog('starting gateway...')
    proc = exec(path.join(app.getPath('userData'), 'gateway_binary').replace(/ /g, '\\ '))

    proc.stdout.on('data', data => {
        if (data.includes('gateway started')) {
            status.running = true
            status.restartOnClose = true
            sendStatus()
        }
        if (proc) postLog(data)
    })

    proc.stderr.on('data', data => {
        if (proc) postLog(data)
    })

    proc.on('close', code => {
        postLog('gateway stopped', code)
        status.running = false
        status.started = false

        // Restart the binary if it was closed unexpectedly
        if (status.restartOnClose) {
            startBinary()
            status.restartOnClose = false
        }
        sendStatus()
    })

    proc.on('error', err => {
        postLog('gateway error: ' + err)
    })

    proc.on('message', msg => {
        postLog('gateway message: ' + msg)
    })

    proc.on('spawn', () => {
        // postLog('gateway spawned')
        status.started = true
        sendStatus()
    })
}

// Quit the gateway binary
function stopBinary () {
    if (proc) {
        kill(proc.pid)
        proc = null
    }
}