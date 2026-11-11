const fs = require('fs');
const path = require('path');

// After a Next.js build, dynamic imports are emitted as separate chunk files in .next/static/chunks
const possibleDirs = [
  path.join(__dirname, '..', '.next', 'static', 'chunks'),
  path.join(__dirname, '..', '.next', 'server', 'chunks')
];
const chunksDir = possibleDirs.find(dir => fs.existsSync(dir));

function findOverlayChunk() {
  if (!fs.existsSync(chunksDir)) {
    console.error('Chunks directory not found:', chunksDir);
    process.exit(1);
  }
  const files = fs.readdirSync(chunksDir);
  const overlayChunk = files.find(f => f.includes('ChatOverlay') || f.includes('chatoverlay'));
  if (overlayChunk) {
    console.log('Lazy‑load chunk found:', overlayChunk);
    process.exit(0);
  } else {
    console.error('Lazy‑load chunk for ChatOverlay not found in', chunksDir);
    process.exit(1);
  }
}

findOverlayChunk();
