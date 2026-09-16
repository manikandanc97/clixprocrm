const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
for (const line of env.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    const raw = line.slice('DATABASE_URL='.length).trim();
    try {
      const u = new URL(raw);
      console.log('Database Host:', u.hostname);
      console.log('Database Port:', u.port);
      console.log('Parameters:', Array.from(u.searchParams.entries()));
    } catch (e) {
      console.log('Error parsing URL:', e.message);
    }
  }
}
