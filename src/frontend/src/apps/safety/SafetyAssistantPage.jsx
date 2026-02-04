/**
 * Safety AI Assistant Page
 * Interactive safety co-worker for guidance, permits, incidents, and real-time interventions
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Alert,
  AlertTitle,
  CircularProgress,
  Tooltip,
  Fade,
  Collapse,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  Person as UserIcon,
  HealthAndSafety as SafetyIcon,
  Warning as WarningIcon,
  Error as DangerIcon,
  CheckCircle as SafeIcon,
  Lock as LotoIcon,
  Whatshot as HotWorkIcon,
  ReportProblem as IncidentIcon,
  Assignment as InspectionIcon,
  School as TrainingIcon,
  Build as EquipmentIcon,
  Description as PolicyIcon,
  LocalShipping as ForkliftIcon,
  PrecisionManufacturing as MachineIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Help as HelpIcon,
  Lightbulb as TipIcon,
  Gavel as RuleIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';

// Quick action categories
const quickActions = [
  {
    category: 'Pre-Task Safety',
    icon: SafetyIcon,
    color: 'success',
    actions: [
      { label: 'Start a job safely', prompt: 'I need to start job work on the shear line. What safety checks are required?' },
      { label: 'Check PPE requirements', prompt: 'What PPE is required for operating the plasma cutter?' },
      { label: 'Generate JHA', prompt: 'Generate a Job Hazard Analysis for torch cutting steel plate' },
    ],
  },
  {
    category: 'Permits',
    icon: LotoIcon,
    color: 'warning',
    actions: [
      { label: 'Request LOTO permit', prompt: 'I need a LOTO permit for maintenance on the band saw' },
      { label: 'Request Hot Work permit', prompt: 'I need a hot work permit for welding in the fabrication area' },
      { label: 'Check active permits', prompt: 'Show me all active safety permits for today' },
    ],
  },
  {
    category: 'Incidents & Hazards',
    icon: IncidentIcon,
    color: 'error',
    actions: [
      { label: 'Report near-miss', prompt: 'I want to report a near-miss incident that just happened' },
      { label: 'Report unsafe condition', prompt: 'I found an unsafe condition that needs to be addressed' },
      { label: 'Report injury', prompt: 'I need to report a workplace injury' },
    ],
  },
  {
    category: 'Training & Guidance',
    icon: TrainingIcon,
    color: 'info',
    actions: [
      { label: 'Check my certifications', prompt: 'What safety certifications do I have and when do they expire?' },
      { label: 'Request training', prompt: 'I need forklift operator training' },
      { label: 'Get safety tip', prompt: 'Give me a safety tip for working with heavy materials' },
    ],
  },
];

// Simulated AI responses for demo
const simulateResponse = (userMessage) => {
  const lowerMsg = userMessage.toLowerCase();
  
  // LOTO/Lockout related
  if (lowerMsg.includes('loto') || lowerMsg.includes('lockout') || lowerMsg.includes('lock out') || lowerMsg.includes('maintenance')) {
    return {
      type: 'warning',
      title: '⚠️ LOTO Permit Required',
      content: `Based on your request, a **Lockout/Tagout (LOTO) permit** is required before any maintenance work can begin.

**Policy Reference:** LOTO-POL-001 Section 4.2

**Required Steps:**
1. Identify all energy sources (electrical, pneumatic, hydraulic, mechanical, thermal)
2. Notify affected employees
3. Shut down equipment using normal operating procedures
4. Isolate all energy sources
5. Apply personal locks and tags
6. Verify zero energy state

**I can help you:**
- Generate a LOTO permit draft
- Identify energy sources for the equipment
- Route for supervisor approval

**⚠️ DO NOT proceed with any work until the permit is approved and all locks are in place.**`,
      actions: [
        { label: 'Generate LOTO Permit', action: 'create_permit', type: 'LOTO' },
        { label: 'View LOTO Policy', action: 'view_policy', policyId: 'LOTO-POL-001' },
      ],
    };
  }
  
  // Hot work related
  if (lowerMsg.includes('hot work') || lowerMsg.includes('weld') || lowerMsg.includes('torch') || lowerMsg.includes('cutting') || lowerMsg.includes('grind')) {
    return {
      type: 'warning',
      title: '🔥 Hot Work Permit Required',
      content: `Any work involving open flames, sparks, or high heat requires a **Hot Work Permit**.

**Policy Reference:** HOTWORK-POL-001 Section 3.1

**This includes:**
- Welding (arc, MIG, TIG)
- Torch cutting / plasma cutting
- Grinding
- Brazing or soldering

**Required Before Starting:**
1. Hot Work Permit approved by supervisor
2. Fire watch designated (during + 30 min after)
3. Fire extinguisher within 25 feet
4. Combustibles cleared or protected within 35 feet
5. Sprinklers functional (if applicable)

**I can help you:**
- Generate a Hot Work permit draft
- Create a pre-work checklist
- Assign fire watch

**⚠️ No hot work until permit is active and fire watch is confirmed.**`,
      actions: [
        { label: 'Generate Hot Work Permit', action: 'create_permit', type: 'HOT_WORK' },
        { label: 'Hot Work Checklist', action: 'view_checklist', type: 'HOT_WORK' },
      ],
    };
  }
  
  // Near-miss or incident
  if (lowerMsg.includes('near-miss') || lowerMsg.includes('near miss') || lowerMsg.includes('almost') || lowerMsg.includes('close call')) {
    return {
      type: 'info',
      title: '📋 Near-Miss Report',
      content: `Thank you for reporting this near-miss. Reporting these events helps us prevent future injuries.

**I need a few details:**

1. **What happened?** (brief description)
2. **Where did it occur?** (location/work center)
3. **When did it occur?** (date/time)
4. **Who was involved?** (no blame, just for follow-up)
5. **What could have happened?** (potential outcome)
6. **What do you think caused it?**

**Your identity can remain confidential if you prefer.**

This report will be reviewed by EHS within 24 hours. If immediate hazard exists, we'll escalate now.`,
      actions: [
        { label: 'Start Report', action: 'create_incident', type: 'NEAR_MISS' },
        { label: 'Report Anonymously', action: 'create_incident', type: 'NEAR_MISS', anonymous: true },
      ],
    };
  }
  
  // Injury report
  if (lowerMsg.includes('injury') || lowerMsg.includes('hurt') || lowerMsg.includes('injured') || lowerMsg.includes('accident')) {
    return {
      type: 'error',
      title: '🚨 Injury Report — Priority Response',
      content: `**First: Is the injured person receiving medical attention?**

If immediate medical help is needed, call **911** or your facility's emergency number.

Once the situation is stable, I'll guide you through the injury report:

**Required Information:**
1. Name of injured person
2. Type of injury (cut, strain, burn, etc.)
3. Body part affected
4. How the injury occurred
5. Location and time
6. Witnesses
7. First aid provided

**This will trigger:**
- Supervisor notification
- EHS notification
- Investigation initiation
- OSHA recordkeeping review (if applicable)

**All injury reports are reviewed within 4 hours.**`,
      actions: [
        { label: 'Start Injury Report', action: 'create_incident', type: 'INJURY' },
        { label: 'Call Emergency', action: 'emergency', phone: '911' },
      ],
    };
  }
  
  // PPE related
  if (lowerMsg.includes('ppe') || lowerMsg.includes('protective') || lowerMsg.includes('safety glasses') || lowerMsg.includes('gloves')) {
    return {
      type: 'success',
      title: '🦺 PPE Requirements',
      content: `**General PPE Requirements (All Production Areas):**

| PPE | Required | Notes |
|-----|----------|-------|
| Safety glasses | ✅ Always | ANSI Z87.1 rated |
| Steel-toe boots | ✅ Always | ASTM F2413 |
| High-vis vest | ✅ Traffic areas | Near forklifts/cranes |
| Hearing protection | ⚠️ When posted | 85+ dB areas |
| Cut-resistant gloves | ⚠️ Material handling | Level A4 minimum for steel |
| Hard hat | ⚠️ Crane zones | When loads overhead |

**Additional PPE by Operation:**
- **Welding:** Face shield, welding gloves, leather apron
- **Grinding:** Face shield, leather gloves
- **Chemicals:** Refer to SDS for specific requirements

**Policy Reference:** PPE-POL-001

Need PPE for a specific task? Tell me what you're doing.`,
      actions: [
        { label: 'View Full PPE Policy', action: 'view_policy', policyId: 'PPE-POL-001' },
        { label: 'Request PPE', action: 'request_ppe' },
      ],
    };
  }
  
  // Forklift related
  if (lowerMsg.includes('forklift') || lowerMsg.includes('lift truck') || lowerMsg.includes('pallet jack')) {
    return {
      type: 'info',
      title: '🚛 Forklift Safety',
      content: `**Forklift Operation Requirements:**

**Before Operating:**
1. Valid forklift certification (check your training record)
2. Complete pre-shift inspection
3. Report any defects immediately

**Key Safety Rules:**
- Always wear seatbelt
- Travel with forks 4-6 inches off ground
- Sound horn at intersections and blind spots
- Never exceed rated load capacity
- No passengers
- No cell phone use
- Pedestrians always have right of way

**Pre-Shift Inspection Items:**
- Fluid levels, leaks
- Tires, forks condition
- Lights, horn, backup alarm
- Brakes, steering
- Overhead guard, load backrest

**Policy Reference:** FORKLIFT-POL-001`,
      actions: [
        { label: 'Start Forklift Inspection', action: 'start_inspection', type: 'FORKLIFT_DAILY' },
        { label: 'Check My Certification', action: 'check_training', course: 'FORKLIFT' },
      ],
    };
  }
  
  // Starting a job
  if (lowerMsg.includes('start job') || lowerMsg.includes('begin work') || lowerMsg.includes('starting work')) {
    return {
      type: 'info',
      title: '✅ Pre-Task Safety Check',
      content: `Before starting work, let's verify safety requirements:

**General Pre-Task Checklist:**
- [ ] PPE appropriate for task?
- [ ] Work area clear of hazards?
- [ ] Machine guards in place?
- [ ] Emergency stops accessible?
- [ ] Required permits obtained?
- [ ] Training current for this equipment?

**Tell me more about your job:**
- What equipment/work center?
- What material are you working with?
- What operation (cut, form, weld, etc.)?

I'll check for:
- Required permits
- Specific hazards for this operation
- Your training status
- Any equipment lockouts`,
      actions: [
        { label: 'Run Full Safety Check', action: 'safety_check' },
      ],
    };
  }
  
  // Blade change or adjustment
  if (lowerMsg.includes('blade') || lowerMsg.includes('adjust') || lowerMsg.includes('change')) {
    return {
      type: 'error',
      title: '🛑 STOP — Energy Control Required',
      content: `**Any blade change, adjustment, or maintenance requires LOTO.**

**Why This Matters:**
Unexpected machine startup is one of the leading causes of amputations and fatalities in manufacturing. Even "quick adjustments" require proper energy isolation.

**Policy Reference:** LOTO-POL-001 Section 2.1

**You MUST:**
1. Follow full LOTO procedure
2. Obtain LOTO permit
3. Apply personal lock before any work
4. Verify zero energy

**⚠️ There are NO exceptions for "quick" tasks.**

I'm escalating this to your supervisor for permit coordination.`,
      actions: [
        { label: 'Request LOTO Permit', action: 'create_permit', type: 'LOTO' },
        { label: 'View LOTO Procedure', action: 'view_policy', policyId: 'LOTO-POL-001' },
      ],
    };
  }
  
  // Training / certification check
  if (lowerMsg.includes('training') || lowerMsg.includes('certif') || lowerMsg.includes('qualified')) {
    return {
      type: 'info',
      title: '📚 Training & Certifications',
      content: `**Your Training Status:**

I can check your training records and certifications. Common safety certifications include:

- Forklift Operator
- Crane/Hoist Operator  
- LOTO Authorized Person
- Hot Work Authorized
- Confined Space Entry
- First Aid/CPR
- Hazard Communication
- Respiratory Protection

**To check your status:**
- Tell me which certification you need to verify
- Or I can show all your current certifications

**Expired or missing training?**
I can help you request enrollment.`,
      actions: [
        { label: 'View My Certifications', action: 'view_training' },
        { label: 'Request Training', action: 'request_training' },
      ],
    };
  }
  
  // Default helpful response
  return {
    type: 'info',
    title: '💬 Safety Assistant',
    content: `I'm here to help with safety questions and guidance.

**I can assist with:**
- **Pre-task safety checks** — Verify requirements before starting work
- **Permits** — LOTO, Hot Work, Confined Space
- **Incident reporting** — Near-misses, injuries, hazards
- **PPE requirements** — What protection you need
- **Training** — Check certifications, request training
- **Equipment safety** — Safe operation procedures
- **Policy questions** — Find and explain safety rules

**Try asking:**
- "I need to start work on the shear line"
- "What PPE do I need for grinding?"
- "I want to report a near-miss"
- "Is my forklift cert current?"

How can I help you stay safe today?`,
    actions: [],
  };
};

// Message component
function ChatMessage({ message, isUser, onActionClick }) {
  const getSeverityColor = (type) => {
    switch (type) {
      case 'error': return 'error.main';
      case 'warning': return 'warning.main';
      case 'success': return 'success.main';
      default: return 'info.main';
    }
  };

  if (isUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            maxWidth: '70%',
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 2,
            borderBottomRightRadius: 0,
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
        </Paper>
        <Avatar sx={{ ml: 1, bgcolor: 'primary.dark' }}>
          <UserIcon />
        </Avatar>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
      <Avatar sx={{ mr: 1, bgcolor: getSeverityColor(message.type) }}>
        <ShieldIcon />
      </Avatar>
      <Box sx={{ maxWidth: '80%' }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderRadius: 2,
            borderBottomLeftRadius: 0,
            borderLeft: 4,
            borderColor: getSeverityColor(message.type),
          }}
        >
          {message.title && (
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {message.title}
            </Typography>
          )}
          <Typography
            variant="body2"
            component="div"
            sx={{
              whiteSpace: 'pre-wrap',
              '& strong': { fontWeight: 600 },
              '& table': { 
                width: '100%', 
                borderCollapse: 'collapse',
                my: 1,
                fontSize: '0.875rem',
              },
              '& th, & td': { 
                border: '1px solid',
                borderColor: 'divider',
                p: 0.5,
                textAlign: 'left',
              },
            }}
            dangerouslySetInnerHTML={{ 
              __html: message.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br/>')
                .replace(/\|(.+)\|/g, (match) => {
                  const cells = match.split('|').filter(Boolean);
                  return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`;
                })
            }}
          />
          {message.actions && message.actions.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
              {message.actions.map((action, idx) => (
                <Button
                  key={idx}
                  size="small"
                  variant="outlined"
                  onClick={() => onActionClick(action)}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          )}
        </Paper>
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
          <Tooltip title="Helpful">
            <IconButton size="small">
              <ThumbUpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Not helpful">
            <IconButton size="small">
              <ThumbDownIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copy">
            <IconButton size="small">
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
}

export default function SafetyAssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const greeting = {
      id: Date.now(),
      isUser: false,
      type: 'info',
      title: '🛡️ Safety AI Assistant — Online',
      content: `I'm your **Safety Co-Worker** for the SteelWise platform.

**I can help you with:**
• Pre-task safety checks and Job Hazard Analysis
• LOTO, Hot Work, and other safety permits
• Incident and near-miss reporting
• PPE requirements and guidance
• Training verification and requests
• Equipment safety procedures

**Remember:** I'm here to keep you safe, not slow you down. If I recommend stopping work, there's a good reason.

What can I help you with today?`,
      actions: [],
    };
    setMessages([greeting]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      isUser: true,
      content: inputValue,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setShowQuickActions(false);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = simulateResponse(inputValue);
    const aiMessage = {
      id: Date.now() + 1,
      isUser: false,
      ...response,
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const handleQuickAction = (prompt) => {
    setInputValue(prompt);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleActionClick = (action) => {
    switch (action.action) {
      case 'create_permit':
        navigate(`/safety/permits?create=${action.type}`);
        break;
      case 'create_incident':
        navigate(`/safety/incidents?create=${action.type}`);
        break;
      case 'view_policy':
        // Would open policy viewer
        console.log('View policy:', action.policyId);
        break;
      case 'start_inspection':
        navigate(`/safety/inspections?start=${action.type}`);
        break;
      case 'view_training':
        navigate('/safety/training');
        break;
      case 'safety_check':
        // Would open safety check wizard
        console.log('Start safety check');
        break;
      default:
        console.log('Action:', action);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setShowQuickActions(true);
    // Re-add greeting
    const greeting = {
      id: Date.now(),
      isUser: false,
      type: 'info',
      title: '🛡️ Safety AI Assistant — Online',
      content: `Starting a new conversation. How can I help you stay safe?`,
      actions: [],
    };
    setMessages([greeting]);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => navigate('/safety')} size="small">
              <BackIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
              <ShieldIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Safety AI Assistant
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Online — Ready to assist
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleNewConversation}
            >
              New Conversation
            </Button>
            <Button
              variant="outlined"
              startIcon={<HelpIcon />}
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              Quick Actions
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
        {/* Chat Area */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isUser={message.isUser}
                onActionClick={handleActionClick}
              />
            ))}
            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <ShieldIcon />
                </Avatar>
                <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" spacing={0.5}>
                    <CircularProgress size={8} />
                    <CircularProgress size={8} sx={{ animationDelay: '0.2s' }} />
                    <CircularProgress size={8} sx={{ animationDelay: '0.4s' }} />
                  </Stack>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Ask about safety procedures, report hazards, or request permits..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Press Enter to send • The Safety Assistant follows company policies and OSHA guidelines
            </Typography>
          </Box>
        </Paper>

        {/* Quick Actions Sidebar */}
        <Collapse in={showQuickActions} orientation="horizontal">
          <Paper sx={{ width: 320, height: '100%', overflow: 'auto', p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a common safety task to get started
            </Typography>

            {quickActions.map((category) => {
              const IconComponent = category.icon;
              return (
                <Box key={category.category} sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <IconComponent fontSize="small" color={category.color} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      {category.category}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.5}>
                    {category.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="text"
                        size="small"
                        onClick={() => handleQuickAction(action.prompt)}
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          textTransform: 'none',
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              );
            })}

            <Divider sx={{ my: 2 }} />

            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Remember</AlertTitle>
              <Typography variant="body2">
                I can recommend stopping work if I detect unsafe conditions. This is for your protection.
              </Typography>
            </Alert>

            <Alert severity="warning">
              <AlertTitle>Emergency?</AlertTitle>
              <Typography variant="body2">
                For life-threatening emergencies, call <strong>911</strong> immediately. Then report here.
              </Typography>
            </Alert>
          </Paper>
        </Collapse>
      </Box>
    </Box>
  );
}
