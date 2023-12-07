"use strict";

(async () => {
    try {
        // 動態載入 JavaScript 模組。
        const jsUrl = chrome.runtime.getURL("js/core.js");
        const js = await import(jsUrl);

        // 執行 JavaScript 檔案內 export 的函式。
        js.doInit();
    } catch (error) {
        console.log(error);
    }
})();