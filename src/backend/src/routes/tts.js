/**
 * ElevenLabs Text-to-Speech API Routes
 * Proxies TTS requests through backend to keep API key secure
 */

import express from 'express';
import { getSupabaseSecret } from '../config/supabaseClient.js';

const router = express.Router();

// 10 American English voices (curated selection)
const AMERICAN_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', accent: 'American', description: 'Calm & warm' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', accent: 'American', description: 'Soft & pleasant' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', accent: 'American', description: 'Youthful & bright' },
  { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', gender: 'female', accent: 'American', description: 'Energetic & upbeat' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female', accent: 'American English (Swedish)', description: 'Confident & articulate' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', accent: 'American', description: 'Deep & authoritative' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', accent: 'American', description: 'Raspy & conversational' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', accent: 'American', description: 'Young & dynamic' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', accent: 'American', description: 'Crisp & confident' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', accent: 'American', description: 'Well-rounded & smooth' },
];

// Default voice: Rachel (female, American)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

/**
 * GET /api/ai/tts/voices
 * Get list of available American voices
 */
router.get('/voices', (req, res) => {
  res.json({
    voices: AMERICAN_VOICES,
    defaultVoiceId: DEFAULT_VOICE_ID,
  });
});

/**
 * GET /api/ai/tts/test
 * Test if ElevenLabs API key is configured
 */
router.get('/test', async (req, res) => {
  try {
    const apiKey = await getSupabaseSecret('ELEVENLABS_API_KEY');
    
    if (!apiKey) {
      return res.json({
        configured: false,
        message: 'ELEVENLABS_API_KEY not found in environment or Supabase secrets',
        instructions: 'Add ELEVENLABS_API_KEY to src/backend/.env or set in Supabase secrets'
      });
    }

    if (apiKey === 'sk_your_elevenlabs_api_key_here') {
      return res.json({
        configured: false,
        message: 'ELEVENLABS_API_KEY is still the placeholder value',
        instructions: 'Replace sk_your_elevenlabs_api_key_here in src/backend/.env with your actual ElevenLabs API key from https://elevenlabs.io/app/settings/api-keys'
      });
    }

    // Test the API key by making a minimal request
    const testRes = await fetch(`https://api.elevenlabs.io/v1/user`, {
      headers: { 'xi-api-key': apiKey }
    });

    if (!testRes.ok) {
      const error = await testRes.text();
      return res.json({
        configured: false,
        message: `API key is set but invalid (${testRes.status})`,
        error,
        instructions: 'Check that your ElevenLabs API key is correct'
      });
    }

    const userData = await testRes.json();

    return res.json({
      configured: true,
      message: 'ElevenLabs API is configured and working!',
      user: {
        email: userData.email || 'N/A',
        characterCount: userData.character_count || 0,
        characterLimit: userData.character_limit || 0,
      },
      apiKeyPrefix: apiKey.substring(0, 8) + '...'
    });

  } catch (error) {
    return res.status(500).json({
      configured: false,
      message: 'Error testing API key',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/tts/speak
 * Convert text to speech using ElevenLabs
 * 
 * Body: { text, voiceId?, modelId?, voiceSettings? }
 * Returns: audio/mpeg stream
 */
router.post('/speak', async (req, res) => {
  try {
    const {
      text,
      voiceId = DEFAULT_VOICE_ID,
      modelId = 'eleven_flash_v2_5',
      voiceSettings = { stability: 0.5, similarity_boost: 0.75 },
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Clean text for speech — strip markdown, code blocks, etc.
    let cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*+]\s/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'No speakable text after cleaning' });
    }

    // Truncate to stay under ElevenLabs limits
    if (cleanText.length > 4500) {
      cleanText = cleanText.substring(0, 4500) + '...';
    }

    // Fetch API key from environment or Supabase secrets
    const apiKey = await getSupabaseSecret('ELEVENLABS_API_KEY');
    
    console.log('🔊 TTS Request:', {
      textLength: text.length,
      voiceId,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none'
    });
    
    if (!apiKey) {
      console.error('❌ ELEVENLABS_API_KEY not found');
      return res.status(503).json({ error: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to .env or Supabase secrets' });
    }

    // Call ElevenLabs API directly via fetch
    const elevenLabsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: modelId,
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!elevenLabsRes.ok) {
      const errText = await elevenLabsRes.text();
      console.error('❌ ElevenLabs API error:', {
        status: elevenLabsRes.status,
        statusText: elevenLabsRes.statusText,
        error: errText
      });
      return res.status(elevenLabsRes.status).json({ 
        error: `ElevenLabs error: ${elevenLabsRes.status}`,
        details: errText,
      });
    }

    // Buffer the full audio before sending (prevents partial playback issues)
    const arrayBuffer = await elevenLabsRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ ElevenLabs returned ${buffer.length} bytes of audio`);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(buffer);

  } catch (error) {
    console.error('❌ TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
