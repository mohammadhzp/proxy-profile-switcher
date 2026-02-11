const IS_FIREFOX = navigator.userAgent.toLowerCase().includes("firefox");

const MODES = ["none", "system", "manual"];

const FALLBACK_MODE = "system";

const MODE_ICONS = {
    none: "icons/no_proxy.png",
    autoDetect: "icons/proxy_auto.png",
    system: "icons/proxy_auto.png",
    manual: "icons/proxy_manual.png",
    autoConfig: "icons/proxy_manual.png"
};

const DEFAULT_SETTINGS = {
    mode: FALLBACK_MODE,
    httpHost: "", httpPort: 0,
    useHttpForHttps: false,
    httpsHost: "", httpsPort: 0,
    socksHost: "", socksPort: 0,
    socksVersion: 5,
    noProxyFor: "",
    autoConfigUrl: "",
    proxyDNS: true,
    autoLogin: false
};

function getNextMode(current) {
    let idx = MODES.indexOf(current);
    return MODES[(idx + 1) % MODES.length];
}

function prepareFirefoxProxy(s) {
    let value = {proxyType: s.mode, passthrough: s.noProxyFor || "", proxyDNS: !!s.proxyDNS, autoLogin: !!s.autoLogin};

    let sslHost = s.useHttpForHttps ? s.httpHost : s.httpsHost;
    let sslPort = s.useHttpForHttps ? s.httpPort : s.httpsPort;

    if (s.mode === "autoConfig") {
        value.autoConfigUrl = s.autoConfigUrl || "";
    }

    if (s.httpHost) {
        value.http = s.httpHost + ":" + (parseInt(s.httpPort) || 80);
    }

    if (sslHost) {
        value.ssl = sslHost + ":" + (parseInt(sslPort) || 443);
    }

    if (s.socksHost) {
        value.socks = s.socksHost + ":" + (parseInt(s.socksPort) || 1080);
        value.socksVersion = parseInt(s.socksVersion) || 5;
    }

    if (s.mode === "system" || s.mode === "none") {
        value = {proxyType: s.mode};
    }

    return value;
}

function prepareChromeProxy(s) {
    const modeMap = {
        none: "direct", autoDetect: "auto_detect", system: "system",
        manual: "fixed_servers", autoConfig: "pac_script"
    };

    let value = {mode: modeMap[s.mode] || FALLBACK_MODE};

    if (s.mode === "manual") {
        let httpsHost = s.useHttpForHttps ? s.httpHost : s.httpsHost;
        let httpsPort = s.useHttpForHttps ? s.httpPort : s.httpsPort;

        if (!s.httpHost && !httpsHost && !s.socksHost) {
            value.mode = FALLBACK_MODE; // fallback to system proxy if no manual proxy found.

        } else {
            let rules = {bypassList: (s.noProxyFor || "").split(",").map(x => x.trim()).filter(Boolean)};
            if (s.httpHost) {
                rules.proxyForHttp = {host: s.httpHost, port: parseInt(s.httpPort) || 80};
            }

            if (httpsHost) {
                rules.proxyForHttps = {host: httpsHost, port: parseInt(httpsPort) || 443};
            }
            if (s.socksHost)
                rules.fallbackProxy = {
                    scheme: s.socksVersion === 4 ? "socks4" : "socks5",
                    host: s.socksHost, port: parseInt(s.socksPort) || 1080
                };
            value.rules = rules;
        }

    } else if (s.mode === "autoConfig") {
        value.pacScript = {url: s.autoConfigUrl || ""};
    }

    return value;
}

function applyProxy(s) {
    let value = IS_FIREFOX ? prepareFirefoxProxy(s) : prepareChromeProxy(s);
    chrome.proxy.settings.set({value});
}

function updateIcon(mode) {
    chrome.action.setIcon({path: {45: MODE_ICONS[mode] || MODE_ICONS[FALLBACK_MODE]}});
}
