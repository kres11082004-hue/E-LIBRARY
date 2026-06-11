const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
['package-lock.json', 'yarn.lock'].forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      // ignore
    }
  }
});

const ua = process.env.npm_config_user_agent || '';
if (ua && !ua.startsWith('pnpm/')) {
  console.error('Use pnpm instead');
  process.exit(1);
}
