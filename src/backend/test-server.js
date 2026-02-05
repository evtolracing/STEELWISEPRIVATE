import express from 'express';

const app = express();

app.get('/test', (req, res) => {
  console.log('📥 Received request');
  res.json({ message: 'Server is working!' });
});

const server = app.listen(3001, '127.0.0.1', () => {
  console.log('✅ Test server listening on 127.0.0.1:3001');
  console.log('📡 Server address:', server.address());
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

server.on('close', () => {
  console.log('🛑 Server closed');
});

process.on('exit', (code) => {
  console.log(`⚠️ Process exiting with code ${code}`);
});

console.log('🏁 Script execution complete, waiting for requests...');
