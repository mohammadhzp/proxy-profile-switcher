if (typeof importScripts === "function") importScripts("proxy.js");  // Firefox-Chrome Compatibility.

function applyFromStorage() {
    chrome.storage.local.get("proxySettings", data => {
        const s = {...DEFAULT_SETTINGS, ...data.proxySettings};
        applyProxy(s);
        updateIcon(s.mode);
    });
}

function cycleMode() {
    chrome.storage.local.get("proxySettings", data => {
        const s = {...DEFAULT_SETTINGS, ...data.proxySettings};
        s.mode = getNextMode(s.mode);
        chrome.storage.local.set({proxySettings: s}, () => {
            applyProxy(s);
            updateIcon(s.mode);
        });
    });
}

function openSettings() {
    chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 420,
        height: 520
    });
}

applyFromStorage(); // Init settings

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "proxy-settings",
        title: "Proxy Settings",
        contexts: ["action"]
    });
});

chrome.action.onClicked.addListener(cycleMode);

chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === "proxy-settings") openSettings();
});
