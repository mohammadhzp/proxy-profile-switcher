const $ = id => document.getElementById(id);
let advanced = false;

// --- Simple view helpers ---

function loadSimple(s) {
    if (s.socksHost) {
        setRadio("simpleType", "socks");
        $("simpleHost").value = s.socksHost;
        $("simplePort").value = s.socksPort;

    } else if (s.httpHost) {
        setRadio("simpleType", "http");
        $("simpleHost").value = s.httpHost;
        $("simplePort").value = s.httpPort;

    } else {
        setRadio("simpleType", "socks");
        $("simpleHost").value = "";
        $("simplePort").value = 0;
    }

    $("simpleProxyDNS").checked = s.proxyDNS !== false;
}

function saveSimple() {
    const type = getRadio("simpleType");
    const host = $("simpleHost").value.trim();
    const port = parseInt($("simplePort").value) || 0;

    const s = {...DEFAULT_SETTINGS, mode: host ? "manual" : "system", proxyDNS: $("simpleProxyDNS").checked};

    if (type === "socks") {
        s.socksHost = host;
        s.socksPort = port;
        s.socksVersion = 5;

    } else {
        s.httpHost = host;
        s.httpPort = port;
        s.useHttpForHttps = true;
    }
    return s;
}

// --- Advanced view helpers ---

const advFields = ["httpHost", "httpPort", "httpsHost", "httpsPort", "socksHost", "socksPort", "noProxyFor", "autoConfigUrl"];
const advChecks = ["useHttpForHttps", "proxyDNS", "autoLogin"];

function loadAdvanced(s) {
    setRadio("mode", s.mode || "system");
    setRadio("socksVersion", String(s.socksVersion || 5));

    advFields.forEach(id => $(id).value = s[id] ?? DEFAULT_SETTINGS[id]);
    advChecks.forEach(id => $(id).checked = !!s[id]);

    toggleAdvSections();
}

function saveAdvanced() {
    const s = {
        mode: getRadio("mode") || "system",
        socksVersion: parseInt(getRadio("socksVersion")) || 5
    };

    advFields.forEach(id => {
        const el = $(id);
        s[id] = el.type === "number" ? parseInt(el.value) || 0 : el.value;
    });

    advChecks.forEach(id => s[id] = $(id).checked);
    return s;
}

function toggleAdvSections() {
    const mode = getRadio("mode");

    $("manualSection").classList.toggle("hidden", mode !== "manual");
    $("autoSection").classList.toggle("hidden", mode !== "autoConfig");
    $("httpsRow").classList.toggle("hidden", $("useHttpForHttps").checked);
}

// --- Shared helpers ---

function setRadio(name, value) {
    const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (el) {
        el.checked = true;
    }
}

function getRadio(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value;
}

function showStatus() {
    const el = $("status");

    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 1500);
}

// --- Init ---

chrome.storage.local.get("proxySettings", data => {
    const s = {...DEFAULT_SETTINGS, ...data.proxySettings};

    loadSimple(s);
    loadAdvanced(s);
});

// --- Events ---

$("toggleBtn").addEventListener("click", () => {
    advanced = !advanced;

    $("simpleView").classList.toggle("hidden", advanced);
    $("advancedView").classList.toggle("hidden", !advanced);
    $("toggleBtn").textContent = advanced ? "Simple \u25B4" : "Advanced \u25BE";

    // Sync views from storage when switching
    chrome.storage.local.get("proxySettings", data => {
        const s = {...DEFAULT_SETTINGS, ...data.proxySettings};
        if (advanced) loadAdvanced(s); else loadSimple(s);
    });
});

document.querySelectorAll('input[name="mode"]').forEach(
    el => el.addEventListener("change", toggleAdvSections)
);

$("useHttpForHttps").addEventListener("change", toggleAdvSections);

$("saveBtn").addEventListener("click", () => {
    const s = advanced ? saveAdvanced() : saveSimple();
    chrome.storage.local.set({proxySettings: s}, () => {
        applyProxy(s);
        updateIcon(s.mode);

        window.close(); // Close pop-up after the save.
    });
});
