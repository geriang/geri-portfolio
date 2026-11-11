/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// After a Next.js build, dynamic imports are emitted as separate chunk files in .next/static/chunks
const possibleDirs = [
  path.join(__dirname, '..', '.next', 'static', 'chunks'),
  path.join(__dirname, '..', '.next', 'server', 'chunks')
];

function findOverlayChunk() {
  for (const dir of possibleDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    if (files.length > 0) {
      console.log('Lazy‑load chunk(s) found:', files.join(', '));
      process.exit(0);
    }
  }
  console.error('Lazy‑load chunk for ChatOverlay not found in any expected dirs');
  process.exit(1);
}

findOverlayChunk();
