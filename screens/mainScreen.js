const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const windowStateKeeper = require("electron-window-state");
const Gs = require("@jspawn/ghostscript-wasm");
const { check } = require("./updater");
const { menu, em } = require("./menuTemplate");
const path =  require("path");
const fs = require('fs');

let win;
exports.createWindow = () => {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 700,
    defaultHeight: 750,
  });

  win = new BrowserWindow({
    minWidth: 700,
    minHeight: 750,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      sandbox: false
    },
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));

  win.loadFile(`${__dirname}/../pages/home/index.html`);

  win.once("ready-to-show", win.show);
  mainWindowState.manage(win);
};

ipcMain.on("compress", async (evt,sourcePath) => {

  const mod = await Gs();
  const working = "/working";
  let dir =  path.parse(`${sourcePath}.pdf`).dir;
  let filename =  path.parse(`${sourcePath}`).base;


  mod.FS.mkdir(working);
  mod.FS.mount(mod.NODEFS, { root: dir }, working);
  mod.FS.chdir(working);

    let args = [
      '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE', '-dQUIET', '-dBATCH','-dSAFER',
      `-sOutputFile=${filename}-compressed.pdf`,
      `${filename}.pdf`,
    ]
    try {
      await mod.callMain(args);
      evt.returnValue = true;
    } catch (error) {
      evt.returnValue = false;
    }
});

ipcMain.on("save", (e) => {
  dialog
    .showSaveDialog({
      title: "Save",
      defaultPath: app.getPath("documents"),
      properties: ["showOverwriteConfirmation"],
    })
    .then((udata) => {
      e.returnValue = udata;
    });
});
ipcMain.on("get-version", (e) => {
  e.returnValue = app.getVersion();
});
em.on("update", () => {
  check(true);
});


em.on("about", () => {
  const child = new BrowserWindow({
    parent: win,
    modal: true,
    show: false,
    width: 700,
    height: 700,
    resizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  child.loadFile(`${__dirname}/../pages/about/index.html`);
  child.once("ready-to-show", () => {
    child.show();
  });
});


console.log(process.env.APP_ENV);
exports.app = app;
exports.dialog = dialog;
exports.ipcMain = ipcMain;
exports.BrowserWindow = BrowserWindow;
if (process.env.APP_ENV === "development") {
  try {
    require("electron-reloader")(module);
  } catch (_) {}
}
