const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const projectRoot = path.resolve(__dirname, "..", "..");
const rendererIndex = path.join(projectRoot, "dist", "renderer", "index.html");
const preload = path.join(projectRoot, "src", "preload", "library-preload.cjs");

function createWindow() {
  const isMac = process.platform === "darwin";
  const win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 860,
    minHeight: 560,
    title: "Opaline Example",
    backgroundColor: "#00000000",
    transparent: true,
    vibrancy: isMac ? "sidebar" : undefined,
    visualEffectState: isMac ? "active" : undefined,
    trafficLightPosition: { x: 22, y: 19 },
    roundedCorners: true,
    titleBarStyle: isMac ? "hiddenInset" : "default",
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false
  });

  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[renderer:did-fail-load] ${errorCode} ${errorDescription} ${validatedURL}`);
  });

  win.webContents.session.webRequest.onErrorOccurred((details) => {
    if (["script", "stylesheet", "xhr", "fetch"].includes(details.resourceType)) {
      console.error(`[renderer:request-error] ${details.error} ${details.method} ${details.url}`);
    }
  });

  if (!fs.existsSync(rendererIndex)) {
    throw new Error("Renderer build missing. Run npm run build first.");
  }

  win.loadFile(rendererIndex);
}

app.whenReady().then(createWindow).catch((error) => {
  console.error(error);
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
