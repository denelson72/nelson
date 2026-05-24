import fs from "node:fs";
import path from "node:path";

const target = path.resolve("src/intro.mp4");
const publicDir = path.resolve("public");
const dest = path.join(publicDir, "intro-media");

if (!fs.existsSync(target)) {
  console.warn("Warning: src/intro.mp4 not found — intro video will not play.");
  process.exit(0);
}

fs.mkdirSync(publicDir, { recursive: true });

if (fs.existsSync(dest)) {
  try {
    const sameFile =
      fs.statSync(dest).ino === fs.statSync(target).ino ||
      fs.statSync(dest).size === fs.statSync(target).size;
    if (sameFile) process.exit(0);
  } catch {
    /* replace outdated copy */
  }
  fs.unlinkSync(dest);
}

try {
  fs.linkSync(target, dest);
  console.log("Linked public/intro-media → src/intro.mp4");
} catch {
  fs.copyFileSync(target, dest);
  console.log("Copied src/intro.mp4 → public/intro-media");
}
