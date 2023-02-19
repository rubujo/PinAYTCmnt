# 釘選 YouTube 留言

## 一、簡述

提供將已選取的 YouTube 留言內的時間軸資料，釘選在 YouTube 的影片播放器的上方的功能。

## 二、使用說明

### 1. 使用的步驟

```markdown
1. 開啟欲觀賞的 YouTube 影片頁面。
2. 找到留有時間軸的留言。
3. 僅選取"時間軸"有關的內容。 [^1]
4. 點選滑鼠右鍵，在右鍵選單內選擇"釘選已選取的內容"。
5. 雙擊"已釘選的內容"字樣，以開闔已釘選的內容。
6. 在"已釘選的內容"字樣外的區域，點擊並拖曳以移動介面。
7. 點選 "[X]" 字樣，以解除釘選已選取的內容。
```

### 2. 快捷鍵說明

#### (1). 可自定義式快捷鍵 [^2]

```markdown
1. Shift + Alt + U：釘選已選取的內容
2. Shift + Alt + Y：解除釘選已選取的內容
3. Shift + Alt + A：重設已釘選內容的位置
4. Shift + Alt + W：開闔已釘選的內容
```

#### (2). 固定式快捷鍵 [^3]

```markdown
1. Shift + U：釘選已選取的內容
2. Shift + Y：解除釘選已選取的內容
3. Shift + A：重設已釘選內容的位置
4. Shift + W：開闔已釘選的內容
```

※若是於 Mozilla Firefox 上，要使用上述的固定式快捷鍵時，請先關閉 "打字時直接搜尋頁面文字（隨打即找）" 功能，否則會發生衝突的狀況。

## 三、安裝說明

### 1. Google Chrome, Chromium 系列

```markdown
1. 先將下載的壓縮檔解壓縮至您喜歡的路徑。
2. 進入解壓縮後得到的 "PinAYTCmnt" 資料夾內。
3. 刪除 "manifestFx.json"。 [^4]
4. 開啟網頁瀏覽器，並開啟"擴充功能"頁面。
5. 啟用"開發人員模式"。
6. 選擇"載入未封裝的項目"或"載入解壓縮"。[^5]
7. 選擇 "PinAYTCmnt" 資料夾所在的路徑。
```

### 2. Mozilla Firefox

```markdown
1. 先將下載的壓縮檔解壓縮至您喜歡的路徑。
2. 進入解壓縮後得到的 "PinAYTCmnt" 資料夾內。
3. 刪除 "manifest.json"，並將 "manifestFx.json" 重新命名成 "manifest.json"。 [^6]
4. 將在此資料夾內的所有檔案，壓縮成 Zip 壓縮檔。
5. 參考 "https://extensionworkshop.com/documentation/publish/"
   此頁面的說明，發行自我簽屬的 .xpi 檔案。
6. 開啟網頁瀏覽器，並開啟"附加元件以及佈景主題"頁面。
7. 拖曳已簽屬的 .xpi 檔案至此頁面，用以安裝加元件。
8. 至"釘選 YouTube 留言"的"權限"頁籤，手動將權限都開啟。 [^7]
```

---

- [^1] 只能選取與"時間軸"有關的內容，其他內容都不能選擇，否則解析時會產生非預期的結果。
- [^2] 可以自行修改設定。
- [^3] 不可修改設定，主要提供給 Vivaldi 網頁瀏覽器使用。
- [^4] 必須要執行。
- [^5] 此處的名稱會因為各網頁瀏覽器的翻譯而有所不同。
- [^6] 必須要執行。
- [^7] 必須要執行，否則快捷鍵不會生效。