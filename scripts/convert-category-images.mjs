/**
 * category-image の JPG を WebP に一括変換するスクリプト
 * 実行: node scripts/convert-category-images.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const DIR = path.resolve("public/category-image");
const MAX_WIDTH = 400; // カテゴリ画像は表示用なので400px幅で十分

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".jpg") && fs.statSync(path.join(DIR, f)).size > 0);

console.log(`変換対象: ${files.length} ファイル`);

for (const file of files) {
  const inputPath = path.join(DIR, file);
  const outputName = file.replace(".jpg", ".webp");
  const outputPath = path.join(DIR, outputName);

  try {
    await sharp(inputPath)
      .resize(MAX_WIDTH, undefined, { withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(outputPath);

    const inSize = (fs.statSync(inputPath).size / 1024).toFixed(0);
    const outSize = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(`✓ ${file} (${inSize}KB) → ${outputName} (${outSize}KB)`);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
}

console.log("\n完了!");
