const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');

// Convert bytes to KB
const formatSize = (bytes) => (bytes / 1024).toFixed(2) + ' KB';

console.log('\n--- Largest JS Chunks in .next/static/chunks ---');
const chunksDir = path.join(nextDir, 'static', 'chunks');
if (fs.existsSync(chunksDir)) {
  const files = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'));
  const chunksWithSize = files.map(f => {
    const p = path.join(chunksDir, f);
    return { name: f, size: fs.statSync(p).size };
  });
  chunksWithSize.sort((a, b) => b.size - a.size);
  chunksWithSize.slice(0, 20).forEach(c => {
    console.log(`${c.name}: ${formatSize(c.size)}`);
  });
}
