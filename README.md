# MPU-45 微處理機考前通關考驗

以 React、TypeScript 與 Vite 製作的繁體中文考前闖關網站。內容依據提供的期末考卷與 A4 懶人包整理，共 8 關、45 個客觀計分項目，並包含訂正通關、錯題本、CPU-Z 圖像判讀與班級排行榜。

## 本機開發

```bash
npm install
npm run dev
```

測試與正式建置：

```bash
npm test
npm run build
```

## Netlify 部署

1. 將整個專案推送到 GitHub；不要只上傳 `dist`，否則不會包含排行榜 Functions。
2. 在 Netlify 選擇 **Add new project > Import an existing project > GitHub**，再選取儲存庫。
3. `netlify.toml` 已設定 Node 22、`npm run build`、`dist` 發布目錄、Functions 目錄與 SPA rewrite，Netlify 應會自動讀取，直接按 **Deploy** 即可。
4. `@netlify/blobs` 在 Netlify Functions 內會自動取得站台憑證，不需把 token 放進前端環境變數，也不必另外建立資料庫。
5. 部署後開啟 `https://你的站名.netlify.app/.netlify/functions/leaderboard?limit=20`，應先看到 `{"entries":[]}`；完成一次通關後再確認排行榜出現成績。

排行榜採匿名 `playerId`，每次通關保存一筆唯一紀錄，讀取時只顯示同一裝置的最佳成績。它是班級激勵功能，不是防作弊考試系統。

## 主要模組

- `shared/questions.ts`：45 題客觀題、1 題引導問答與教材註記。
- `shared/scoring.ts`：前後端共用的答案正規化與計分。
- `src/lib/game.ts`：版本化進度、首次答案鎖定與訂正流程。
- `netlify/functions/`：成績驗證、Blobs 寫入與排行榜彙整。
