"use strict";

import { CMIDSet, CommandSet, StringSet } from "./dataSet.js";

/**
 * 共用函式
 */
export class Function {
    /**
     * 查詢目前的分頁
     *
     * 來源：https://developer.chrome.com/docs/extensions/reference/tabs/
     *
     * @returns {Promise<chrome.tabs.Tab | undefined>} chrome.tabs.Tab 或是 undefined。
     */
    static async queryCurrentTab() {
        return new Promise(async (resolve) => {
            const queryInfo = {
                active: true,
                currentWindow: true,
            };

            // `tab` will either be a `tabs.Tab` instance or `undefined`.
            let [tab] = await chrome.tabs.query(queryInfo);

            // background.js 不能使用 alert()，故於此處關閉。
            this.processLastError(() => {
                resolve(undefined);
            }, false);

            resolve(tab);
        });
    }

    /**
     * 傳送訊息到分頁
     *
     * @param {string} command 字串，指令。
     * @param {string} isContextMenu 布林值，是否為右鍵選單，預設值為 false。
     */
    static async sendMessageToTab(command, isContextMenu = false) {
        const tab = await this.queryCurrentTab();

        if (tab === undefined) {
            this.writeConsoleLog(chrome.i18n.getMessage("messageTabsIsEmpty"));

            return;
        }

        const tabId = tab.id;

        if (tabId === undefined) {
            this.writeConsoleLog(chrome.i18n.getMessage("messageTabIdIsUndefined"));

            return;
        }

        // 來自右側選單的訊息必須傳送。
        if (isContextMenu === true) {
            chrome.tabs.sendMessage(tabId, command, (_response) => {
                // background.js 不能使用 alert()，故於此處關閉。
                this.processLastError(undefined, false);
            });
        }
    }

    /**
     * 傳送資料到分頁
     *
     * @param {string} command 字串，指令。
     * @param {string} data 字串，資料。
     */
    static async sendDataToTab(command, data) {
        const tab = await this.queryCurrentTab();

        if (tab === undefined) {
            this.writeConsoleLog(chrome.i18n.getMessage("messageTabsIsEmpty"));

            return;
        }

        const tabId = tab.id;

        if (tabId === undefined) {
            this.writeConsoleLog(chrome.i18n.getMessage("messageTabIdIsUndefined"));

            return;
        }

        chrome.tabs.sendMessage(
            tabId,
            { "command": command, "data": data },
            (_response) => {
                this.processLastError();
            },
        );
    }

    /**
     * 寫 Console 記錄
     *
     * @param {any} value 訊息內容。
     */
    static writeConsoleLog(value) {
        console.log(`${value}`);
    }

    /**
     * 取得 YouTube 影片的 ID 以及開始秒數
     *
     * 來源：https://stackoverflow.com/a/28659996
     *
     * @param {string} url 字串，YouTube 影片的網址。
     * @returns {string[]} 字串陣列，影片的 ID 值。
     */
    static getYouTubeIdAndStartSec(url) {
        const array = url.split(
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*)(?:(\?t|&start|&t)=(\d+))?.*/,
        );

        const newArray = [];

        undefined !== array[2] ? newArray.push(array[2]) : newArray.push("");
        undefined !== array[4] ? newArray.push(array[4]) : newArray.push("");

