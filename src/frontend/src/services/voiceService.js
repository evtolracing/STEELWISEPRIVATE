/**
 * ElevenLabs Voice Service
 * Handles text-to-speech through the backend TTS proxy
 * Supports streaming sentence-by-sentence TTS with audio queue
 */

const API_BASE = 'http://localhost:3001/api/ai/tts';

// Voice list (mirrored from backend, cached locally)
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

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

// Storage keys
const VOICE_STORAGE_KEY = 'steelwise_voice_id';
const VOICE_ENABLED_KEY = 'steelwise_voice_enabled';

let currentAudio = null;

export function getSavedVoiceId() {
  return localStorage.getItem(VOICE_STORAGE_KEY) || DEFAULT_VOICE_ID;
}

export function saveVoiceId(voiceId) {
  localStorage.setItem(VOICE_STORAGE_KEY, voiceId);
}

export function isVoiceEnabled() {
  const val = localStorage.getItem(VOICE_ENABLED_KEY);
  return val === null ? true : val === 'true';
}

export function setVoiceEnabled(enabled) {
  localStorage.setItem(VOICE_ENABLED_KEY, String(enabled));
}

export function getVoices() {
  return AMERICAN_VOICES;
}

export function getDefaultVoiceId() {
  return DEFAULT_VOICE_ID;
}

/** Clean markdown/formatting for speech */
function cleanForSpeech(text) {
  return text
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
}

/** Fetch audio blob from backend TTS */
async function fetchAudioBlob(text, voiceId) {
  const response = await fetch(`${API_BASE}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!response.ok) {
    const ct = response.headers.get('content-type');
    let msg = `TTS error ${response.status}`;
    if (ct?.includes('json')) {
      const err = await response.json().catch(() => ({}));
      msg = err.error || msg;
    }
    throw new Error(msg);
  }

  const blob = await response.blob();
  if (blob.size === 0) throw new Error('Empty audio');
  return blob;
}

/** Play a single audio blob — returns a promise that resolves when playback ends */
function playBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      reject(e);
    };

    audio.play().catch(reject);
  });
}

// ─── Stop / State ────────────────────────────────────────────

export function stopSpeaking() {
  // Stop current audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  // Cancel any active speech queue
  if (_activeSpeechQueue) {
    _activeSpeechQueue.cancel();
    _activeSpeechQueue = null;
  }
}

export function isSpeaking() {
  return (currentAudio !== null && !currentAudio.paused) || (_activeSpeechQueue?.playing);
}

// ─── Single-shot speak (full text) ──────────────────────────

export async function speak(text, options = {}) {
  const {
    voiceId = getSavedVoiceId(),
    onStart = () => {},
    onEnd = () => {},
    onError = () => {},
  } = options;

  stopSpeaking();
  if (!isVoiceEnabled()) return;

  const clean = cleanForSpeech(text);
  if (!clean) return;
  const truncated = clean.length > 2000 ? clean.substring(0, 2000) + '...' : clean;

  try {
    onStart();
    const blob = await fetchAudioBlob(truncated, voiceId);
    await playBlob(blob);
    onEnd();
  } catch (error) {
    console.error('Voice service error:', error);
    currentAudio = null;
    onError(error);
  }
}

// ─── Streaming Speech Queue ─────────────────────────────────
// Allows feeding sentences one at a time; pre-fetches audio for
// the next sentence while the current one plays.

let _activeSpeechQueue = null;

/**
 * Create a streaming speech queue.
 * Usage:
 *   const q = createSpeechQueue({ onSpeakingChange, onDone });
 *   q.push("First sentence.");
 *   q.push("Second sentence.");
 *   q.finish();                  // signal no more sentences
 *
 * The queue pre-fetches audio for the NEXT sentence while the
 * current sentence plays, so there's minimal gap.
 */
export function createSpeechQueue(options = {}) {
  const {
    voiceId = getSavedVoiceId(),
    onSpeakingChange = () => {},
    onDone = () => {},
    onError = () => {},
  } = options;

  // Cancel any previous queue
  if (_activeSpeechQueue) _activeSpeechQueue.cancel();

  const queue = [];          // Array of { text, blobPromise }
  let playing = false;
  let cancelled = false;
  let finished = false;      // No more items will be pushed
  let draining = false;

  const q = {
    get playing() { return playing; },

    /** Add a sentence to the queue and start pre-fetching its audio */
    push(text) {
      if (cancelled || !text?.trim()) return;
      const clean = cleanForSpeech(text);
      if (!clean) return;
      // Start fetching audio immediately (pre-fetch)
      const blobPromise = fetchAudioBlob(clean, voiceId).catch((err) => {
        console.warn('TTS pre-fetch error:', err.message);
        return null; // Skip this chunk on error
      });
      queue.push({ text: clean, blobPromise });
      drain();
    },

    /** Signal that no more sentences will be added */
    finish() {
      finished = true;
      // If queue is empty and not playing, we're done
      if (queue.length === 0 && !playing) {
        _activeSpeechQueue = null;
        onDone();
      }
    },

    /** Cancel all pending audio */
    cancel() {
      cancelled = true;
      queue.length = 0;
      playing = false;
      draining = false;
      onSpeakingChange(false);
    },
  };

  /** Process the queue — play one item at a time */
  async function drain() {
    if (draining || cancelled) return;
    draining = true;

    while (queue.length > 0 && !cancelled) {
      const item = queue.shift();
      const blob = await item.blobPromise;
      if (!blob || cancelled) continue;

      playing = true;
      onSpeakingChange(true);

      try {
        await playBlob(blob);
      } catch (err) {
        console.warn('Audio playback error, skipping:', err);
      }
    }

    playing = false;
    draining = false;
    if (!cancelled) onSpeakingChange(false);

    if (finished && queue.length === 0) {
      _activeSpeechQueue = null;
      onDone();
    }
  }

  _activeSpeechQueue = q;
  return q;
}

// ─── Utility ────────────────────────────────────────────────

export async function previewVoice(voiceId) {
  return speak('Hello, I am your SteelWise AI assistant. How can I help you today?', {
    voiceId,
    onStart: () => console.log('Preview starting...'),
    onEnd: () => console.log('Preview complete'),
    onError: (e) => console.error('Preview error:', e),
  });
}

export async function testConnection() {
  try {
    const resp = await fetch(`${API_BASE}/test`);
    return await resp.json();
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export default {
  speak,
  stopSpeaking,
  isSpeaking,
  getVoices,
  getSavedVoiceId,
  saveVoiceId,
  isVoiceEnabled,
  setVoiceEnabled,
  getDefaultVoiceId,
  previewVoice,
  testConnection,
  createSpeechQueue,
};
