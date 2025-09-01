import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

// 入力/出力パス
const TEMPLATE_PATH = path.join(repoRoot, "template/inputs/AGENTS.template.md");
const PARAMS_PATH = path.join(repoRoot, "template/inputs/params.json");
const OUTPUT_PATH = path.join(repoRoot, "AGENTS.md");

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

// ============= 前提チェック =============
if (!fs.existsSync(TEMPLATE_PATH)) {
  fail(`テンプレートが見つかりません: ${path.relative(repoRoot, TEMPLATE_PATH)}`);
}
if (!fs.existsSync(PARAMS_PATH)) {
  fail(`template.params.json が見つかりません。まず編集してください: ${path.relative(repoRoot, PARAMS_PATH)}`);
}

// ============= パラメータ読み込み =============
const params = loadJSON(PARAMS_PATH);

// 生成メタ情報
const GENERATED_AT = new Date().toISOString();
let PARAMS_COMMIT = "unknown";
try {
  PARAMS_COMMIT = execSync(`git hash-object "${PARAMS_PATH}"`, { cwd: repoRoot }).toString().trim();
} catch {
  // git 未初期化等でも続行可
}

// テンプレート読み込み
let content = fs.readFileSync(TEMPLATE_PATH, "utf8");

// 置換実行（{{KEY}} を params で埋める）
// - params.json にキーが存在する場合のみ値に置換する
// - キーが無い場合はそのまま {{KEY}} を残すことで「置換漏れ」を可視化する
// - Object.prototype.hasOwnProperty.call を使うのは、
//   ・プロトタイプ連鎖由来のプロパティ（toString など）を誤って拾わないため
//   ・プロトタイプ汚染のリスクを避けるため
// - 未解決プレースホルダは「警告止まり」とし、処理は続行する。
//   → 生成された AGENTS.md をレビュー時に人間が気付けるようにする。
const RE_PLACEHOLDER = /\{\{([A-Z0-9_]+)\}\}/g;
content = content.replace(RE_PLACEHOLDER, (_, key) => {
  if (key === "GENERATED_AT") return GENERATED_AT;
  if (key === "PARAMS_COMMIT") return PARAMS_COMMIT;
  return Object.prototype.hasOwnProperty.call(params, key)
    ? String(params[key])
    : `{{${key}}}`;
});

// 未解決プレースホルダ検出（警告のみ）
const unresolved = content.match(RE_PLACEHOLDER);
if (unresolved) {
  const uniques = [...new Set(unresolved)];
  console.warn("⚠ 未解決のプレースホルダがあります:");
  uniques.forEach((ph) => console.warn("  -", ph));
  console.warn("params.json に対応するキーを追加して再度実行してください。");
}


// 書き出し
fs.writeFileSync(OUTPUT_PATH, content, "utf8");
console.log(`✅ 生成完了: ${path.relative(repoRoot, OUTPUT_PATH)} (${GENERATED_AT})`);

// ちょい便利: 最後に差分のヒント
try {
  execSync("git diff --quiet -- " + JSON.stringify(path.relative(repoRoot, OUTPUT_PATH)), { cwd: repoRoot });
  // 差分なし
} catch {
  console.log("ℹ 変更があります。コミット/PR を作成してください。");
}
