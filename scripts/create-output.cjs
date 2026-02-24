// Creates the .vercel/output directory structure for prebuilt deployment
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '.vercel', 'output');

// Clean previous output
if (fs.existsSync(output)) {
  fs.rmSync(output, { recursive: true });
}

// 1. Create config.json
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    {
      src: '^/api/test$',
      dest: '/api/test'
    },
    {
      src: '^/api/(.*)',
      dest: '/api/index'
    },
    {
      src: '^/api/(.*)',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      continue: true
    },
    {
      handle: 'filesystem'
    },
    {
      src: '/(.*)',
      dest: '/index.html'
    }
  ]
}, null, 2));

// 2. Copy static files (frontend build)
const staticDir = path.join(output, 'static');
console.log('Copying static files...');
fs.cpSync(path.join(root, 'src', 'frontend', 'dist'), staticDir, { recursive: true });

// 3. Create test function (minimal - no deps needed)
const testFuncDir = path.join(output, 'functions', 'api', 'test.func');
fs.mkdirSync(testFuncDir, { recursive: true });
fs.writeFileSync(path.join(testFuncDir, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  maxDuration: 10,
  launcherType: 'Nodejs'
}));
// Copy the test handler
fs.copyFileSync(path.join(root, 'api', 'test.js'), path.join(testFuncDir, 'index.js'));

// 4. Create main API function
const apiFuncDir = path.join(output, 'functions', 'api', 'index.func');
fs.mkdirSync(apiFuncDir, { recursive: true });
fs.writeFileSync(path.join(apiFuncDir, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.mjs',
  maxDuration: 30,
  memory: 1024,
  launcherType: 'Nodejs'
}));

// Create a wrapper that imports the express app
// The function needs: api/index.js, src/backend/**, node_modules
const wrapperCode = `
// Vercel serverless handler wrapper
let app = null;
let startupError = null;

const appPromise = import('./src/backend/src/app.js')
  .then(mod => { app = mod.default; })
  .catch(err => { startupError = err; console.error('App startup error:', err); });

export default async function handler(req, res) {
  await appPromise;
  if (startupError) {
    return res.status(500).json({
      error: 'Function startup failed',
      message: startupError.message,
      code: startupError.code,
      stack: startupError.stack?.split('\\n').slice(0, 10)
    });
  }
  if (!app) {
    return res.status(500).json({ error: 'App not loaded' });
  }
  return app(req, res);
}
`;
fs.writeFileSync(path.join(apiFuncDir, 'index.mjs'), wrapperCode);

// Copy backend source files
console.log('Copying backend source...');
fs.cpSync(path.join(root, 'src', 'backend', 'src'), path.join(apiFuncDir, 'src', 'backend', 'src'), { recursive: true });
fs.cpSync(path.join(root, 'src', 'backend', 'prisma'), path.join(apiFuncDir, 'src', 'backend', 'prisma'), { recursive: true });

// Copy backend package.json (for module resolution)
fs.copyFileSync(
  path.join(root, 'src', 'backend', 'package.json'),
  path.join(apiFuncDir, 'src', 'backend', 'package.json')
);

// Copy node_modules (needed for the function)
console.log('Copying node_modules (this may take a while)...');
fs.cpSync(
  path.join(root, 'src', 'backend', 'node_modules'),
  path.join(apiFuncDir, 'node_modules'),
  { recursive: true }
);

// Create package.json for the function root
fs.writeFileSync(path.join(apiFuncDir, 'package.json'), JSON.stringify({
  type: 'module'
}));

console.log('\\nBuild output created at .vercel/output/');
console.log('Deploy with: vercel deploy --prebuilt --prod');
