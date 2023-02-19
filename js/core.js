"use strict";

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
    chrome.runtime.sendMessage(Function.MessageWakeUp);

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
    chrome.runtime.onMessage.addListener(async (response, _sender, _sendResponse) => {
        if (response === Function.CommandPinSelectedContent) {
            await doPinSelectedContent();
        } else if (response === Function.CommandUnpinSelectedContent) {
            doRemoveSongListContainer();
        } else if (response === Function.CommandPinSelectedContent) {
            doResetSongListContainerPosition();
        }
    });

    /**
     * 執行釘選已選取的內容
     */
    async function doPinSelectedContent() {
        // 取得已選取的 YouTube 留言內容。
        const dataSet = await Function.extractYouTubeComment();

        if (dataSet.length <= 0) {
            alert(chrome.i18n.getMessage("messageSelectTheCommentContentFirst"));

            return;
        }

        // TODO: 2023-02-16 未來會需要再調整。
        // 前處理資料。

        const processedDataSet = [];

        let isStartEndFormat = false,
            tempVideoID = "",
            tempStartSeconds = "";

        dataSet.forEach((item) => {
            // 0：影片 ID、1：開始秒數、2：歌名。
            const tempArray = item.split(Function.Seperator),
                videoID = tempArray[0],
                startSeconds = tempArray[1],
                timestamp = Function.convertToYTTimestamp(startSeconds),
                songName = Function.removeUrl(tempArray[2]);

            if (timestamp.indexOf(NaN) !== -1) {
                return;
            }

            // 判斷 songName 是否不為空值、"-" 或是 "~"（以及相關的數種組合）。
            // 當 songName 為上列值時，則表示留言內是用該值分隔開始與結束時間。
            if (songName !== "" &&
                songName !== "-" &&
                songName !== "- " &&
                songName !== " - " &&
                songName !== " -" &&
                songName !== "~" &&
                songName !== "~ " &&
                songName !== " ~ " &&
                songName !== " ~" &&
                songName !== "、" &&
                songName !== "、 " &&
                songName !== " 、" &&
                songName !== " 、 ") {
                if (isStartEndFormat) {
                    const newItem = `${tempVideoID}${Function.Seperator}` +
                        `${tempStartSeconds}${Function.Seperator}` +
                        `${songName}`;

                    processedDataSet.push(newItem);

                    isStartEndFormat = false;
                    tempVideoID = "";
                    tempStartSeconds = "";
                } else {
                    const newItem = `${videoID}${Function.Seperator}` +
                        `${startSeconds}${Function.Seperator}` +
                        `${songName}`;

                    processedDataSet.push(newItem);
                }
            } else {
                isStartEndFormat = true;
                tempVideoID = videoID;
                tempStartSeconds = startSeconds;
            }
        });

        // 清除 dataSet。
        dataSet.length = 0;

        const elemMainContainer = document.createElement("div"),
            elemTitleContainer = document.createElement("div"),
            elemTitle = document.createElement("div"),
            elemBtnContainer = document.createElement("div"),
            elemBtn = document.createElement("a"),
            elemContentContainer = document.createElement("div");

        elemMainContainer.id = "dSongListContainer";
        elemMainContainer.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
        elemMainContainer.style.borderRadius = "12px";
        elemMainContainer.style.margin = "8px";
        elemMainContainer.style.padding = "8px";
        elemMainContainer.style.position = "absolute";
        elemMainContainer.style.zIndex = "1000";

        elemTitleContainer.style.display = "flex";
        elemTitleContainer.style.marginBottom = "4px";
        elemTitleContainer.style.userSelect = "none";

        // TODO: 2023-02-16 有效能不佳的情況。
        // 滑鼠拖曳移動功能。
        // 來源：https://stackoverflow.com/a/45831670

        elemTitle.addEventListener("mouseover", () => {
            elemTitle.style.cursor = "pointer";
        });
        elemTitle.addEventListener("mouseout", () => {
            elemTitle.style.cursor = "";
        });
        elemTitle.addEventListener("mousedown", (event) => {
            isDownAnHold = true;

            if (elemMainContainer.style.transform === null ||
                elemMainContainer.style.transform === "") {
                offset = [
                    elemMainContainer.offsetLeft - event.clientX,
                    elemMainContainer.offsetTop - event.clientY
                ];
            } else {
                // 來源：https://stackoverflow.com/a/52733535
                // 0：原字串、1：X 軸、2：Y 軸。
                const transformData = elemMainContainer.style
                    .transform
                    .match(/translate\((.*?), (.*?)\)/);

                const currentX = parseInt(transformData[1].replace("px", "")),
                    currentY = parseInt(transformData[2].replace("px", ""));

                offset = [
                    currentX - event.clientX,
                    currentY - event.clientY
                ];
            }
        });

        document.addEventListener("mouseup", (event) => {
            if (event.target !== null) {
                if (event.target.id === "sTitle") {
                    elemTitle.style.cursor = "pointer";
                } else {
                    elemTitle.style.cursor = "";
                }
            } else {
                elemTitle.style.cursor = "";
            }

            isDownAnHold = false;
        });
        document.addEventListener("mousemove", (event) => {
            if (isDownAnHold) {
                if (elemTitle.style.cursor !== "move") {
                    elemTitle.style.cursor = "move";
                }

                //elemMainContainer.style.left = `${(event.clientX + offset[0])}px`;
                //elemMainContainer.style.top = `${(event.clientY + offset[1])}px`;

                coordinateXY = [
                    event.clientX + offset[0],
                    event.clientY + offset[1]
                ];
            }
        });

        window.requestAnimationFrame(function animation() {
            elemMainContainer.style.transform = `translate(${coordinateXY[0]}px, ${coordinateXY[1]}px)`;

            window.requestAnimationFrame(animation);
        });

        elemTitle.id = "sTitle"
        elemTitle.textContent = chrome.i18n.getMessage("stringSongList");
        elemTitle.title = chrome.i18n.getMessage("stringDoubleClickToToggle");
        elemTitle.style.color = "#FFFFFF";
        elemTitle.style.fontSize = "1.5rem";
        elemTitle.style.fontWeight = "bold";
        elemTitle.style.flex = "auto";
        elemTitle.style.marginRight = "4px";
        elemTitle.addEventListener("dblclick", (event) => {
            event.preventDefault();

            // 判定 isSetTempMinWidth。
            if (isSetTempMinWidth === false) {
                // 設定 tempMinWidth。
                tempMinWidth = elemMainContainer.style.minWidth;

                isSetTempMinWidth = true;
            }

            if (elemContentContainer.style.display !== "none") {
                elemMainContainer.style.minWidth = `${elemTitle.clientWidth}px`;

                elemTitleContainer.style.marginBottom = "";

                elemContentContainer.style.display = "none";
            } else {
                elemMainContainer.style.minWidth = tempMinWidth;

                elemTitleContainer.style.marginBottom = "4px";

                elemContentContainer.style.display = "";
            }
        });

        elemBtnContainer.style.flex = "auto";
        elemBtnContainer.style.textAlign = "right";

        elemTitleContainer.appendChild(elemTitle);
        elemTitleContainer.appendChild(elemBtnContainer);

        elemBtn.text = "[X]";
        elemBtn.href = "javascript:void(0);";
        elemBtn.style.color = "#FF0000";
        elemBtn.style.fontSize = "1.5rem";
        elemBtn.style.fontWeight = "bold";
        elemBtn.style.textDecoration = "none";
        elemBtn.title = chrome.i18n.getMessage("stringClickToClose");
        elemBtn.addEventListener("mouseover", (event) => {
            event.preventDefault();

            elemBtn.style.color = "#FFFFFF";
        });
        elemBtn.addEventListener("mouseout", (event) => {
            event.preventDefault();

            elemBtn.style.color = "#FF0000";
        });
        elemBtn.addEventListener("click", (event) => {
            event.preventDefault();

            elemMainContainer.remove();
        });

        elemBtnContainer.appendChild(elemBtn);

        elemMainContainer.appendChild(elemTitleContainer);

        elemContentContainer.id = "dSongListContentContainer";
        elemContentContainer.style.maxHeight = "25vh";
        elemContentContainer.style.overflowY = "auto";
        elemContentContainer.style.scrollbarColor = "#FFFFFF";

        // 產生歌曲清單的內容。
        processedDataSet.forEach((item) => {
            // 0：影片 ID、1：開始秒數、2：歌名。
            const tempArray = item.split(Function.Seperator),
                videoID = tempArray[0],
                startSeconds = tempArray[1],
                timestamp = Function.convertToYTTimestamp(startSeconds),
                songName = tempArray[2];

            if (timestamp.indexOf(NaN) !== -1) {
                return;
            }

            const elemP = document.createElement("p"),
                elemA = document.createElement("a"),
                elemSpan = document.createElement("span");

            elemP.style.fontSize = "1.4rem"

            elemA.text = timestamp;
            elemA.href = `/watch?v=${videoID}&t=${startSeconds}s`;
            elemA.style.color = "#FFFF00";

            doAddAnchorEvents(elemA);

            elemP.appendChild(elemA);

            elemSpan.textContent = ` ${songName}`;
            elemSpan.contentEditable = true;
            elemSpan.style.color = "#FFFFFF";
            elemSpan.style.marginRight = "8px";

            elemP.appendChild(elemSpan);

            elemContentContainer.appendChild(elemP);
        });

        // 清除 processedDataSet。
        processedDataSet.length = 0;

        elemMainContainer.appendChild(elemContentContainer);

        doCreateOrUpdateTempContainer(elemMainContainer);
    }

    /**
     * 執行建立或更新暫時的容器
     *
     * @param {HTMLElement} htmlElement HTMLElement。
     */
    function doCreateOrUpdateTempContainer(htmlElement) {
        const elemContainer = document.querySelector(".style-scope.ytd-player");

        if (elemContainer === undefined || elemContainer === null) {
            console.error(chrome.i18n.getMessage("messageElemContainerIsUndefinedOrNull"));

            return;
        }

        const elemHtml5VideoPlayer = document.querySelector(".html5-video-player");

        if (elemHtml5VideoPlayer === undefined || elemHtml5VideoPlayer === null) {
            console.error(chrome.i18n.getMessage("messageElemHtml5VideoPlayerIsUndefinedOrNull"));

            return;
        }

        const elemVideo = document.querySelector("video");

        if (elemVideo === undefined || elemVideo === null) {
            console.error(chrome.i18n.getMessage("messageElemVideoIsUndefinedOrNull"));

            return;
        }

        // 先移除 SongListContainer。
        doRemoveSongListContainer();

        elemContainer.insertBefore(htmlElement, elemHtml5VideoPlayer);

        // 設定 dSongListContainer 的最小寬度。
        const elemSongListContentContainer = document.getElementById("dSongListContentContainer");

        if (elemSongListContentContainer !== undefined && elemSongListContentContainer !== null) {
            htmlElement.style.minWidth = `${elemSongListContentContainer.clientWidth}px`;
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
                console.error(chrome.i18n.getMessage("messageElemVideoIsUndefinedOrNull"));

                return;
            }

            const currentUrl = window.location.href,
                // 0：影片 ID、1：開始秒數。
                tempArray1 = Function.getYouTubeIdAndStartSec(currentUrl),
                // 0：影片 ID、1：開始秒數。
                tempArray2 = Function.getYouTubeIdAndStartSec(htmlAnchorElement.href);

            if (tempArray1[0] === "") {
                // 理論上應處於畫中畫模式。

                // TODO: 2023-02-16 暫時先不進行任何處理。
            } else if (tempArray1[0] !== tempArray2[0]) {
                // 移除 SongListContainer。
                doRemoveSongListContainer();

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
            } else if (event.shiftKey && event.code === "KeyY" && isYouTubeVideo) {
                // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + Y 鍵。
                doRemoveSongListContainer();
            } else if (event.shiftKey && event.code === "KeyR" && isYouTubeVideo) {
                // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + R 鍵。
                doResetSongListContainerPosition();
            }
        });
    }

    /**
     * 執行注入自定義 CSS 樣式
     */
    function doInjectCustomCSS() {
        const css1 = "/* for Firefox. */" +
            "#dSongListContentContainer {" +
            "scrollbar-width: 12px;" +
            "scrollbar-color: #FFFFFF rgba(255, 255, 255, 0.3);" +
            "}";
        const css2 = "#dSongListContentContainer::-webkit-scrollbar {" +
            "width: 12px;" +
            "}";
        const css3 = "#dSongListContentContainer::-webkit-scrollbar-thumb {" +
            "background-color: #FFFFFF;" +
            "border-radius: 12px;" +
            "}";
        const css4 = "#dSongListContentContainer::-webkit-scrollbar-track {" +
            "background: rgba(255, 255, 255, 0.3);" +
            "border-radius: 12px;" +
            "}";

        Function.insertStyleSheetRule(css1);
        Function.insertStyleSheetRule(css2);
        Function.insertStyleSheetRule(css3);
        Function.insertStyleSheetRule(css4);
    }

    /**
     * 執行移除 SongListContainer
     */
    function doRemoveSongListContainer() {
        const elemSongListContainer = document.getElementById("dSongListContainer");

        if (elemSongListContainer !== undefined && elemSongListContainer !== null) {
            elemSongListContainer.remove();
        }
    }

    /**
     * 執行重設 SongListContainer 的位置
     */
    function doResetSongListContainerPosition() {
        const elemSongListContainer = document.getElementById("dSongListContainer");

        if (elemSongListContainer !== undefined && elemSongListContainer !== null) {
            coordinateXY = [
                elemSongListContainer.offsetLeft,
                elemSongListContainer.offsetTop
            ]
        }
    }
}