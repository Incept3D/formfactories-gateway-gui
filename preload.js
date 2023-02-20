// preload.js

const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // we can also expose variables, not just functions
})

// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }

  document.getElementById('api-key').oninput = (e) => {
    ipcRenderer.send('api-key', e.target.value)
  }

  document.getElementById('start').addEventListener('click', () => {
    ipcRenderer.send('start')
  })

  document.getElementById('stop').addEventListener('click', () => {
    ipcRenderer.send('stop')
  })
})

function statusInfo (status) {
  if (status.installingUpdate) return { text: 'updating...', color: 'orange' }
  if (status.started && status.running) return { text: 'running', color: 'limegreen' }
  if (status.started && !status.running) return { text: 'starting...', color: 'orange' }
  if (!status.started) return { text: 'stopped', color: 'red' }
}

ipcRenderer.on('log', (event, log) => {
  const logsElem = document.getElementById('logs')
  const logElem = document.createElement('div')
  logElem.innerHTML = log
  logsElem.prepend(logElem)
  if (logsElem.children.length > 1000) logsElem.removeChild(logsElem.lastChild)
})

ipcRenderer.on('api-key', (event, apiKey) => {
  document.getElementById('api-key').value = apiKey
})

ipcRenderer.on('status', (event, status) => {
  document.getElementById('api-key').disabled = status.started
  document.getElementById('start').disabled = status.started || (status.updating && status.launchAfterUpdate)
  document.getElementById('stop').disabled = !status.started && !(status.updating && status.launchAfterUpdate)

  const statusDetails = statusInfo(status)
  document.getElementById('status-label').innerText = statusDetails.text
  document.getElementById('status-icon').style.color = statusDetails.color
})