"use strict";

import { MessageSet, CMIDSet, CommandSet } from "./js/dataSet.js";
import { Function } from "./js/function.js";

chrome.runtime.onInstalled.addListener(() => {
    // 先移除全部的 contextMenus。
    chrome.contextMenus.removeAll();

    // 建立 contextMenus。
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringPinSelectedContent"),
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.youtube.com/*",
        ],
        id: CMIDSet.PinSelectedContent,
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringAppendPinSelectedContent"),
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.youtube.com/*",
        ],
        id: CMIDSet.AppendPinSelectedContent,
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringUnpinSelectedContent"),
        contexts: ["page"],
        documentUrlPatterns: [
            "*://*.youtube.com/*",
        ],
        id: CMIDSet.UnpinSelectedContent,
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringResetPinnedContentPosition"),
        contexts: ["page"],
        documentUrlPatterns: [
            "*://*.youtube.com/*",
        ],
        id: CMIDSet.ResetPinnedContentPosition,
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringTogglePinnedContent"),
        contexts: ["page"],
        documentUrlPatterns: [
            "*://*.youtube.com/*",
        ],
        id: CMIDSet.TogglePinnedContent,
    });
});

chrome.contextMenus.onClicked.addListener((info, _tab) => {
    const command = Function.getCommand(info.menuItemId);

    if (command === undefined) {
        Function.writeConsoleLog(info.menuItemId);

        return;
    }

    Function.sendMessageToTab(command, true)
        .catch((error) => {
            Function.writeConsoleLog(error);
        });
});

chrome.commands.onCommand.addListener(command => {
    switch (command) {
        case CommandSet.PinSelectedContent:
        case CommandSet.AppendPinSelectedContent:
        case CommandSet.UnpinSelectedContent:
        case CommandSet.ResetPinnedContentPosition:
        case CommandSet.TogglePinnedContent:
            Function.sendMessageToTab(command, true)
                .catch(error => {
                    Function.writeConsoleLog(error);
                });

            break;
        default:
            Function.writeConsoleLog(command);

            break;
    }
});

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message === MessageSet.WakeUp) {
        updateExtensionApperance();
    } else {
        Function.writeConsoleLog(message);
    }
});

/**
 * 更新擴充功能的外觀
 */
function updateExtensionApperance() {
    // 更新 contextMenus 的標題。
    Function.updateContextMenusTitle(
        CMIDSet.PinSelectedContent,
        chrome.i18n.getMessage("stringPinSelectedContent")
    );

    Function.updateContextMenusTitle(
        CMIDSet.AppendPinSelectedContent,
        chrome.i18n.getMessage("stringAppendPinSelectedContent")
    );

    Function.updateContextMenusTitle(
        CMIDSet.UnpinSelectedContent,
        chrome.i18n.getMessage("stringUnpinSelectedContent")
    );

    Function.updateContextMenusTitle(
        CMIDSet.ResetPinnedContentPosition,
        chrome.i18n.getMessage("stringResetPinnedContentPosition")
    );

    Function.updateContextMenusTitle(
        CMIDSet.TogglePinnedContent,
        chrome.i18n.getMessage("stringTogglePinnedContent")
    );
}
