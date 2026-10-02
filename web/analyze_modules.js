const fs = require('fs');
const path = require('path');

const htmlPath = path.join(process.cwd(), '.next', 'analyze', 'client.html');
if (!fs.existsSync(htmlPath)) {
  console.log('client.html not found');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/window\.chartData\s*=\s*(.*?);/s);

if (!match) {
  console.log('Could not find chartData in client.html');
  process.exit(1);
}

const chartData = JSON.parse(match[1]);

const modules = [];

function traverse(node, currentPath = '') {
  if (node.groups) {
    node.groups.forEach(g => traverse(g, currentPath + (currentPath ? '/' : '') + node.label));
  } else if (node.label && node.statSize) {
    modules.push({
      name: currentPath + '/' + node.label,
      size: node.statSize,
      parsedSize: node.parsedSize
    });
  }
}

chartData.forEach(chunk => {
  traverse(chunk);
});

modules.sort((a, b) => b.parsedSize - a.parsedSize);

const formatSize = (bytes) => (bytes / 1024).toFixed(2) + ' KB';

console.log('--- Top Modules by Parsed Size ---');
modules.slice(0, 30).forEach(m => {
  console.log(`${formatSize(m.parsedSize).padStart(10)} | ${m.name}`);
});
