import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const srcRoot = join(packageRoot, "src");
const distRoot = join(packageRoot, "dist");

await copyCssFiles(srcRoot);

async function copyCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await copyCssFiles(sourcePath);
        return;
      }

      if (!entry.isFile() || !entry.name.endsWith(".css")) {
        return;
      }

      const outputPath = join(distRoot, relative(srcRoot, sourcePath));
      await mkdir(dirname(outputPath), { recursive: true });
      await cp(sourcePath, outputPath);
    }),
  );
}
