/**
 * SVGピンアイコンをWebP(100x100)に一括変換するスクリプト
 * 実行: node scripts/convert-icons.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const ICON_DIR = path.resolve("public/icon");
const SIZE = 100; // 出力サイズ（px）

// 変換対象のSVGパターン
const targetPrefixes = [
  "park_",
  "inshoku_",
  "shop_",
  "kankou_",
  "entame_",
  "noodle_",
];

const files = fs.readdirSync(ICON_DIR).filter((f) => {
  if (!f.endsWith(".svg")) return false;
  return targetPrefixes.some((prefix) => f.startsWith(prefix));
});

console.log(`変換対象: ${files.length} ファイル`);

for (const file of files) {
  const inputPath = path.join(ICON_DIR, file);
  const outputName = file.replace(".svg", ".webp");
  const outputPath = path.join(ICON_DIR, outputName);

  try {
    await sharp(inputPath, { density: 150 })
      .resize(SIZE, SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 85 })
      .toFile(outputPath);

    const inSize = (fs.statSync(inputPath).size / 1024).toFixed(0);
    const outSize = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(`✓ ${file} (${inSize}KB) → ${outputName} (${outSize}KB)`);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
}

console.log("\n完了!");
