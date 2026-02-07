import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  Avatar,
} from '@mui/material';
import {
  RecordVoiceOver as VoiceIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Close as CloseIcon,
  VolumeUp as VolumeUpIcon,
  Woman as WomanIcon,
  Man as ManIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import {
  getVoices,
  getSavedVoiceId,
  saveVoiceId,
  isVoiceEnabled,
  setVoiceEnabled,
  speak,
  stopSpeaking,
  isSpeaking,
} from '../../services/voiceService';

export default function VoiceSettingsDialog({ open, onClose }) {
  const voices = getVoices();
  const [selectedVoiceId, setSelectedVoiceId] = useState(getSavedVoiceId());
  const [enabled, setEnabled] = useState(isVoiceEnabled());
  const [previewingId, setPreviewingId] = useState(null);

  useEffect(() => {
    if (open) {
      setSelectedVoiceId(getSavedVoiceId());
      setEnabled(isVoiceEnabled());
    }
  }, [open]);

  const handleVoiceSelect = (voiceId) => {
    setSelectedVoiceId(voiceId);
  };

  const handlePreview = (voice) => {
    if (previewingId === voice.id && isSpeaking()) {
      stopSpeaking();
      setPreviewingId(null);
      return;
    }

    setPreviewingId(voice.id);
    speak(`Hello! I'm ${voice.name}. I'll be your SteelWise assistant.`, {
      voiceId: voice.id,
      onEnd: () => setPreviewingId(null),
      onError: () => setPreviewingId(null),
    });
  };

  const handleSave = () => {
    saveVoiceId(selectedVoiceId);
    setVoiceEnabled(enabled);
    stopSpeaking();
    onClose();
  };

  const handleToggleEnabled = (e) => {
    setEnabled(e.target.checked);
  };

  const handleClose = () => {
    stopSpeaking();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VoiceIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>Voice Settings</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {/* Voice Enable Toggle */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
          <FormControlLabel
            control={
              <Switch 
                checked={enabled} 
                onChange={handleToggleEnabled} 
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  Voice Responses
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  AI assistant will speak responses aloud using ElevenLabs
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider />

        {/* Voice Selection List */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1, py: 1 }}>
            Choose a Voice ({voices.length} American voices)
          </Typography>
        </Box>

        <List sx={{ px: 1, pb: 1, opacity: enabled ? 1 : 0.4, pointerEvents: enabled ? 'auto' : 'none' }}>
          {voices.map((voice) => {
            const isSelected = voice.id === selectedVoiceId;
            const isPreviewing = previewingId === voice.id;
            
            return (
              <ListItemButton
                key={voice.id}
                selected={isSelected}
                onClick={() => handleVoiceSelect(voice.id)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  border: isSelected ? '2px solid' : '2px solid transparent',
                  borderColor: isSelected ? 'primary.main' : 'transparent',
                  bgcolor: isSelected ? 'primary.50' : 'transparent',
                  '&:hover': { bgcolor: isSelected ? 'primary.50' : 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: voice.gender === 'female' ? '#E91E63' : '#1E88E5',
                      fontSize: '0.8rem',
                    }}
                  >
                    {voice.gender === 'female' ? <WomanIcon sx={{ fontSize: 18 }} /> : <ManIcon sx={{ fontSize: 18 }} />}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                        {voice.name}
                      </Typography>
                      <Chip 
                        label={voice.gender} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          bgcolor: voice.gender === 'female' ? '#FCE4EC' : '#E3F2FD',
                          color: voice.gender === 'female' ? '#C2185B' : '#1565C0',
                        }}
                      />
                      {isSelected && <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
                    </Box>
                  }
                  secondary={voice.description}
                />
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handlePreview(voice); }}
                  sx={{ 
                    color: isPreviewing ? 'error.main' : 'primary.main',
                    '&:hover': { bgcolor: isPreviewing ? 'error.50' : 'primary.50' },
                  }}
                >
                  {isPreviewing ? <StopIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
                </IconButton>
              </ListItemButton>
            );
          })}
        </List>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<VolumeUpIcon />}>
          Save Voice Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}
