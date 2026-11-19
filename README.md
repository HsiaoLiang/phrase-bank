# Phrase Bank

上課、跟同學聊天、coffee chat 和面試用得到的英文句子，加上遊戲化的練習。

網站：https://hsiaoliang.github.io/phrase-bank/

## 功能

- **單字卡**：點卡片翻面，可切換先看中文或英文；方向鍵換卡、空白鍵翻面
- **學習**：自己判斷「記得了 / 還不熟」，連續記得有連擊加成
- **測驗**：中翻英四選一，結束後列出答錯的題目
- **配對**：計時把英文和中文配成一對，配錯加 1 秒，會記錄最佳時間
- **遊戲化**：經驗值與等級、每日目標、連續學習天數、13 個成就、每組的銅／銀／金／制霸里程碑
- 左側欄：分類進度、章節導覽、篩選；右側欄：等級、每日目標、本週紀錄、成就
- 搜尋、語氣篩選、收藏、朗讀英文、一鍵複製、自己新增句子、深色模式

收藏、學習進度、經驗值和自己新增的句子都存在瀏覽器的 localStorage。

## 開發

原始碼在 `app/`（React + TypeScript + Tailwind CSS + shadcn/ui）。根目錄的 `index.html` 是打包好的單一檔案，GitHub Pages 直接發佈它。

```bash
cd app
pnpm install
pnpm dev          # 本機開發
pnpm run bundle   # 打包並覆寫根目錄的 index.html
```

改完記得跑 `pnpm run bundle`，再把 `index.html` 一起 commit。
