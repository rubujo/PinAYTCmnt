"use strict";

import { Function } from "./js/function.js";

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringPinSelectedContent"),
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: Function.CMID_PinSelectedContent
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringAppendPinSelectedContent"),
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: Function.CMID_AppendPinSelectedContent
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringUnpinSelectedContent"),
        contexts: ["page"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: Function.CMID_UnpinSelectedContent
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringResetPinnedContentPosition"),
        contexts: ["page"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: Function.CMID_ResetPinnedContentPosition
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringTogglePinnedContent"),
        contexts: ["page"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: Function.CMID_TogglePinnedContent
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === Function.CMID_PinSelectedContent) {
        Function.sendMsg(Function.CommandPinSelectedContent, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === Function.CMID_AppendPinSelectedContent) {
        Function.sendMsg(Function.CommandAppendPinSelectedContent, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === Function.CMID_UnpinSelectedContent) {
        Function.sendMsg(Function.CommandUnpinSelectedContent, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === Function.CMID_ResetPinnedContentPosition) {
        Function.sendMsg(Function.CommandResetPinnedContentPosition, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === Function.CMID_TogglePinnedContent) {
        Function.sendMsg(Function.CommandTogglePinnedContent, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === Function.CommandPinSelectedContent) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Function.CommandAppendPinSelectedContent) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Function.CommandUnpinSelectedContent) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Function.CommandResetPinnedContentPosition) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Function.CommandTogglePinnedContent) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    }
});

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message === Function.MessageWakeUp) {
        updateExtensionApperance();
    } else {
        Function.writeConsoleLog(message);
    }
});

/**
 * 更新擴充功能的外觀
 */
function updateExtensionApperance() {
    // 更新 contextMenus 的 title。
    chrome.contextMenus.update(Function.CMID_PinSelectedContent, {
        title: chrome.i18n.getMessage("stringPinSelectedContent"),
    }, () => {
        if (chrome.runtime.lastError?.message) {
            Function.writeConsoleLog(chrome.runtime.lastError?.message);
        }
    });

    // 更新 contextMenus 的 title。
    chrome.contextMenus.update(Function.CMID_AppendPinSelectedContent, {
        title: chrome.i18n.getMessage("stringAppendPinSelectedContent"),
    }, () => {
        if (chrome.runtime.lastError?.message) {
            Function.writeConsoleLog(chrome.runtime.lastError?.message);
        }
    });

    // 更新 contextMenus 的 title。
    chrome.contextMenus.update(Function.CMID_UnpinSelectedContent, {
        title: chrome.i18n.getMessage("stringUnpinSelectedContent"),
    }, () => {
        if (chrome.runtime.lastError?.message) {
            Function.writeConsoleLog(chrome.runtime.lastError?.message);
        }
    });

    // 更新 contextMenus 的 title。
    chrome.contextMenus.update(Function.CMID_ResetPinnedContentPosition, {
        title: chrome.i18n.getMessage("stringResetPinnedContentPosition"),
    }, () => {
        if (chrome.runtime.lastError?.message) {
            Function.writeConsoleLog(chrome.runtime.lastError?.message);
        }
    });

    // 更新 contextMenus 的 title。
    chrome.contextMenus.update(Function.CMID_TogglePinnedContent, {
        title: chrome.i18n.getMessage("stringTogglePinnedContent"),
    }, () => {
        if (chrome.runtime.lastError?.message) {
            Function.writeConsoleLog(chrome.runtime.lastError?.message);
        }
    });
}