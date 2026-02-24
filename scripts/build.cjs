// Vercel build script - uses Node.js CJS to avoid ESM/shell issues
const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(cmd, cwd) {
  console.log('\n>>> Running: ' + cmd + ' (in ' + cwd + ')');
  execSync(cmd, { cwd: path.resolve(root, cwd), stdio: 'inherit' });
}

try {
  // Step 1: Generate Prisma client
  run('npx prisma generate', 'src/backend');

  // Step 2: Build frontend  
  run('npm run build', 'src/frontend');

  console.log('\n>>> Build complete!');
} catch (err) {
  console.error('\n>>> Build failed:', err.message);
  process.exit(1);
}
