/**
 * Merge run.mjs + sample-server.sh CSVs into a capacity report (markdown).
 *
 *   node report.mjs tests/load/results/
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || 'tests/load/results/';
const files = readdirSync(dir).flatMap((f) => {
  if (f.endsWith('.csv') && f.startsWith('r')) {
    const sub = join(dir, f);
    try {
      return readdirSync(sub).map((s) => join(sub, s));
    } catch { return []; }
  }
  if (f === 'wachaut-load.csv') return [join(dir, f)];
  return [];
});

const viewersFiles = files.filter((f) => f.endsWith('viewers.csv'));
const serverFile = files.find((f) => f.endsWith('wachaut-load.csv'));

// ── Viewer decode health ──────────────────────────────────────────────
let totalFrames = 0;
let droppedFrames = 0;
let perViewer = new Map();
for (const vf of viewersFiles) {
  const lines = readFileSync(vf, 'utf8').trim().split('\n').slice(1);
  const last = new Map();
  for (const line of lines) {
    const [, viewer, total, dropped, w, h] = line.split(',');
    last.set(viewer, { total: +total, dropped: +dropped, w, h });
  }
  for (const [viewer, s] of last) {
    totalFrames += s.total;
    droppedFrames += s.dropped;
    perViewer.set(`${vf}:${viewer}`, s);
  }
}
const dropPct = totalFrames > 0 ? ((droppedFrames / totalFrames) * 100).toFixed(2) : '0.00';
const resolutions = [...new Set([...perViewer.values()].map((s) => `${s.w}×${s.h}`))];

// ── Server stats (peaks + averages) ───────────────────────────────────
let serverSummary = '_sin sample-server.sh (ejecútalo en la VPS en paralelo)_';
if (serverFile) {
  const lines = readFileSync(serverFile, 'utf8').trim().split('\n').slice(1);
  const rows = lines.map((l) => l.split(',').map((v) => parseFloat(v)));
  const peak = (idx) => Math.max(...rows.map((r) => r[idx] || 0)).toFixed(1);
  const avg = (idx) => (rows.reduce((a, r) => a + (r[idx] || 0), 0) / rows.length).toFixed(1);
  serverSummary = [
    `| métrica | media | pico |`,
    `|---|---|---|`,
    `| CPU host % | ${avg(1)} | ${peak(1)} |`,
    `| RAM host % | ${avg(2)} | ${peak(2)} |`,
    `| loadavg(1m) | ${avg(3)} | ${peak(3)} |`,
    `| SFU CPU % | ${avg(4)} | ${peak(4)} |`,
    `| SFU RAM % | ${avg(5)} | ${peak(5)} |`,
    `| server CPU % | ${avg(6)} | ${peak(6)} |`,
    `| coturn CPU % | ${avg(8)} | ${peak(8)} |`,
  ].join('\n');
}

const report = `# Informe de capacidad — ${new Date().toISOString().slice(0, 10)}

_Ejecuciones analizadas: ${viewersFiles.length} · viewers finales: ${perViewer.size}_

## Calidad de decodificación (viewers)

- Frames totales decodificados: **${totalFrames}**
- Frames perdidos: **${droppedFrames} (${dropPct}%)**
- Resoluciones observadas: ${resolutions.join(', ') || '—'}
- Umbral de degradación del sprint: >2% sostenido ${parseFloat(dropPct) > 2 ? '⚠️ SUPERADO' : '✅ OK'}

## Servidor

${serverSummary}

## Conclusión

<!-- Rellenar tras la rampa: N salas × M viewers sostenidas sin degradar,
     con cuál fue el primer cuello de botella (CPU SFU, RAM, red, ports). -->
`;

const out = join(dir, `informe-${new Date().toISOString().slice(0, 10)}.md`);
writeFileSync(out, report);
console.log(report);
console.log(`→ ${out}`);
