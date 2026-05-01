// Build a distributable ZIP of BookBrain OS source.
// The ZIP is what you ship to lifetime customers and post on download
// pages. Customers run `npm install && npm run build && npm run start`
// after unzipping.
//
// Excludes: node_modules, .next, data/, .env*, .git, log files, dist/.
//
// Run with: npm run release:zip
import { promises as fs, createWriteStream } from "node:fs";
import path from "node:path";
import archiver from "archiver";

async function main() {
  const root = process.cwd();
  const version = (await fs.readFile(path.join(root, "VERSION"), "utf-8")).trim();
  const distDir = path.join(root, "dist");
  await fs.mkdir(distDir, { recursive: true });

  const baseName = `bookbrain-os-${version}`;
  const outPath = path.join(distDir, `${baseName}.zip`);
  // Remove any previous file with the same name
  await fs.rm(outPath, { force: true });

  const output = createWriteStream(outPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  const done = new Promise<void>((resolve, reject) => {
    output.on("close", () => resolve());
    archive.on("warning", (err) => {
      if (err.code === "ENOENT") return;
      reject(err);
    });
    archive.on("error", reject);
  });
  archive.pipe(output);

  const includeDirs = ["app", "components", "lib", "scripts", "docs"];
  for (const d of includeDirs) {
    if (await exists(path.join(root, d))) {
      archive.directory(path.join(root, d), `${baseName}/${d}`);
    }
  }

  const includeFiles = [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.js",
    "postcss.config.js",
    "tailwind.config.ts",
    ".env.example",
    ".gitignore",
    "LICENSE",
    "README.md",
    "CHANGELOG.md",
    "VERSION"
  ];
  for (const f of includeFiles) {
    if (await exists(path.join(root, f))) {
      archive.file(path.join(root, f), { name: `${baseName}/${f}` });
    }
  }

  // Add an empty data dir so the customer's first run has somewhere to write.
  archive.append("", { name: `${baseName}/data/.gitkeep` });

  // Stamp the build with timestamp + sha placeholder.
  const stamp = {
    version,
    built_at: new Date().toISOString(),
    builder: process.env.USER || "unknown",
    note: "BookBrain OS source distribution. Run npm install && npm run build to install."
  };
  archive.append(JSON.stringify(stamp, null, 2), { name: `${baseName}/RELEASE.json` });

  await archive.finalize();
  await done;

  const stat = await fs.stat(outPath);
  console.log("");
  console.log("  Built:");
  console.log("  " + outPath);
  console.log("  " + (stat.size / 1024 / 1024).toFixed(2) + " MB");
  console.log("");
  console.log("  Customer install:");
  console.log("    unzip " + path.basename(outPath));
  console.log("    cd " + baseName);
  console.log("    cp .env.example .env   # then edit");
  console.log("    npm install && npm run build && npm run start");
  console.log("");
}

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

main().catch((err) => { console.error(err); process.exit(1); });
