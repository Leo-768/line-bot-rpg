# 使用說明書
## 檔案結構
```
data
|- file
|- imagemap
|- message
|- story
```
```
setup
|- richmenu-set
|- index.js
```
### data/file
```
file  
|- menu
    |- <介面名稱>
        |- 240
        |- 300
        |- 460
        |- 700
        |- 1040
    |- <介面名稱2>
        |- 240
        |- 300
        |- 460
        |- 700
        |- 1040
    |- ……
|- ……
|- ……
```
用於放置要讀取的檔案，格式不限，可以自行新增資料夾，但一定要有`menu`資料夾，詳見[介面](#介面)節。
### data/imagemap
```
imagemap
|- <介面名稱>.json
|- <介面名稱2>.json
|- ……
    |- ……
|- ……
|- ……

```
用於放置[影像地圖訊息](https://developers.line.biz/en/reference/messaging-api/#imagemap-message)的設定資料，可以自行新增資料夾，但一定要有介面資料，詳見[介面](#介面)節。

內容以`json`儲存，`type`與`baseUrl`需省略。
### data/message
```
message
|- welcome.json
|- alttext.json
```
系統訊息，目前只有`welcome.json`與`alttext.json`兩者。
#### welcome.json
在加入好友時發出。
#### alttext.json
用於特殊訊息之替代文字。
### data/story
```
story
|- index.json
|- begin
    |- index.json
    |- <故事檔案a>.json
    |- <故事檔案b>.json
    |- <故事檔案c>.json
    |- ……
|- <stageA>
    |- index.json
    |- <故事檔案a>.json
    |- <故事檔案b>.json
    |- <故事檔案c>.json
    |- ……
|- <stageB>
    |- index.json
    |- <故事檔案a>.json
    |- <故事檔案b>.json
    |- <故事檔案c>.json
    |- ……
|- ……
```
故事主體，放置故事資料的地方。

必須有資料夾`begin`。

以下設`<stageA>`為`stageA`、`<故事檔案c>`為`故事檔案c`，依此類推，用以舉例。
#### index.json
```json
["begin","stageA","stageB","stageC","stageD"]
```
列出`story`旗下的所有資料夾，無實際效果，僅作程式遍歷用。
#### \<stage\>/index.js
```json
["故事檔案a.json","故事檔案b.json","故事檔案c.json"]
```
列出`<stage>`旗下的所有故事檔案，在故事檔案執行結束時，將依此順序移動至下個檔案。
#### 故事檔案
見[格式說明](#格式)