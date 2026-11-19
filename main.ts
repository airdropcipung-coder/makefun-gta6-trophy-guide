// Leonida Platinum — the hand-in program for the GTA 6 trophy guide entry.
//
// The guide itself is plain static files in app/ (index.html, style.css,
// app.js and app/data/trophies.json), so this program only has to hand it in:
// copy app/ and screenshots/ from beside this file into the output directory
// and write dossier.json there with the vendored make.fun library, which is
// what the scorer compares against. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output, so locally:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Node 22, standard library only. vendor/makefun-frontend.ts is the kit's
// copy and must stay untouched — the dossier has to be byte for byte what
// the scorer's own copy of that library writes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps for this bounty: at most 4 screenshots of 256 KiB
// each, app/ at most 993 files and directories and 48 MiB in all, and the
// dossier text at most 163,840 bytes. buildDossier refuses anything past
// them, so a bad entry fails here instead of silently passing the gate.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
