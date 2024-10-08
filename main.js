const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const path = require('path')
const fs = require('fs').promises

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')

  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo',
          accelerator: 'CmdOrCtrl+N',
          click: () => { win.webContents.send('new-file') }
        },
        {
          label: 'Abrir',
          accelerator: 'CmdOrCtrl+O',
          click: () => { win.webContents.send('open-file') }
        },
        {
          label: 'Salvar',
          accelerator: 'CmdOrCtrl+S',
          click: () => { win.webContents.send('save-file') }
        },
        {
          label: 'Salvar Como',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => { win.webContents.send('save-file-as') }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('open-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })
  if (!canceled) {
    const content = await fs.readFile(filePaths[0], 'utf8')
    return { filePath: filePaths[0], content }
  }
  return { filePath: null, content: null }
})

ipcMain.handle('save-file', async (event, filePath, content) => {
  await fs.writeFile(filePath, content, 'utf8')
})

ipcMain.handle('save-file-as', async (event, content) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })
  if (!canceled) {
    const finalPath = filePath.endsWith('.md') ? filePath : `${filePath}.md`
    await fs.writeFile(finalPath, content, 'utf8')
    return finalPath
  }
  return null
})
