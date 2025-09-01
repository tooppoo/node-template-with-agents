# AGENTS.md 初期生成とクリーンアップ手順（テンプレート構築用）

この手順は「テンプレートから作成した新規リポジトリ」で **初回に一度だけ**実行します。

## 前提
- 次のファイル/ディレクトリが存在していること
  - `template/inputs/AGENTS.template.md`
  - `template/inputs/params.json`（公開可能な値のみを記入）
  - `template/scripts/generate-agents.mjs`
  - `template/scripts/cleanup-template.mjs`
  - `template/cleanup.json`
  - `.vscode/tasks.json`（タスク定義）
- GitHub Codespaces もしくは VS Code でタスクが実行できること

## 用語
- **AGENTS.template.md**: 変数（`{{VAR}}`）を含む原本
- **params.json**: 変数へ埋め込む値の集合（公開可能情報のみ）
- **AGENTS.md**: 生成結果（レビュー・コミット対象）
- **クリーンアップ**: 初期化用途のテンプレ資料を派生リポジトリから削除すること

## 手順（初期生成）
1. `template/inputs/params.json` を編集（※機密は入れない）
2. エディタで **「Tasks: Run Task → AGENTS生成」** を実行  
   - `AGENTS.md` が生成されます
   - 未解決の `{{VAR}}` があれば **警告**が出ます（処理は続行）
3. `AGENTS.md` をレビュー  
   - 未解決の `{{VAR}}` が残っていないか
   - 機密情報が混入していないか
4. 変更をブランチにコミット

## 手順（PR作成とクリーンアップ）
1. **PR を作成**し、テンプレート選択で **「AGENTS-init」** を選ぶ
2. エディタで **「Tasks: Run Task → テンプレートクリーンアップ」** を実行  
   - `template/cleanup.json` に列挙されたテンプレ専用ファイルを削除します  
   - 実行時に削除候補が表示されます（確認してから削除）
3. 削除ログを PR 本文の「削除ログ」欄へ貼り付け
4. レビュー → マージ

> **注意**: クリーンアップは **PR作成後** に実行してください。先に削除すると「AGENTS-init」PRテンプレートを選べません。

## 再生成
- `params.json` を更新 → **AGENTS生成** を再実行（上書き）
- 差分をレビュー → コミット

## PR レビュー時の確認事項
- `AGENTS.md` 内に未解決の `{{VAR}}` が残っていないか
- 機密情報が含まれていないか
- クリーンアップ後の削除ログが PR 本文に貼られているか
