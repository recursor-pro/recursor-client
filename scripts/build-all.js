#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Building Recursor for all platforms...\n");

const platforms = [
  {
    name: "macOS",
    command: "npm run make:macos",
    emoji: "🍎",
    formats: ["DMG", "ZIP"],
  },
  {
    name: "Windows",
    command: "npm run make:windows",
    emoji: "🪟",
    formats: ["ZIP"],
  },
  {
    name: "Linux",
    command: "npm run make:linux",
    emoji: "🐧",
    formats: ["ZIP"],
  },
];

const results = [];

for (const platform of platforms) {
  console.log(`${platform.emoji} Building for ${platform.name}...`);

  try {
    const startTime = Date.now();
    execSync(platform.command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`✅ ${platform.name} build completed in ${duration}s\n`);
    results.push({ platform: platform.name, status: "success", duration });
  } catch (error) {
    console.error(`❌ ${platform.name} build failed:`);
    console.error(error.message);
    console.log("");
    results.push({
      platform: platform.name,
      status: "failed",
      error: error.message,
    });
  }
}

// Summary
console.log("📊 Build Summary:");
console.log("================");

for (const result of results) {
  const status = result.status === "success" ? "✅" : "❌";
  const duration = result.duration ? ` (${result.duration}s)` : "";
  console.log(`${status} ${result.platform}${duration}`);

  if (result.status === "failed") {
    console.log(`   Error: ${result.error}`);
  }
}

// Check output directory
const outputDir = path.join(process.cwd(), "out", "make");
if (fs.existsSync(outputDir)) {
  console.log("\n📦 Generated files:");
  console.log("==================");

  const platforms = fs.readdirSync(outputDir);
  for (const platform of platforms) {
    const platformDir = path.join(outputDir, platform);
    if (fs.statSync(platformDir).isDirectory()) {
      console.log(`\n${platform.toUpperCase()}:`);

      const architectures = fs.readdirSync(platformDir);
      for (const arch of architectures) {
        const archDir = path.join(platformDir, arch);
        if (fs.statSync(archDir).isDirectory()) {
          console.log(`  ${arch}:`);

          const files = fs.readdirSync(archDir);
          for (const file of files) {
            const filePath = path.join(archDir, file);
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024 / 1024).toFixed(1);
            console.log(`    - ${file} (${size} MB)`);
          }
        }
      }
    }
  }

  console.log(`\n📁 All files available at: ${outputDir}`);
} else {
  console.log("\n⚠️  No output directory found");
}

const successCount = results.filter((r) => r.status === "success").length;
const totalCount = results.length;

if (successCount === totalCount) {
  console.log("\n🎉 All builds completed successfully!");
  process.exit(0);
} else {
  console.log(
    `\n⚠️  ${successCount}/${totalCount} builds completed successfully`
  );
  process.exit(1);
}
