import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  InputBase,
  Paper,
  Popper,
  Fade,
  Typography,
  CircularProgress,
  Tooltip,
  ClickAwayListener,
  Divider,
  Chip,
  Avatar,
} from '@mui/material';
import {
  SmartToy as AiIcon,
  Send as SendIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Stop as StopIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  ContentCopy as CopyIcon,
  GraphicEq as GraphicEqIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { speak, stopSpeaking, isSpeaking, isVoiceEnabled, setVoiceEnabled, createSpeechQueue } from '../../services/voiceService';
import VoiceSettingsDialog from './VoiceSettingsDialog';

const ASSISTANT_API = '/api/ai/assistant';
const STREAM_API = '/api/ai/assistant/stream';

// Sentence boundary regex — splits on . ! ? followed by space or end
const SENTENCE_RE = /(?<=[.!?])\s+/;

export default function HeaderAIAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(isVoiceEnabled());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceMode, setVoiceMode] = useState(false); // Full voice control mode

  const anchorRef = useRef(null);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const autoSendRef = useRef(false); // Whether to auto-send after speech recognition ends
  const silenceTimerRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current && !voiceMode) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, voiceMode]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += piece + ' ';
        } else {
          interimTranscript += piece;
        }
      }

      if (interimTranscript) {
        setTranscript(interimTranscript);
      }

      if (finalTranscript) {
        const trimmed = finalTranscript.trim();
        setQuery(trimmed);
        setTranscript('');
        // Auto-send in voice mode
        if (autoSendRef.current && trimmed) {
          autoSendRef.current = false;
          // Short delay to let state update
          setTimeout(() => {
            submitMessage(trimmed);
          }, 200);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setListening(false);
        setTranscript('');
      }
    };

    recognition.onend = () => {
      setListening(false);
      setTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (open) {
      stopSpeaking();
      setSpeaking(false);
      stopListening();
      setVoiceMode(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    stopSpeaking();
    setSpeaking(false);
    stopListening();
    setVoiceMode(false);
  };

  const handleVoiceToggle = () => {
    const newState = !voiceOn;
    setVoiceOn(newState);
    setVoiceEnabled(newState);
    if (!newState) {
      stopSpeaking();
      setSpeaking(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setSpeaking(false);
  };

  const startListening = (autoSend = false) => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported. Use Chrome or Edge.');
      return;
    }
    autoSendRef.current = autoSend;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Error starting recognition:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setListening(false);
    setTranscript('');
  };

  const handleMicToggle = () => {
    if (listening) {
      stopListening();
    } else {
      startListening(voiceMode); // Auto-send in voice mode
    }
  };

  /** Toggle full voice control mode */
  const toggleVoiceMode = () => {
    const newMode = !voiceMode;
    setVoiceMode(newMode);
    if (newMode) {
      // Enable voice output too
      setVoiceOn(true);
      setVoiceEnabled(true);
      // Start listening immediately
      startListening(true);
    } else {
      stopListening();
    }
  };

  const speechQueueRef = useRef(null);
  const sentenceBufferRef = useRef('');

  const speakResponse = useCallback((text) => {
    if (!voiceOn) return;
    setSpeaking(true);
    speak(text, {
      onEnd: () => {
        setSpeaking(false);
        if (voiceMode) {
          setTimeout(() => startListening(true), 500);
        }
      },
      onError: (error) => {
        setSpeaking(false);
        console.error('Voice playback error:', error);
      },
    }).catch((error) => {
      setSpeaking(false);
      console.error('Voice error:', error);
    });
  }, [voiceOn, voiceMode]);

  /** Core submit — uses SSE streaming + sentence-by-sentence TTS */
  const submitMessage = async (text) => {
    const trimmed = (text || query).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    // Stop any current speech
    stopSpeaking();
    setSpeaking(false);
    sentenceBufferRef.current = '';

    // Prepare a speech queue if voice is on
    let speechQueue = null;
    if (voiceOn) {
      speechQueue = createSpeechQueue({
        onSpeakingChange: (isSp) => setSpeaking(isSp),
        onDone: () => {
          setSpeaking(false);
          if (voiceMode) {
            setTimeout(() => startListening(true), 500);
          }
        },
        onError: (err) => console.error('Speech queue error:', err),
      });
      speechQueueRef.current = speechQueue;
    }

    // Accumulator for the streamed text
    let fullContent = '';
    let meta = { queryTypes: [], hasDbData: false };

    // We'll create a "live" assistant message and update it as chunks arrive
    const assistantMsgIdx = newMessages.length; // index where assistant msg will be

    try {
      const response = await fetch(STREAM_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-10),
          config: { temperature: 0.7, maxTokens: 800 },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      // Add an empty assistant message to fill in progressively
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', hasDbData: false, queryTypes: [] },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        // Parse SSE events from the buffer
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || ''; // Keep incomplete line in buffer

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);

              if (eventType === 'meta') {
                meta = data;
              } else if (eventType === 'delta') {
                const chunk = data.text || '';
                fullContent += chunk;

                // Update the live assistant message
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      content: fullContent,
                      hasDbData: meta.hasDbData,
                      queryTypes: meta.queryTypes,
                    };
                  }
                  return updated;
                });

                // Feed sentences to the speech queue
                if (speechQueue) {
                  sentenceBufferRef.current += chunk;
                  const parts = sentenceBufferRef.current.split(SENTENCE_RE);
                  // All parts except the last are complete sentences
                  if (parts.length > 1) {
                    for (let i = 0; i < parts.length - 1; i++) {
                      const sentence = parts[i].trim();
                      if (sentence.length > 2) {
                        speechQueue.push(sentence);
                      }
                    }
                    sentenceBufferRef.current = parts[parts.length - 1];
                  }
                }
              } else if (eventType === 'done') {
                // Final — flush any remaining sentence buffer
                if (speechQueue && sentenceBufferRef.current.trim().length > 2) {
                  speechQueue.push(sentenceBufferRef.current.trim());
                  sentenceBufferRef.current = '';
                }
              } else if (eventType === 'error') {
                throw new Error(data.error || 'Stream error');
              }
            } catch (parseErr) {
              // Ignore JSON parse errors from partial data
              if (eventType === 'error') throw parseErr;
            }
          }
        }
      }

      // Ensure final message state is correct
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            content: fullContent || 'I processed your request but got no response.',
            hasDbData: meta.hasDbData,
            queryTypes: meta.queryTypes,
          };
        }
        return updated;
      });

      // Flush remaining buffer to speech
      if (speechQueue && sentenceBufferRef.current.trim().length > 2) {
        speechQueue.push(sentenceBufferRef.current.trim());
        sentenceBufferRef.current = '';
      }
      if (speechQueue) speechQueue.finish();

    } catch (error) {
      console.error('AI Assistant error:', error);
      if (speechQueue) speechQueue.cancel();

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = {
            ...last,
            content: `⚠️ Sorry, I couldn't process that. ${error.message}`,
          };
        } else {
          updated.push({
            role: 'assistant',
            content: `⚠️ Sorry, I couldn't process that. ${error.message}`,
          });
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Keyboard shortcut: Ctrl+J to toggle
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      {/* AI Assistant Trigger Button */}
      <Tooltip title="AI Assistant (Ctrl+J)">
        <IconButton
          ref={anchorRef}
          onClick={handleToggle}
          sx={{
            mr: 1,
            position: 'relative',
            bgcolor: open ? 'primary.main' : 'transparent',
            color: open ? 'white' : 'inherit',
            '&:hover': {
              bgcolor: open ? 'primary.dark' : 'action.hover',
            },
            transition: 'all 0.2s',
          }}
        >
          <AiIcon />
          {/* Pulse indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: voiceMode ? '#FF5722' : '#4CAF50',
              border: '2px solid',
              borderColor: open ? 'primary.main' : 'background.paper',
              animation: voiceMode ? 'pulse 1s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.4 },
              },
            }}
          />
        </IconButton>
      </Tooltip>

      {/* AI Chat Popper */}
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        style={{ zIndex: 1300 }}
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              elevation={8}
              sx={{
                width: 440,
                maxHeight: 600,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: voiceMode ? 'warning.main' : 'divider',
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                  {/* Header */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      background: voiceMode
                        ? 'linear-gradient(135deg, #E65100 0%, #FF6D00 100%)'
                        : 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.2)' }}>
                        {voiceMode ? <GraphicEqIcon sx={{ fontSize: 18 }} /> : <AiIcon sx={{ fontSize: 18 }} />}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} lineHeight={1.2}>
                          SteelWise AI {voiceMode ? '• Voice Mode' : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem' }}>
                          {voiceMode ? 'Speak freely — I\'m listening' : 'Database queries + General knowledge'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {speaking && (
                        <Tooltip title="Stop Speaking">
                          <IconButton size="small" onClick={handleStopSpeaking} sx={{ color: 'white' }}>
                            <StopIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={voiceMode ? 'Exit Voice Mode' : 'Voice Mode (hands-free)'}>
                        <IconButton
                          size="small"
                          onClick={toggleVoiceMode}
                          sx={{
                            color: 'white',
                            bgcolor: voiceMode ? 'rgba(255,255,255,0.3)' : 'transparent',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                          }}
                        >
                          <GraphicEqIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={voiceOn ? 'Voice On' : 'Voice Off'}>
                        <IconButton size="small" onClick={handleVoiceToggle} sx={{ color: 'white' }}>
                          {voiceOn ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Voice Settings">
                        <IconButton size="small" onClick={() => setSettingsOpen(true)} sx={{ color: 'white' }}>
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={handleClose} sx={{ color: 'white', ml: 0.5 }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Voice Mode Indicator */}
                  {voiceMode && (
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: listening ? '#FFF3E0' : speaking ? '#E3F2FD' : '#F5F5F5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s',
                      }}
                    >
                      {listening ? (
                        <>
                          <MicIcon sx={{ color: 'error.main', fontSize: 20, animation: 'pulse 1s ease-in-out infinite' }} />
                          <Typography variant="caption" color="error.main" fontWeight={600}>
                            {transcript || 'Listening...'}
                          </Typography>
                        </>
                      ) : speaking ? (
                        <>
                          <GraphicEqIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Typography variant="caption" color="primary.main" fontWeight={600}>
                            Speaking response...
                          </Typography>
                        </>
                      ) : loading ? (
                        <>
                          <CircularProgress size={16} />
                          <Typography variant="caption" color="text.secondary">
                            Processing...
                          </Typography>
                        </>
                      ) : (
                        <>
                          <MicOffIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                          <Typography variant="caption" color="text.secondary">
                            Waiting... click mic or say something
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}

                  {/* Messages */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      px: 2,
                      py: 1.5,
                      maxHeight: voiceMode ? 320 : 380,
                      minHeight: 200,
                      bgcolor: '#FAFBFC',
                    }}
                  >
                    {messages.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <AiIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Hi! I'm your SteelWise AI assistant.
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ mb: 2, display: 'block' }}>
                          I can query your database and answer general questions.
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                          {[
                            'Show all jobs',
                            'Inventory status',
                            'Recent shipments',
                            'What is A36 steel?',
                            'How many orders?',
                            'Dashboard overview',
                          ].map((suggestion) => (
                            <Chip
                              key={suggestion}
                              label={suggestion}
                              size="small"
                              variant="outlined"
                              onClick={() => { submitMessage(suggestion); }}
                              sx={{
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {messages.map((msg, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          mb: 1.5,
                        }}
                      >
                        <Box sx={{ maxWidth: '85%', position: 'relative' }}>
                          <Paper
                            elevation={0}
                            sx={{
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                              color: msg.role === 'user' ? 'white' : 'text.primary',
                              border: msg.role === 'assistant' ? '1px solid' : 'none',
                              borderColor: 'divider',
                            }}
                          >
                            {/* DB query badge */}
                            {msg.role === 'assistant' && msg.hasDbData && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <StorageIcon sx={{ fontSize: 12, color: 'success.main' }} />
                                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'success.main', fontWeight: 600 }}>
                                  Live data from: {msg.queryTypes?.join(', ')}
                                </Typography>
                              </Box>
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontSize: '0.8rem',
                                lineHeight: 1.5,
                                '& strong': { fontWeight: 600 },
                              }}
                            >
                              {msg.content}
                            </Typography>
                          </Paper>
                          {/* Action buttons for assistant messages */}
                          {msg.role === 'assistant' && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                              <Tooltip title={copied === idx ? 'Copied!' : 'Copy'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopy(msg.content, idx)}
                                  sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                                >
                                  <CopyIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                              {voiceOn && (
                                <Tooltip title="Read aloud">
                                  <IconButton
                                    size="small"
                                    onClick={() => speakResponse(msg.content)}
                                    sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                                  >
                                    <VolumeUpIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))}

                    {loading && messages[messages.length - 1]?.role !== 'assistant' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="caption" color="text.secondary">
                          Querying database & thinking...
                        </Typography>
                      </Box>
                    )}

                    <div ref={chatEndRef} />
                  </Box>

                  <Divider />

                  {/* Input */}
                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 2,
                      py: 1,
                      bgcolor: 'white',
                      gap: 1,
                    }}
                  >
                    <Tooltip title={listening ? 'Stop Recording' : voiceMode ? 'Listening...' : 'Click to speak'}>
                      <IconButton
                        onClick={handleMicToggle}
                        disabled={loading}
                        sx={{
                          color: listening ? 'error.main' : voiceMode ? 'warning.main' : 'text.secondary',
                          bgcolor: listening ? 'error.50' : 'transparent',
                          '&:hover': {
                            bgcolor: listening ? 'error.100' : 'action.hover',
                          },
                          animation: listening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                          },
                        }}
                      >
                        {listening ? <GraphicEqIcon /> : <MicIcon />}
                      </IconButton>
                    </Tooltip>
                    <InputBase
                      inputRef={inputRef}
                      value={query + (transcript ? ' ' + transcript : '')}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={listening ? 'Listening...' : 'Ask about jobs, orders, inventory...'}
                      multiline
                      maxRows={3}
                      sx={{
                        flex: 1,
                        fontSize: '0.85rem',
                        p: 1,
                        bgcolor: listening ? '#FFF3E0' : '#F5F7FA',
                        borderRadius: 2,
                        border: listening ? '2px solid' : 'none',
                        borderColor: listening ? 'error.main' : 'transparent',
                        transition: 'all 0.3s',
                      }}
                      disabled={loading}
                    />
                    <IconButton
                      type="submit"
                      color="primary"
                      disabled={!query.trim() || loading}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        width: 36,
                        height: 36,
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&:disabled': { bgcolor: 'action.disabledBackground' },
                      }}
                    >
                      <SendIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>

                  {/* Footer */}
                  <Box sx={{ px: 2, py: 0.5, bgcolor: '#F5F7FA', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                      DeepSeek AI • ElevenLabs Voice • Supabase Database • Ctrl+J
                    </Typography>
                  </Box>

                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>

      {/* Voice Settings Dialog */}
      <VoiceSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
