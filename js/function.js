"use strict";

/**
 * 共用函式
 */
export class Function {
    /**
     * 訊息：醒來
     */
    static MessageWakeUp = "wakeUp";

    /**
     * 共用的 ContextMenu 選項「釘選已選取的內容」的 ID 值
     */
    static CMID_PinSelectedContent = "CMID_PinSelectedContent";

    /**
     * 共用的 ContextMenu 選項「解除釘選已選取的內容」的 ID 值
     */
    static CMID_UnpinSelectedContent = "CMID_UnpinSelectedContent";

    /**
     * 共用的 ContextMenu 選項「重設已釘選的內容的位置」的 ID 值
     */
    static CMID_ResetPinnedContentPosition = "CMID_ResetPinnedContentPosition";

    /**
     * 共用的 ContextMenu 選項「開闔已釘選的內容」的 ID 值
     */
    static CMID_TogglePinnedContent = "CMID_TogglePinnedContent";

    /**
     * 指令：釘選已選取的內容
     */
    static CommandPinSelectedContent = "pinSelectedContent";

    /**
     * 指令：解除釘選已選取的內容
     */
    static CommandUnpinSelectedContent = "unpinSelectedContent";

    /**
     * 指令：重設已釘選的內容的位置
     */
    static CommandResetPinnedContentPosition = "resetPinnedContentPosition";

    /**
     * 指令：開闔已釘選的內容
     */
    static CommandTogglePinnedContent = "togglePinnedContent";

    /**
     * 分隔符號 "^"
     */
    static Seperator = "^";

