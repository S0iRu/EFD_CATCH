# EFD CATCH!

エイチフィッシュデーモン(EFD)を捕まえるブラウザゲームです。

## GitHub Pages へのデプロイ手順

1. GitHubで新しいリポジトリを作成（例: `EFD-Game`）
2. このフォルダの中身をリポジトリにプッシュ:

```bash
cd EFD-Game
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/S0iRu/EFD_CATCH.git
git push -u origin main
```

3. GitHub リポジトリの **Settings > Pages** を開く
4. **Source** を `Deploy from a branch` に設定
5. **Branch** を `main` / `/ (root)` に設定して Save
6. 数分後に `https://S0iRu.github.io/EFD_CATCH/` でアクセス可能

## カスタマイズ

- **カラーの変更**: `style.css` の `:root` 内の CSS 変数を編集