        return newArray;
    }

    /**
     * 將秒數格式化成 YouTube 留言的時間格式字串
     *
     * @param {number} secs secs 數值，HTML <video> 元素的 currentTime 屬性的值。
     * @param {boolean} formated 布林值，用於判斷是否輸出格式化（hh:mm:ss）後的字串，預設值為 false。
     * @returns {string} 字串，YouTube 留言的時間格式（mm:ss）字串。
     */
    static convertToYTTimestamp(secs, formated = false) {
        const dateObj = new Date(secs * 1000);

        const hours = dateObj.getUTCHours();
        const minutes = dateObj.getUTCMinutes();
        let seconds = dateObj.getSeconds();
        const milliseconds = dateObj.getMilliseconds();

        // 對毫秒進行四捨五入，當值大於等於 500 毫秒加 1 秒。
        if (milliseconds >= 500) {
            seconds = seconds + 1;
        }

        if (formated === true) {
            return `${hours.toString().padStart(2, "0")}:` +
                `${minutes.toString().padStart(2, "0")}:` +
                `${seconds.toString().padStart(2, "0")}`;
        } else {
            return `${hours > 0 ? (hours + ":") : ""}` +
                `${hours > 0 ? (minutes.toString().padStart(2, "0")) : minutes}:` +
                `${seconds.toString().padStart(2, "0")}`;
        }
    }

    /**
     * 執行解析已選取的 YouTube 留言內容
     *
     * @returns {any[]} 陣列，解析後的 YouTube 留言內容。
     */
    static extractYouTubeComment() {
        // TODO: 2024/3/2 未來可能會需要再調整程式碼。
        let outputDataSet = [],
            composeStr = "";

        const selection = document.getSelection();
        const range = selection.getRangeAt(0);
        const documentFragment = range.cloneContents();

        let sourceNodeArray = [],
            // 手動分類節點的資料。
            tempNode2DArray = [],
            tempNodeArray = [];

        const elemContentText = documentFragment.querySelector("#content-text");

        if (elemContentText !== null) {
            sourceNodeArray = [...elemContentText.childNodes];
        } else {
            sourceNodeArray = [...documentFragment.childNodes];
        }

        sourceNodeArray.forEach((item, index, array) => {
            const tempElement = item;
            const innerHTML = tempElement.innerHTML;

            // 當 innerHTML 的內容不為 "\n"、"\r" 時，
            // 才將結點加入至陣列。
            if (innerHTML !== "\n" &&
                innerHTML !== "\r") {
                // 排除圖片。
                if (item instanceof HTMLImageElement === false) {
                    // 排除 Hash 標籤的連結。
                    if (item instanceof HTMLAnchorElement === true &&
                        item.textContent.indexOf("#") === -1) {
                        tempNodeArray.push(item);
                    } else {
                        tempNodeArray.push(item);
                    }
                }
            } else {
                // 理論上 tempNodeArray 的子項目數量應大於 1。
                if (tempNodeArray.length > 1) {
                    tempNode2DArray.push(tempNodeArray);

                    // 重設 tempNodeArray。
                    tempNodeArray = [];
                    tempNodeArray.length = 0;
                }
            }

            // 當 index 為 array 的最後一個項目時。
            if (index == array.length - 1) {
                if (tempNodeArray.length > 0) {
                    tempNode2DArray.push(tempNodeArray);

                    // 重設 tempNodeArray。
                    tempNodeArray = [];
                    tempNodeArray.length = 0;
                }
            }
        });

        let totalPushCount = 0;

        tempNode2DArray.forEach((nodeArray) => {
            let pushCount = 0;

            nodeArray.forEach((node, _childIndex, _array) => {
                // 2024/3/2 YouTube 留言新格式。
                if (node.nodeName !== "SPAN") {
                    // 不進行任何處理。
                    return;
                }

                // 理論上時間標記連結只會只有一個子項目。
                if (node.childNodes.length !== 1) {
                    // 不進行任何處理。
                    return;
                }

                const childNode = node.childNodes[0];

                if (childNode instanceof HTMLAnchorElement) {
                    const textContent = node.textContent ?? "";

                    // 時間標記連結。
                    if (textContent.indexOf("#") === -1 &&
                        textContent.indexOf("http") === -1) {
                        const youTubeData = Function.getYouTubeIdAndStartSec(childNode.href);

                        composeStr += `${youTubeData[0]}${StringSet.Separator}${youTubeData[1]}${StringSet.Separator}`;

                        outputDataSet.push(composeStr);

                        pushCount++;

                        // 清空 composeStr 供下一次使用。
                        composeStr = "";
                    }
                } else {
                    // 不進行任何處理。
                    return;
                }
            });

            totalPushCount += pushCount;
        });

        return outputDataSet;
    }

    /**
     * 移除網址
     *
     * 來源：https://stackoverflow.com/a/23571059
     *
     * @param {string} value 輸入的字串。
     * @returns {string} 字串。
     */
    static removeUrl(value) {
        if (value === undefined || value === null) {
            return "";
        }

        return value.replace(/(?:https?|ftp):\/\/[\n\S]+/g, "");
    }

    /**
     * 插入 CSS 規則
     *
     * 來源：https://stackoverflow.com/a/48941794
     *
     * @param {string | string[]} value 字串或字串陣列，值。
     */
    static insertStyleSheetRules(value) {
        try {
            const sheets = document.styleSheets;

            if (sheets.length === 0) {
                const newStyle = document.createElement("style");

                newStyle.appendChild(document.createTextNode(""));

                document.head.appendChild(newStyle);
            }

            const sheet = sheets[sheets.length - 1];

            if (typeof value === "string") {
                sheet.insertRule(value, sheet.cssRules.length);
            } else if (Array.isArray(value) === true) {
                value.forEach((item) => {
                    sheet.insertRule(item, sheet.cssRules.length);
                });
            } else {
                this.writeConsoleLog(
                    "CSS 規則插入失敗，value 值的類型不為 string 或 string[]。",
                );
            }
        } catch (error) {
            this.writeConsoleLog(error);
        }
    }

    /**
     * 更新 contextMenus 的標題
     *
     * @param {string} key 字串，鍵值。
     * @param {string} title 字串，標題。
     */
    static updateContextMenusTitle(key, title) {
        chrome.contextMenus.update(key, {
            title: title,
        }, () => {
            // background.js 不能使用 alert()，故於此處關閉。
            this.processLastError(undefined, false);
        });
    }

    /**
     * 處理 chrome.runtime.lastError
     *
     * @param {Function} callback 回呼函式，預設值是 undefined。
     * @param {boolean} useAlert 布林值，是否使用 alert()，預設值為 true。
     * @returns {string | undefined} 字串或是 undefined，最後的錯誤訊息。
     */
    static processLastError(callback, useAlert = true) {
        let lastErrorMesssage = undefined;

        if (chrome.runtime.lastError) {
            lastErrorMesssage = chrome.runtime.lastError?.message;

            this.writeConsoleLog(lastErrorMesssage);

            if (useAlert === true) {
                alert(lastErrorMesssage);
            }

            callback;
        }

        return lastErrorMesssage;
    }

    /**
     * 取得指令
     *
     * @param {string} cmid 字串，CMID。
     * @returns {string | undefined} 字串或是 undefined，指令。
     */
    static getCommand(cmid) {
        switch (cmid) {
            case CMIDSet.PinSelectedContent:
                return CommandSet.PinSelectedContent;
            case CMIDSet.AppendPinSelectedContent:
                return CommandSet.AppendPinSelectedContent;
            case CMIDSet.UnpinSelectedContent:
                return CommandSet.UnpinSelectedContent;
            case CMIDSet.ResetPinnedContentPosition:
                return CommandSet.ResetPinnedContentPosition;
            case CMIDSet.TogglePinnedContent:
                return CommandSet.TogglePinnedContent;
            default:
                Function.writeConsoleLog(info.menuItemId);

                break;
        }

        return undefined;
    }
}