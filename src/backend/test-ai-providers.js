/**
 * AI Provider Test Script
 * Tests all configured AI providers
 * 
 * Usage: node test-ai-providers.js
 */

import dotenv from 'dotenv';
import { aiProvider } from './src/services/ai/AIProviderService.js';

dotenv.config();

async function testProviders() {
  console.log('🧪 Testing AI Providers\n');
  console.log('═'.repeat(60));

  // Check available providers
  const available = aiProvider.getAvailableProviders();
  console.log('\n📋 Available Providers:', available.join(', ') || 'None configured');

  if (available.length === 0) {
    console.log('\n⚠️  No providers configured!');
    console.log('Add API keys to .env file:');
    console.log('  OPENAI_API_KEY="sk-..."');
    console.log('  DEEPSEEK_API_KEY="sk-..."');
    console.log('  ANTHROPIC_API_KEY="sk-..."');
    return;
  }

  console.log('\n' + '═'.repeat(60));

  // Test each provider
  for (const providerName of available) {
    console.log(`\n🔍 Testing ${providerName.toUpperCase()}`);
    console.log('─'.repeat(60));

    try {
      const capabilities = aiProvider.getProviderCapabilities(providerName);
      console.log(`✓ Capabilities:`, JSON.stringify(capabilities.supports, null, 2));

      // Test chat completion
      console.log(`\n  Testing chat completion...`);
      const response = await aiProvider.getChatCompletion({
        provider: providerName,
        task: 'chat',
        messages: [
          { role: 'user', content: 'Say "Hello from SteelWise!" and nothing else.' }
        ],
        config: {
          maxTokens: 50,
          temperature: 0,
        },
      });

      console.log(`  ✓ Response: "${response.content.trim()}"`);
      console.log(`  ✓ Model: ${response.model}`);
      console.log(`  ✓ Tokens: ${response.usage.totalTokens} (input: ${response.usage.inputTokens}, output: ${response.usage.outputTokens})`);

      // Test streaming if supported
      if (capabilities.supports.streaming) {
        console.log(`\n  Testing streaming...`);
        let fullContent = '';
        let chunkCount = 0;

        const stream = aiProvider.streamChatCompletion({
          provider: providerName,
          task: 'chat',
          messages: [
            { role: 'user', content: 'Count from 1 to 5, one number per line.' }
          ],
          config: {
            maxTokens: 50,
            temperature: 0,
          },
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content') {
            fullContent = chunk.fullContent;
            chunkCount++;
          }
        }

        console.log(`  ✓ Received ${chunkCount} chunks`);
        console.log(`  ✓ Full response: "${fullContent.trim().substring(0, 50)}..."`);
      }

      console.log(`\n  ✅ ${providerName} working correctly!`);
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }

  // Test auto-selection
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎯 Testing Auto Provider Selection');
  console.log('─'.repeat(60));

  const tasks = ['chat', 'code', 'reasoning', 'analysis'];

  for (const task of tasks) {
    try {
      const response = await aiProvider.getChatCompletion({
        provider: 'auto',
        task,
        messages: [
          { role: 'user', content: 'Say "OK" and nothing else.' }
        ],
        config: {
          maxTokens: 10,
          temperature: 0,
        },
      });

      console.log(`  ✓ Task: ${task.padEnd(12)} -> ${response.provider}/${response.model}`);
    } catch (error) {
      console.log(`  ✗ Task: ${task.padEnd(12)} -> Failed: ${error.message}`);
    }
  }

  // Show usage statistics
  console.log('\n' + '═'.repeat(60));
  console.log('\n💰 Usage Statistics');
  console.log('─'.repeat(60));

  const stats = aiProvider.getUsageStats();
  let totalCost = 0;

  for (const [key, value] of Object.entries(stats)) {
    console.log(`\n  ${key}:`);
    console.log(`    Requests: ${value.requests}`);
    console.log(`    Tokens: ${value.totalTokens.toLocaleString()} (in: ${value.inputTokens.toLocaleString()}, out: ${value.outputTokens.toLocaleString()})`);
    console.log(`    Cost: $${value.estimatedCost.toFixed(4)}`);
    totalCost += value.estimatedCost;
  }

  console.log(`\n  Total Estimated Cost: $${totalCost.toFixed(4)}`);

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ All tests completed!');
}

// Run tests
testProviders()
  .then(() => {
    console.log('\n✨ Success!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
