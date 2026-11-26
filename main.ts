// HomeLedger hand-in: copy app/ and screenshots/ into the output directory
// and write /output/dossier.json with the kit's buildDossier. Node standard
// library only, no network, no clock, no randomness: the same repository
// always writes the same bytes.

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "app"), { recursive: true });
mkdirSync(join(outDir, "screenshots"), { recursive: true });
cpSync(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });

writeFileSync(
  join(outDir, "dossier.json"),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
    app_path_max_bytes: 1000,
  }),
);
