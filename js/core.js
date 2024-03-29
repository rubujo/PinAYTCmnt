"use strict";

import { MessageSet, CommandSet, StringSet } from "./dataSet.js";
import { Function } from "./function.js";

/**
 * 執行初始化
 */
export function doInit() {
    // isSetTempMinWidth 為單次用布林值。
    let tempMinWidth = "", isSetTempMinWidth = false;

    // 供滑鼠拖曳移動功能使用。
    let isDownAnHold = false,
        offset = [0, 0],
        coordinateXY = [0, 0];

    // 傳送訊息至 Background.js。
    chrome.runtime.sendMessage(MessageSet.WakeUp);

    // 延後 300 毫秒後再執行。
    const timer = setTimeout(() => {
        // 注入自定義 CSS 樣式。
        doInjectCustomCSS();

        // 用來應對 Vivaldi 網頁瀏覽器，還不支援擴充功能自定義快速鍵的狀況。
        doRegisterEventListener();

        clearTimeout(timer);
    }, 300);

    /**
     * 接收來自 background.js 的訊息
     */
    chrome.runtime.onMessage.addListener((response, _sender, _sendResponse) => {
        if (response === CommandSet.PinSelectedContent) {
            doPinSelectedContent();

            // 為 sendResponse 保留訊息傳送頻道開啟。
            return true;
        } else if (response === CommandSet.AppendPinSelectedContent) {
            doAppendPinSelectedContent();

            // 為 sendResponse 保留訊息傳送頻道開啟。
            return true;
        } else if (response === CommandSet.UnpinSelectedContent) {
            doRemovePinnedContentMainContainer();

            // 為 sendResponse 保留訊息傳送頻道開啟。
            return true;
        } else if (response === CommandSet.ResetPinnedContentPosition) {
            doResetPinnedContentMainContainerPosition();

            // 為 sendResponse 保留訊息傳送頻道開啟。
            return true;
        } else if (response === CommandSet.TogglePinnedContent) {
            doTogglePinnedContentMainContainer();

            // 為 sendResponse 保留訊息傳送頻道開啟。
            return true;
        } else {
            Function.writeConsoleLog(response);
        }
    });

    /**
     * 執行處理資料
     *
     * @param {HTMLDivElement} elemPinnedContentContentsContainer
     */
    function doProcessData(elemPinnedContentContentsContainer) {
        // 取得已選取的 YouTube 留言內容。
        const dataSet = Function.extractYouTubeComment();

        if (dataSet.length <= 0) {
            alert(chrome.i18n.getMessage("messageSelectTheCommentContentFirst"));

            return;
        }

        // TODO: 2024/3/2 未來可能會需要再調整。
        // 前處理資料。

        const processedDataSet = [];

        dataSet.forEach((item, index, _array) => {
            // 0：影片 ID、1：開始秒數、2：歌名。
            const tempArray = item.split(StringSet.Separator),
                videoID = tempArray[0],
                startSeconds = tempArray[1],
                timestamp = Function.convertToYTTimestamp(startSeconds),
                songName = Function.removeUrl(tempArray[2]);

            if (timestamp.indexOf(NaN) !== -1) {
                return;
            }

            const newItem = `${videoID}${StringSet.Separator}` +
                `${startSeconds}${StringSet.Separator}` +
                `${index + 1}. ${songName}`;

            processedDataSet.push(newItem);
        });

        // 清除 dataSet。
        dataSet.length = 0;

        // 產生已釘選的內容的內容。
        processedDataSet.forEach((item) => {
            // 0：影片 ID、1：開始秒數、2：歌名。
            const tempArray = item.split(StringSet.Separator),
                videoID = tempArray[0],
                startSeconds = tempArray[1],
                timestamp = Function.convertToYTTimestamp(startSeconds),
                songName = tempArray[2];

            if (timestamp.indexOf(NaN) !== -1) {
                return;
            }

            const elemP = document.createElement("p"),
                elemDel = document.createElement("a"),
                elemSpace1 = document.createElement("span"),
                elemTimestamp = document.createElement("a"),
                elemSpace2 = document.createElement("span"),
                elemName = document.createElement("span");

            elemP.style.fontSize = "1.4rem";

            elemSpace1.textContent = " ";
            elemSpace2.textContent = " ";

            elemDel.text = "[X]";
            elemDel.title = chrome.i18n.getMessage("stringClickToDelete");
            elemDel.href = "javascript:void(0);";
            elemDel.style.color = "#FF0000";
            elemDel.addEventListener("mouseover", (event) => {
                event.preventDefault();

                elemDel.style.color = "#FFFFFF";
            });
            elemDel.addEventListener("mouseout", (event) => {
                event.preventDefault();

                elemDel.style.color = "#FF0000";
            });
            elemDel.addEventListener("click", (event) => {
                event.preventDefault();

                elemP.remove();
            });

            elemP.appendChild(elemDel);

            elemTimestamp.text = timestamp;
            elemTimestamp.title = chrome.i18n.getMessage("stringClickToPlay");
            elemTimestamp.href = `/watch?v=${videoID}&t=${startSeconds}s`;
            elemTimestamp.style.color = "#FFFF00";

            doAddAnchorEvents(elemTimestamp);

            elemP.appendChild(elemSpace1);
            elemP.appendChild(elemTimestamp);

            elemName.textContent = songName;
            elemName.title = chrome.i18n.getMessage("stringClickToEdit");
            elemName.contentEditable = true;
            elemName.style.color = "#FFFFFF";
            elemName.style.marginRight = "8px";

            elemP.appendChild(elemSpace2);
            elemP.appendChild(elemName);

            elemPinnedContentContentsContainer.appendChild(elemP);
        });

        // 清除 processedDataSet。
        processedDataSet.length = 0;
    }

    /**
     * 執行建立 UI
     */
    function doCreateUI() {
        const elemPinnedContentMainContainer = document.createElement("div"),
            elemPinnedContentTitleContainer = document.createElement("div"),
            elemPinnedContentTitle = document.createElement("div"),
            elemBtnCloseContainer = document.createElement("div"),
            elemBtnClose = document.createElement("a"),
            elemPinnedContentContentsContainer = document.createElement("div");

        elemPinnedContentMainContainer.id = "dPinnedContentMainContainer";
        elemPinnedContentMainContainer.style.backgroundColor =
            "rgba(0, 0, 0, 0.75)";
        elemPinnedContentMainContainer.style.borderRadius = "12px";
        elemPinnedContentMainContainer.style.margin = "8px";
        elemPinnedContentMainContainer.style.padding = "8px";
        elemPinnedContentMainContainer.style.position = "absolute";
        elemPinnedContentMainContainer.style.zIndex = "1000";

        elemPinnedContentTitleContainer.id = "dPinnedContentTitleContainer";
        elemPinnedContentTitleContainer.style.display = "flex";
        elemPinnedContentTitleContainer.style.marginBottom = "4px";
        elemPinnedContentTitleContainer.style.userSelect = "none";

        // 滑鼠拖曳移動功能。
        // 來源：https://stackoverflow.com/a/45831670

        elemPinnedContentTitle.addEventListener("mouseover", () => {
            elemPinnedContentTitle.style.cursor = "pointer";
        });
        elemPinnedContentTitle.addEventListener("mouseout", () => {
            elemPinnedContentTitle.style.cursor = "";
        });
        elemPinnedContentTitle.addEventListener("mousedown", (event) => {
            isDownAnHold = true;

            if (
                elemPinnedContentMainContainer.style.transform === null ||
                elemPinnedContentMainContainer.style.transform === ""
            ) {
                offset = [
                    elemPinnedContentMainContainer.offsetLeft - event.clientX,
                    elemPinnedContentMainContainer.offsetTop - event.clientY,
                ];
            } else {
                // 來源：https://stackoverflow.com/a/52733535
                // 0：原字串、1：X 軸、2：Y 軸。
                const transformData = elemPinnedContentMainContainer.style
                    .transform
                    .match(/translate\((.*?), (.*?)\)/);

                const currentX = parseInt(transformData[1].replace("px", "")),
                    currentY = parseInt(transformData[2].replace("px", ""));

                offset = [
                    currentX - event.clientX,
                    currentY - event.clientY,
                ];
            }
        });

        document.addEventListener("mouseup", (event) => {
            if (event.target !== null) {
                if (event.target.id === "sTitle") {
                    elemPinnedContentTitle.style.cursor = "pointer";
                } else {
                    elemPinnedContentTitle.style.cursor = "";
                }
            } else {
                elemPinnedContentTitle.style.cursor = "";
            }

            isDownAnHold = false;
        });
        document.addEventListener("mousemove", (event) => {
            if (isDownAnHold) {
                if (elemPinnedContentTitle.style.cursor !== "move") {
                    elemPinnedContentTitle.style.cursor = "move";
                }

                coordinateXY = [
                    event.clientX + offset[0],
                    event.clientY + offset[1],
                ];
            }
        });

        // 來源：https://stackoverflow.com/a/46484405
        window.requestAnimationFrame(function animation() {
            elemPinnedContentMainContainer.style.transform = `translate(${coordinateXY[0]
                }px, ${coordinateXY[1]}px)`;

            window.requestAnimationFrame(animation);
        });

        elemPinnedContentTitle.id = "dPinnedContentTitle";
        elemPinnedContentTitle.textContent = chrome.i18n.getMessage(
            "stringPinnedContent",
        );
        elemPinnedContentTitle.title = chrome.i18n.getMessage(
            "stringDoubleClickToToggle",
        );
        elemPinnedContentTitle.style.color = "#FFFFFF";
        elemPinnedContentTitle.style.fontSize = "1.5rem";
        elemPinnedContentTitle.style.fontWeight = "bold";
        elemPinnedContentTitle.style.flex = "auto";
        elemPinnedContentTitle.style.marginRight = "4px";
        elemPinnedContentTitle.addEventListener("dblclick", (event) => {
            event.preventDefault();

            // 開闔 PinnedContentMainContainer。
            doTogglePinnedContentMainContainer(
                elemPinnedContentMainContainer,
                elemPinnedContentTitleContainer,
                elemPinnedContentTitle,
                elemPinnedContentContentsContainer,
            );
        });

        elemBtnCloseContainer.style.flex = "auto";
        elemBtnCloseContainer.style.textAlign = "right";

        elemPinnedContentTitleContainer.appendChild(elemPinnedContentTitle);
        elemPinnedContentTitleContainer.appendChild(elemBtnCloseContainer);

        elemBtnClose.text = "[X]";
        elemBtnClose.href = "javascript:void(0);";
        elemBtnClose.style.color = "#FF0000";
        elemBtnClose.style.fontSize = "1.5rem";
        elemBtnClose.style.fontWeight = "bold";
        elemBtnClose.style.textDecoration = "none";
        elemBtnClose.title = chrome.i18n.getMessage("stringClickToClose");
        elemBtnClose.addEventListener("mouseover", (event) => {
            event.preventDefault();

            elemBtnClose.style.color = "#FFFFFF";
        });
        elemBtnClose.addEventListener("mouseout", (event) => {
            event.preventDefault();

            elemBtnClose.style.color = "#FF0000";
        });
        elemBtnClose.addEventListener("click", (event) => {
            event.preventDefault();

            elemPinnedContentMainContainer.remove();
        });

        elemBtnCloseContainer.appendChild(elemBtnClose);

        elemPinnedContentMainContainer.appendChild(elemPinnedContentTitleContainer);

        elemPinnedContentContentsContainer.id = "dPinnedContentContentsContainer";
        elemPinnedContentContentsContainer.style.maxHeight = "25vh";
        elemPinnedContentContentsContainer.style.overflowY = "auto";
        elemPinnedContentContentsContainer.style.scrollbarColor = "#FFFFFF";

        elemPinnedContentMainContainer.appendChild(
            elemPinnedContentContentsContainer,
        );

        doCreateOrUpdateTempContainer(elemPinnedContentMainContainer);
    }

    /**
     * 執行釘選已選取的內容
     */
    function doPinSelectedContent() {
        // 每次都重新建立 UI。
        doCreateUI();

        const elemPinnedContentContentsContainer = document.getElementById(
            "dPinnedContentContentsContainer",
        );

        if (
            elemPinnedContentContentsContainer === undefined ||
            elemPinnedContentContentsContainer === null
        ) {
            console.error(
                chrome.i18n.getMessage(
                    "messageElemPinnedContentContentsContainerIsUndefinedOrNull",
                ),
            );

            return;
        }

        doProcessData(elemPinnedContentContentsContainer);
    }

    /**
     * 執行附加釘選已選取的內容
     */
    function doAppendPinSelectedContent() {
        let elemPinnedContentContentsContainer = document.getElementById(
            "dPinnedContentContentsContainer",
        );

        if (
            elemPinnedContentContentsContainer === undefined ||
            elemPinnedContentContentsContainer === null
        ) {
            // 當 UI 不存在時才重新建立 UI。
            doCreateUI();
        }

        elemPinnedContentContentsContainer = document.getElementById(
            "dPinnedContentContentsContainer",
        );

        if (
            elemPinnedContentContentsContainer === undefined ||
            elemPinnedContentContentsContainer === null
        ) {
            console.error(
                chrome.i18n.getMessage(
                    "messageElemPinnedContentContentsContainerIsUndefinedOrNull",
                ),
            );

            return;
        }

        doProcessData(elemPinnedContentContentsContainer);
        doReturnToVideo();
    }

    /**
     * 執行建立或更新暫時的容器
     *
     * @param {HTMLElement} htmlElement HTMLElement。
     */
    function doCreateOrUpdateTempContainer(htmlElement) {
        const elemContainer = document.querySelector(".style-scope.ytd-player");

        if (elemContainer === undefined || elemContainer === null) {
            console.error(
                chrome.i18n.getMessage("messageElemContainerIsUndefinedOrNull"),
            );

            return;
        }

        const elemHtml5VideoPlayer = document.querySelector(".html5-video-player");

        if (elemHtml5VideoPlayer === undefined || elemHtml5VideoPlayer === null) {
            console.error(
                chrome.i18n.getMessage("messageElemHtml5VideoPlayerIsUndefinedOrNull"),
            );

            return;
        }

        const elemVideo = document.querySelector("video");

        if (elemVideo === undefined || elemVideo === null) {
            console.error(
                chrome.i18n.getMessage("messageElemVideoIsUndefinedOrNull"),
            );

            return;
        }

        // 先移除 PinnedContentMainContainer。
        doRemovePinnedContentMainContainer();

        elemContainer.insertBefore(htmlElement, elemHtml5VideoPlayer);

        // 設定 dPinnedContentMainContainer 的最小寬度。
        const elemPinnedContentContentsContainer = document.getElementById(
            "dPinnedContentContentsContainer",
        );

        if (
            elemPinnedContentContentsContainer !== undefined &&
            elemPinnedContentContentsContainer !== null
        ) {
            htmlElement.style.minWidth =
                `${elemPinnedContentContentsContainer.clientWidth}px`;
        }

        doReturnToVideo();
    }

    /**
     * 執行回到 Video 標籤的位置
     */
    function doReturnToVideo() {
        const elemVideo = document.querySelector("video");

        if (elemVideo === undefined || elemVideo === null) {
            console.error(
                chrome.i18n.getMessage("messageElemVideoIsUndefinedOrNull"),
            );

            return;
        }

        // 回到影片播放器的位置。
        const rectOfElemVideo = elemVideo.getBoundingClientRect();

        window.scrollTo(rectOfElemVideo.left, rectOfElemVideo.top);
    }

    /**
     * 執行加入 HTMLAnchorElement 的事件
     *
     * @param {HTMLAnchorElement} htmlAnchorElement HTMLAnchorElement。
     */
    function doAddAnchorEvents(htmlAnchorElement) {
        htmlAnchorElement.addEventListener("mouseover", (event) => {
            event.preventDefault();

            htmlAnchorElement.style.color = "#FFFFFF";
        });

        htmlAnchorElement.addEventListener("mouseout", (event) => {
            event.preventDefault();

            htmlAnchorElement.style.color = "#FFFF00";
        });

        htmlAnchorElement.addEventListener("click", (event) => {
            event.preventDefault();

            htmlAnchorElement.style.color = "#00FF00";

            const elemVideo = document.querySelector("video");

            if (elemVideo === undefined || elemVideo === null) {
                console.error(
                    chrome.i18n.getMessage("messageElemVideoIsUndefinedOrNull"),
                );

                return;
            }

            const currentUrl = window.location.href,
                // 0：影片 ID、1：開始秒數。
                tempArray1 = Function.getYouTubeIdAndStartSec(currentUrl),
                // 0：影片 ID、1：開始秒數。
                tempArray2 = Function.getYouTubeIdAndStartSec(htmlAnchorElement.href);

            if (tempArray1[0] === "") {
                // 理論上應處於畫中畫模式。

                // TODO: 2023/2/16 暫時先不進行任何處理。
            } else if (tempArray1[0] !== tempArray2[0]) {
                // 移除 PinnedContentMainContainer。
                doRemovePinnedContentMainContainer();

                alert(chrome.i18n.getMessage("messageTheVideoIDDoesNotMatch"));

                return;
            }

            elemVideo.currentTime = tempArray2[1];
            elemVideo.play();
        });
    }

    /**
     * 執行註冊事件監聽器
     */
    function doRegisterEventListener() {
        window.addEventListener("keydown", (event) => {
            const currentUrl = window.location.href;
            // 非嚴謹判斷目前的網頁的網址。
            const isYouTubeVideo = currentUrl.indexOf("watch?v=") !== -1;

            if (event.shiftKey && event.code === "KeyU" && isYouTubeVideo) {
                // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + U 鍵。
                doPinSelectedContent();
            } else if (event.shiftKey && event.code === "KeyQ" && isYouTubeVideo) {
                // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + Q 鍵。
                doAppendPinSelectedContent();
            } else if (event.shiftKey && event.code === "KeyY" && isYouTubeVideo) {
                // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + Y 鍵。
                doRemovePinnedContentMainContainer();
            } else if (event.shiftKey && event.code === "KeyA" && isYouTubeVideo) {
                // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + A 鍵。
                doResetPinnedContentMainContainerPosition();
            } else if (event.shiftKey && event.code === "KeyW" && isYouTubeVideo) {
                // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + W 鍵。
                doTogglePinnedContentMainContainer();
            }
        });
    }

    /**
     * 執行注入自定義 CSS 樣式
     */
    function doInjectCustomCSS() {
        const css1 = "/* 針對 Mozilla Firefox。 */" +
            "#dPinnedContentContentsContainer {" +
            "scrollbar-width: 12px;" +
            "scrollbar-color: #FFFFFF rgba(255, 255, 255, 0.3);" +
            "}";
        const css2 = "#dPinnedContentContentsContainer::-webkit-scrollbar {" +
            "width: 12px;" +
            "}";
        const css3 = "#dPinnedContentContentsContainer::-webkit-scrollbar-thumb {" +
            "background-color: #FFFFFF;" +
            "border-radius: 12px;" +
            "}";
        const css4 = "#dPinnedContentContentsContainer::-webkit-scrollbar-track {" +
            "background: rgba(255, 255, 255, 0.3);" +
            "border-radius: 12px;" +
            "}";
        const cssSet = [css1, css2, css3, css4];

        Function.insertStyleSheetRules(cssSet);
    }

    /**
     * 執行移除 PinnedContentMainContainer
     */
    function doRemovePinnedContentMainContainer() {
        const elemPinnedContentMainContainer = document.getElementById(
            "dPinnedContentMainContainer",
        );

        if (
            elemPinnedContentMainContainer !== undefined &&
            elemPinnedContentMainContainer !== null
        ) {
            elemPinnedContentMainContainer.remove();
        }
    }

    /**
     * 執行重設 PinnedContentMainContainer 的位置
     */
    function doResetPinnedContentMainContainerPosition() {
        const elemPinnedContentMainContainer = document.getElementById(
            "dPinnedContentMainContainer",
        );

        if (
            elemPinnedContentMainContainer !== undefined &&
            elemPinnedContentMainContainer !== null
        ) {
            coordinateXY = [
                elemPinnedContentMainContainer.offsetLeft,
                elemPinnedContentMainContainer.offsetTop,
            ];
        }
    }

    /**
     * 執行開闔 PinnedContentMainContainer
     *
     * @param {HTMLDivElement} elemPinnedContentMainContainer HTML Div 元素，PinnedContentMainContainer。
     * @param {HTMLDivElement} elemPinnedContentTitleContainer HTML Div 元素，PinnedContentTitleContainer。
     * @param {HTMLDivElement} elemPinnedContentTitle HTML Div 元素，PinnedContentTitle。
     * @param {HTMLDivElement} elemPinnedContentContentsContainer HTML Div 元素，PinnedContentContentsContainer。
     */
    function doTogglePinnedContentMainContainer(
        elemPinnedContentMainContainer = null,
        elemPinnedContentTitleContainer = null,
        elemPinnedContentTitle = null,
        elemPinnedContentContentsContainer = null,
    ) {
        if (elemPinnedContentMainContainer === null) {
            elemPinnedContentMainContainer = document.getElementById(
                "dPinnedContentMainContainer",
            );
        }

        if (elemPinnedContentTitleContainer === null) {
            elemPinnedContentTitleContainer = document.getElementById(
                "dPinnedContentTitleContainer",
            );
        }

        if (elemPinnedContentTitle === null) {
            elemPinnedContentTitle = document.getElementById("dPinnedContentTitle");
        }

        if (elemPinnedContentContentsContainer === null) {
            elemPinnedContentContentsContainer = document.getElementById(
                "dPinnedContentContentsContainer",
            );
        }

        if (
            elemPinnedContentMainContainer !== undefined &&
            elemPinnedContentMainContainer !== null &&
            elemPinnedContentTitleContainer !== undefined &&
            elemPinnedContentTitleContainer !== null &&
            elemPinnedContentTitle !== undefined &&
            elemPinnedContentTitle !== null &&
            elemPinnedContentContentsContainer !== undefined &&
            elemPinnedContentContentsContainer !== null
        ) {
            // 判定 isSetTempMinWidth。
            if (isSetTempMinWidth === false) {
                // 設定 tempMinWidth。
                tempMinWidth = elemPinnedContentMainContainer.style.minWidth;

                isSetTempMinWidth = true;
            }

            if (elemPinnedContentContentsContainer.style.display !== "none") {
                elemPinnedContentMainContainer.style.minWidth =
                    `${elemPinnedContentTitle.clientWidth}px`;

                elemPinnedContentTitleContainer.style.marginBottom = "";

                elemPinnedContentContentsContainer.style.display = "none";
            } else {
                elemPinnedContentMainContainer.style.minWidth = tempMinWidth;

                elemPinnedContentTitleContainer.style.marginBottom = "4px";

                elemPinnedContentContentsContainer.style.display = "";
            }
        }
    }
}