/**
 * DemoOverlay
 * Floating guided-tour panel displayed during the Alro Board Demo.
 * Shows current step, talking points, navigation controls, and progress.
 * Designed to be presenter-friendly: large text, high contrast, minimal distraction.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Fade,
  Collapse,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Minimize as MinimizeIcon,
  OpenInFull as MaximizeIcon,
  RecordVoiceOver as TalkIcon,
  Timer as TimerIcon,
  Lightbulb as HighlightIcon,
  SkipNext as SkipIcon,
  FormatListNumbered as StepsIcon,
} from '@mui/icons-material';
import { useDemo, DEMO_STEPS } from '../../contexts/DemoContext';

export default function DemoOverlay() {
  const {
    isActive,
    isMinimized,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    nextStep,
    prevStep,
    goToStep,
    stopDemo,
    toggleMinimize,
  } = useDemo();

  const [showStepList, setShowStepList] = useState(false);

  if (!isActive) return null;

  // Minimized mode — small floating pill
  if (isMinimized) {
    return (
      <Fade in>
        <Paper
          elevation={8}
          onClick={toggleMinimize}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            px: 2.5,
            py: 1.5,
            borderRadius: 8,
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            '&:hover': { transform: 'scale(1.05)', boxShadow: 12 },
            transition: 'all 0.2s ease',
          }}
        >
          <PlayIcon fontSize="small" />
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Demo Mode — {currentStep.phase}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {currentStep.title}
            </Typography>
          </Box>
          <Chip
            label={`${currentStepIndex + 1}/${totalSteps}`}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
          />
          <MaximizeIcon fontSize="small" />
        </Paper>
      </Fade>
    );
  }

  // Full overlay panel
  return (
    <Fade in>
      <Paper
        elevation={12}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 440,
          maxHeight: 'calc(100vh - 120px)',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid',
          borderColor: 'primary.main',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
            color: 'white',
            px: 2.5,
            py: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PlayIcon />
              <Typography variant="subtitle1" fontWeight={700}>
                ALRO BOARD DEMO
              </Typography>
            </Box>
            <Box>
              <Tooltip title="Step List">
                <IconButton size="small" sx={{ color: 'white' }} onClick={() => setShowStepList(!showStepList)}>
                  <StepsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Minimize">
                <IconButton size="small" sx={{ color: 'white' }} onClick={toggleMinimize}>
                  <MinimizeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="End Demo">
                <IconButton size="small" sx={{ color: 'white' }} onClick={stopDemo}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 1,
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': { bgcolor: '#4fc3f7', borderRadius: 2 },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Step {currentStepIndex + 1} of {totalSteps}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
        </Box>

        {/* Step List (collapsible) */}
        <Collapse in={showStepList}>
          <Box sx={{ maxHeight: 250, overflowY: 'auto', bgcolor: 'grey.50' }}>
            <List dense>
              {DEMO_STEPS.map((step, i) => (
                <ListItem
                  key={step.id}
                  button
                  onClick={() => { goToStep(i); setShowStepList(false); }}
                  selected={i === currentStepIndex}
                  sx={{
                    bgcolor: i === currentStepIndex ? 'primary.light' : 'transparent',
                    color: i === currentStepIndex ? 'white' : 'text.primary',
                    '&:hover': { bgcolor: i === currentStepIndex ? 'primary.main' : 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Chip
                      label={i + 1}
                      size="small"
                      sx={{
                        width: 24, height: 24, fontSize: 11,
                        bgcolor: i < currentStepIndex ? 'success.main' : i === currentStepIndex ? 'white' : 'grey.300',
                        color: i < currentStepIndex ? 'white' : i === currentStepIndex ? 'primary.main' : 'text.secondary',
                        fontWeight: 700,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={step.title}
                    primaryTypographyProps={{ fontSize: 12, fontWeight: i === currentStepIndex ? 700 : 400 }}
                    secondary={step.duration}
                    secondaryTypographyProps={{ fontSize: 10 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          <Divider />
        </Collapse>

        {/* Current Step Content */}
        <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
          {/* Phase & Title */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Chip label={currentStep.phase} size="small" color="primary" variant="outlined" />
              <Chip
                icon={<TimerIcon sx={{ fontSize: 14 }} />}
                label={currentStep.duration}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
              {currentStep.title}
            </Typography>
          </Box>

          {/* Key Highlight */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 2,
              bgcolor: 'warning.light',
              borderLeft: '4px solid',
              borderLeftColor: 'warning.main',
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <HighlightIcon sx={{ fontSize: 18, color: 'warning.dark', mt: 0.2 }} />
              <Typography variant="body2" fontWeight={600} color="warning.dark" sx={{ lineHeight: 1.4 }}>
                {currentStep.highlight}
              </Typography>
            </Box>
          </Paper>

          {/* Talking Points */}
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <TalkIcon sx={{ fontSize: 14 }} /> Talking Points
            </Typography>
            {currentStep.talkingPoints.map((point, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                >
                  {i + 1}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  {point}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Navigation Footer */}
        <Divider />
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.50' }}>
          <Button
            startIcon={<PrevIcon />}
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            size="small"
          >
            Previous
          </Button>

          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {currentStepIndex + 1} / {totalSteps}
          </Typography>

          {currentStepIndex < totalSteps - 1 ? (
            <Button
              endIcon={<NextIcon />}
              onClick={nextStep}
              variant="contained"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                fontWeight: 700,
              }}
            >
              Next Step
            </Button>
          ) : (
            <Button
              endIcon={<CloseIcon />}
              onClick={stopDemo}
              variant="contained"
              color="success"
              size="small"
              sx={{ fontWeight: 700 }}
            >
              End Demo
            </Button>
          )}
        </Box>
      </Paper>
    </Fade>
  );
}
