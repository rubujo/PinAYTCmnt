"use strict";

(async () => {
    const path = chrome.runtime.getURL("js/core.js");
    const coreDotJS = await import(path);

    coreDotJS.doInit();
})();