    /**
     * 傳送訊息
     *
     * @param {string} command 字串，指令。
     * @param {string} isContextMenu 布林值，是否為右鍵選單，預設值為 false。
     */
    static async sendMsg(command, isContextMenu = false) {
        // 來自右側選單的訊息必須傳送。
        if (isContextMenu === true) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length > 0) {
                    const tabId = tabs[0].id;

                    if (tabId !== undefined) {
                        chrome.tabs.sendMessage(tabId, command);
                    } else {
                        console.error(chrome.i18n.getMessage("messageTabIDIsUndefined"));
                    }
                } else {
                    console.error(chrome.i18n.getMessage("messageTabsIsEmpty"));
                }
            });

            return;
        }
    }

    /**
     * 傳送資料
     *
     * @param {string} command 字串，指令。
     * @param {string} data 字串，資料。
     */
    static async sendData(command, data) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                const tabId = tabs[0].id;

                if (tabId !== undefined) {
                    chrome.tabs.sendMessage(tabId, { "command": command, "data": data });
                } else {
                    console.error(chrome.i18n.getMessage("messageTabIDIsUndefined"));
                }
            } else {
                console.error(chrome.i18n.getMessage("messageTabsIsEmpty"));
            }
        });
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
        const array = url.split(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*)(?:(\?t|&start|&t)=(\d+))?.*/);

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
        // TODO: 2023-02-17 未來可能會需要再調整。
        let outputDataSet = [],
            composeStr = "",
            unknownNameCount = 1,
            tempNameStr = "";

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
            let pushCount = 0, overValue = -1;

            nodeArray.forEach((node, childIndex, array) => {
                // 判斷 array 的長度是否小於 3，理論上不應該小於 3。
                if (array.length < 3) {
                    // 不進行任何處理。
                    return;
                }

                if (node instanceof HTMLAnchorElement) {
                    const textContent = node.textContent ?? "";

                    // 時間標記連結。
                    if (textContent.indexOf("#") === -1 &&
                        textContent.indexOf("http") === -1) {
                        const youTubeData = Function.getYouTubeIdAndStartSec(node.href);

                        composeStr += `${youTubeData[0]}${Function.Seperator}${youTubeData[1]}${Function.Seperator}`;

                        if (tempNameStr !== "") {
                            composeStr += tempNameStr;

                            outputDataSet.push(composeStr);

                            pushCount++;

                            // 清空 composeStr 供下一次使用。
                            composeStr = "";

                            // 清空 tempNameStr 供下一次使用。
                            tempNameStr = "";
                        }
                    } else {
                        // # 標籤或網址連結。
                        tempNameStr += textContent;
                    }
                } else if (node instanceof HTMLSpanElement) {
                    // 判斷 array 的長度是否大於 3。
                    if (array.length > 3) {
                        // 判斷 array 的長度是否大於 5。
                        if (array.length > 5) {
                            // 當 overValue 為 -1 時，設定 overValue 的值。
                            if (overValue === -1) {
                                overValue = array.length - 5;
                            }

                            // 判斷 childIndex 是否小於 overValue，
                            // 排除第一個時間標記前的任何字串。
                            if (childIndex <= overValue) {
                                // 不進行任何處理。
                                return;
                            } else {
                                // 重設 overValue。
                                overValue = -1;
                            }
                        } else {
                            // 排除第一個時間標記前的任何字串。
                            if (childIndex === 0) {
                                // 不進行任何處理。
                                return;
                            }
                        }
                    }

                    // 去掉換行字元跟移除開頭的空白。
                    let trimedTextContent = node.textContent
                        ?.replace(/[\n\r]/g, "")
                        .trimStart();

                    if (trimedTextContent !== undefined &&
                        trimedTextContent?.length > 0) {
                        // 判斷最後一個字元是否為 #。
                        if (trimedTextContent.slice(-1) === "#") {
                            // 移除字串尾巴的 #。
                            trimedTextContent = trimedTextContent.slice(0, -1).trimEnd();
                        }

                        if (composeStr === "") {
                            // 當 composeStr 為空白時，則表示時間標記不在字串前方，
                            // 而可能是在的中段或是最尾端。

                            // 將歌曲名稱指派給 tempNameStr。
                            tempNameStr += trimedTextContent;
                        } else {
                            // 判斷 composeStr 是否沒內容。
                            if (composeStr.indexOf(Function.Seperator) !== -1) {
                                composeStr += trimedTextContent;

                                outputDataSet.push(composeStr);

                                pushCount++;

                                // 清空 composeStr 供下一次使用。
                                composeStr = "";

                                // 清空 tempNameStr 供下一次使用。
                                tempNameStr = "";
                            } else {
                                // 判斷 composeStr 是否沒內容。
                                if (composeStr === "" || composeStr.length <= 0) {
                                    return;
                                } else {
                                    // 針對只有時間標記的資料，補一個暫用的名稱。
                                    composeStr += `${chrome.i18n.getMessage("stringUnknownName")} ${unknownNameCount}`;

                                    unknownNameCount++;

                                    outputDataSet.push(composeStr);

                                    pushCount++;

                                    // 清空 composeStr 供下一次使用。
                                    composeStr = "";

                                    // 清空 tempNameStr 供下一次使用。
                                    tempNameStr = "";
                                }
                            }
                        }
                    }
                } else {
                    // 不進行任何處理。
                    return;
                }

                // 當 childIndex 為 array 的內最後一個項目時，
                // 且 tempNameStr 不為空白時。
                if (childIndex === array.length - 1 &&
                    tempNameStr !== "") {
                    let targetIndex = totalPushCount - 1;

                    if (pushCount >= 1) {
                        targetIndex += pushCount;
                    }

                    if (targetIndex < 0) {
                        targetIndex = 0;
                    }

                    // 將 tempNameStr 附加至 outputDataSet[targetIndex]。
                    outputDataSet[targetIndex] += tempNameStr;

                    // 清空 tempNameStr 供下一次使用。
                    tempNameStr = "";
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
     * @param {string} value 字串，值。
     */
    static insertStyleSheetRule(value) {
        const sheets = document.styleSheets;

        if (sheets.length === 0) {
            const newStyle = document.createElement("style");

            newStyle.appendChild(document.createTextNode(""));

            document.head.appendChild(newStyle);
        }

        const sheet = sheets[sheets.length - 1];

        sheet.insertRule(value, sheet.cssRules.length);
    }
}