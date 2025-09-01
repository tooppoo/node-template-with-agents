import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const MANIFEST_PATH = path.join(repoRoot, "template/cleanup.json");

// ============= ユーティリティ =============
function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    fail(`JSON の読み込みに失敗しました: ${path.relative(repoRoot, filePath)}\n${e?.message ?? e}`);
  }
}

function askYesNo(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => {
      rl.close();
      const a = String(ans).trim().toLowerCase();
      resolve(a === "y" || a === "yes");
    });
  });
}

// ============= 前提チェック =============
if (!fs.existsSync(MANIFEST_PATH)) {
  fail(`manifest が見つかりません: ${path.relative(repoRoot, MANIFEST_PATH)}`);
}
const manifest = loadJSON(MANIFEST_PATH);
const allowList = Array.isArray(manifest.paths) ? manifest.paths : [];
const requireConfirm = !!(manifest.options && manifest.options.requireConfirm);

if (allowList.length === 0) {
  console.log("削除対象が空です。何もしません。");
  process.exit(0);
}

// パス解決 & 存在確認
const candidates = allowList.map((rel) => ({
  rel,
  abs: path.join(repoRoot, rel),
  exists: fs.existsSync(path.join(repoRoot, rel)),
}));

const toDelete = candidates.filter((c) => c.exists);
if (toDelete.length === 0) {
  console.log("削除対象ファイルは見つかりませんでした。");
  process.exit(0);
}

console.log("削除候補:");
toDelete.forEach((c) => console.log(" -", c.rel));

// 確認（FORCE_YES=1 ならスキップ可）
const proceed = requireConfirm && !process.env.FORCE_YES ? await askYesNo("これらを削除します。よろしいですか？ [y/N]: ") : true;

if (!proceed) {
  console.log("キャンセルしました。");
  process.exit(0);
}

// 削除実行（ディレクトリは削除しない）
const deleted = [];
for (const item of toDelete) {
  try {
    const stat = fs.statSync(item.abs);
    if (stat.isDirectory()) {
      console.warn("⚠ ディレクトリはスキップ:", item.rel);
      continue;
    }
    fs.rmSync(item.abs);
    deleted.push(item.rel);
    console.log("🗑️ 削除:", item.rel);
  } catch (e) {
    console.warn("⚠ 削除に失敗:", item.rel, "-", e?.message ?? e);
  }
}

if (deleted.length === 0) {
  console.log("削除は行われませんでした。");
  process.exit(0);
}

console.log("\n✅ クリーンアップ完了。以下を PR 本文に貼り付けてください:\n");
deleted.forEach((rel) => console.log(" -", rel));
