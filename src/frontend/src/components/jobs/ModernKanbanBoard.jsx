import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Badge,
  Chip,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  Divider,
  Stack,
  Fade,
  Zoom,
  alpha,
  Button,
  Drawer,
  Avatar,
  CircularProgress,
  Collapse,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  ViewColumn as ColumnIcon,
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Send as SendIcon,
  TipsAndUpdates as TipsIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Schedule as ScheduleIcon,
  LocalFireDepartment as FireIcon,
  Bolt as BoltIcon,
  SmartToy as BotIcon,
  Lightbulb as IdeaIcon,
  ArrowForward as ArrowIcon,
  Analytics as AnalyticsIcon,
  Psychology as ThinkIcon,
} from '@mui/icons-material'
import { KANBAN_COLUMNS, JOB_STATUS_CONFIG } from '../../constants/jobStatuses'
import ModernJobCard from './ModernJobCard'

// AI Quick Actions
const AI_QUICK_ACTIONS = [
  { id: 'optimize', label: 'Optimize Schedule', icon: SpeedIcon, color: '#1976d2' },
  { id: 'analyze', label: 'Analyze Bottlenecks', icon: AnalyticsIcon, color: '#9c27b0' },
  { id: 'predict', label: 'Predict Delays', icon: ScheduleIcon, color: '#ff9800' },
  { id: 'prioritize', label: 'Smart Prioritize', icon: BoltIcon, color: '#f44336' },
]

// Modern Kanban Column
const ModernKanbanColumn = ({
  column,
  jobs,
  onJobClick,
  onStartJob,
  onPauseJob,
  onCompleteJob,
  onUpdateJob,
  onDrop,
  onAIAssist,
  isDropTarget,
}) => {
  const config = JOB_STATUS_CONFIG[column.status] || JOB_STATUS_CONFIG[column.statuses?.[0]] || {}
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Filter jobs by column's statuses array
  const columnJobs = jobs.filter(job => 
    column.statuses ? column.statuses.includes(job.status) : job.status === column.status
  )

  // Sort jobs by priority and due date
  const sortedJobs = [...columnJobs].sort((a, b) => {
    const priorityOrder = { HOT: 0, URGENT: 1, NORMAL: 2, LOW: 3 }
    const pA = priorityOrder[a.priority] ?? 2
    const pB = priorityOrder[b.priority] ?? 2
    if (pA !== pB) return pA - pB
    return new Date(a.dueDate || 0) - new Date(b.dueDate || 0)
  })

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const jobId = e.dataTransfer.getData('jobId')
    if (jobId && onDrop) {
      const targetStatus = column.statuses ? column.statuses[0] : column.status
      onDrop(jobId, targetStatus)
    }
  }

  // Stats
  const hotJobs = columnJobs.filter(j => j.priority === 'HOT').length
  const overdueJobs = columnJobs.filter(j => j.dueDate && new Date(j.dueDate) < new Date()).length

  return (
    <Paper
      elevation={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        minWidth: 320,
        maxWidth: 360,
        flex: '1 1 320px',
        display: 'flex',
        flexDirection: 'column',
        background: isDragOver 
          ? `linear-gradient(180deg, ${alpha(config.color || '#1976d2', 0.08)}, ${alpha(config.color || '#1976d2', 0.02)})`
          : 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
        borderRadius: 3,
        height: '100%',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isDragOver ? config.color || 'primary.main' : alpha('#000', 0.08),
        transition: 'all 0.3s ease',
        transform: isDragOver ? 'scale(1.01)' : 'none',
        boxShadow: isDragOver 
          ? `0 8px 32px ${alpha(config.color || '#1976d2', 0.15)}`
          : '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${alpha(config.color || '#1976d2', 0.1)}, ${alpha(config.color || '#1976d2', 0.02)})`,
          borderBottom: '2px solid',
          borderColor: config.color || 'grey.300',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {config.icon && (
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: alpha(config.color || '#1976d2', 0.15),
                  color: config.color,
                }}
              >
                {React.createElement(config.icon, { sx: { fontSize: 18 } })}
              </Avatar>
            )}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {column.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {columnJobs.length} job{columnJobs.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={0.5}>
            {hotJobs > 0 && (
              <Tooltip title={`${hotJobs} hot job${hotJobs > 1 ? 's' : ''}`}>
                <Chip 
                  icon={<FireIcon sx={{ fontSize: '14px !important' }} />}
                  label={hotJobs} 
                  size="small" 
                  sx={{ 
                    height: 24,
                    bgcolor: alpha('#f44336', 0.1),
                    color: 'error.main',
                    fontWeight: 700,
                    '& .MuiChip-icon': { color: 'error.main' }
                  }} 
                />
              </Tooltip>
            )}
            {overdueJobs > 0 && (
              <Tooltip title={`${overdueJobs} overdue`}>
                <Chip 
                  icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
                  label={overdueJobs} 
                  size="small" 
                  sx={{ 
                    height: 24,
                    bgcolor: alpha('#ff9800', 0.1),
                    color: 'warning.dark',
                    fontWeight: 700,
                    '& .MuiChip-icon': { color: 'warning.dark' }
                  }} 
                />
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Column Body - Scrollable */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha('#000', 0.1),
            borderRadius: 3,
            '&:hover': {
              bgcolor: alpha('#000', 0.2),
            }
          },
        }}
      >
        {sortedJobs.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 120,
              border: '2px dashed',
              borderColor: isDragOver ? config.color || 'primary.main' : alpha('#000', 0.1),
              borderRadius: 2,
              color: 'text.disabled',
              transition: 'all 0.3s',
              bgcolor: isDragOver ? alpha(config.color || '#1976d2', 0.02) : 'transparent',
            }}
          >
            <Typography variant="body2" fontWeight={500}>
              {isDragOver ? 'Drop here' : 'No jobs'}
            </Typography>
            <Typography variant="caption">
              {isDragOver ? 'Release to move job' : 'Drag jobs to this column'}
            </Typography>
          </Box>
        ) : (
          sortedJobs.map((job) => (
            <ModernJobCard
              key={job.id}
              job={job}
              onClick={() => onJobClick?.(job)}
              onStart={onStartJob}
              onPause={onPauseJob}
              onComplete={onCompleteJob}
              onUpdate={onUpdateJob}
              onAIAssist={onAIAssist}
              draggable
              showAIHints
            />
          ))
        )}
      </Box>
    </Paper>
  )
}

// AI Assistant Panel
const AIAssistantPanel = ({ 
  open, 
  onClose, 
  selectedJob,
  jobs,
  onSuggestionApply,
}) => {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Initial greeting
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: selectedJob 
          ? `I'm here to help with job **${selectedJob.jobNumber || selectedJob.id}**. What would you like to know?`
          : `Hello! I'm your AI scheduling assistant. I can help you optimize your workflow, analyze bottlenecks, and predict potential delays. What would you like to do?`,
        suggestions: selectedJob ? [
          'What\'s the best time to schedule this?',
          'Are there any conflicts?',
          'Suggest optimal work center',
        ] : [
          'Optimize today\'s schedule',
          'Show overdue jobs',
          'Predict tomorrow\'s workload',
        ]
      }])
    }
  }, [open, selectedJob])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!query.trim()) return

    const userMessage = { role: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setIsTyping(true)

    // Simulate AI response (in production, this would call your AI backend)
    setTimeout(() => {
      const response = generateAIResponse(query, selectedJob, jobs)
      setMessages(prev => [...prev, { role: 'assistant', ...response }])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const generateAIResponse = (q, job, allJobs) => {
    const lowerQ = q.toLowerCase()
    
    // Job-specific responses
    if (job) {
      if (lowerQ.includes('schedule') || lowerQ.includes('time')) {
        return {
          content: `Based on current workload and the ${job.priority} priority, I recommend scheduling **${job.jobNumber}** for early morning when the ${job.workCenterName || 'work center'} has the most availability. This would reduce wait time by approximately 23%.`,
          suggestions: ['Apply this schedule', 'Show alternatives', 'Check conflicts'],
        }
      }
      if (lowerQ.includes('conflict') || lowerQ.includes('issue')) {
        return {
          content: `I've analyzed the schedule and found **no direct conflicts** for this job. However, there are 2 other ${job.priority === 'HOT' ? 'hot' : 'high-priority'} jobs that may compete for resources. Consider staggering start times.`,
          suggestions: ['Show competing jobs', 'Adjust priority', 'Notify operators'],
        }
      }
    }

    // General responses
    if (lowerQ.includes('optimize') || lowerQ.includes('schedule')) {
      const hotCount = allJobs.filter(j => j.priority === 'HOT').length
      const overdueCount = allJobs.filter(j => j.dueDate && new Date(j.dueDate) < new Date()).length
      return {
        content: `📊 **Schedule Analysis:**\n\n• **${hotCount}** hot jobs need immediate attention\n• **${overdueCount}** jobs are currently overdue\n• Recommended action: Prioritize overdue items first, then hot jobs\n\nI can automatically reorder your queue to optimize throughput. Would you like me to proceed?`,
        suggestions: ['Auto-optimize now', 'Show detailed plan', 'Manual review'],
        action: { type: 'optimize', label: 'Apply Optimization' },
      }
    }

    if (lowerQ.includes('overdue') || lowerQ.includes('late')) {
      const overdueJobs = allJobs.filter(j => j.dueDate && new Date(j.dueDate) < new Date())
      return {
        content: overdueJobs.length > 0 
          ? `⚠️ You have **${overdueJobs.length} overdue job${overdueJobs.length > 1 ? 's' : ''}**:\n\n${overdueJobs.slice(0, 3).map(j => `• ${j.jobNumber} - ${j.customerName || 'Customer'}`).join('\n')}\n\nShall I suggest a recovery plan?`
          : `✅ Great news! You have **no overdue jobs**. Your schedule is on track.`,
        suggestions: overdueJobs.length > 0 
          ? ['Create recovery plan', 'Notify customers', 'Escalate to manager']
          : ['View schedule', 'Predict future delays'],
      }
    }

    if (lowerQ.includes('predict') || lowerQ.includes('tomorrow') || lowerQ.includes('forecast')) {
      return {
        content: `🔮 **Tomorrow's Workload Forecast:**\n\n• Estimated jobs: **${Math.floor(allJobs.length * 0.8) + 5}**\n• Peak hours: 9 AM - 11 AM, 2 PM - 4 PM\n• Potential bottleneck: Slitter #1 (85% capacity)\n\nConsider redistributing 2-3 jobs to afternoon shifts for better balance.`,
        suggestions: ['Balance workload', 'Show capacity chart', 'Adjust staffing'],
      }
    }

    // Default response
    return {
      content: `I understand you're asking about "${q}". I can help with:\n\n• **Schedule optimization** - Reorder jobs for efficiency\n• **Conflict detection** - Find scheduling issues\n• **Predictions** - Forecast delays and bottlenecks\n• **Job analysis** - Deep dive into specific jobs\n\nWhat would you like to explore?`,
      suggestions: ['Optimize schedule', 'Analyze bottlenecks', 'Check for issues'],
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    setTimeout(() => handleSend(), 100)
  }

  const handleQuickAction = (action) => {
    setQuery(action.label)
    setTimeout(() => handleSend(), 100)
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)',
          borderLeft: '1px solid',
          borderColor: alpha('#9c27b0', 0.2),
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 50%, #ba68c8 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              width: 40, 
              height: 40,
              animation: 'float 3s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-5px)' },
              }
            }}>
              <BotIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>AI Assistant</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {selectedJob ? `Helping with ${selectedJob.jobNumber}` : 'Ready to help'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
          QUICK ACTIONS
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {AI_QUICK_ACTIONS.map((action) => (
            <Chip
              key={action.id}
              icon={<action.icon sx={{ fontSize: '16px !important', color: `${action.color} !important` }} />}
              label={action.label}
              onClick={() => handleQuickAction(action)}
              sx={{
                bgcolor: alpha(action.color, 0.1),
                color: action.color,
                fontWeight: 500,
                fontSize: '0.75rem',
                '&:hover': {
                  bgcolor: alpha(action.color, 0.2),
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s',
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Messages */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {messages.map((msg, idx) => (
          <Fade in key={idx}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <Box sx={{
                maxWidth: '85%',
                p: 2,
                borderRadius: 2,
                bgcolor: msg.role === 'user' 
                  ? 'primary.main'
                  : 'white',
                color: msg.role === 'user' ? 'white' : 'text.primary',
                boxShadow: msg.role === 'user' ? 2 : 1,
                border: msg.role === 'assistant' ? '1px solid' : 'none',
                borderColor: 'divider',
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    '& strong': { fontWeight: 700 },
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>') 
                  }}
                />
              </Box>
              
              {/* Suggestions */}
              {msg.suggestions && msg.role === 'assistant' && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1, maxWidth: '85%' }}>
                  {msg.suggestions.map((sug, sIdx) => (
                    <Chip
                      key={sIdx}
                      label={sug}
                      size="small"
                      onClick={() => handleSuggestionClick(sug)}
                      sx={{
                        bgcolor: alpha('#9c27b0', 0.08),
                        color: 'secondary.main',
                        fontSize: '0.7rem',
                        height: 26,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: alpha('#9c27b0', 0.15),
                        }
                      }}
                    />
                  ))}
                </Stack>
              )}

              {/* Action Button */}
              {msg.action && msg.role === 'assistant' && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<IdeaIcon />}
                  onClick={() => onSuggestionApply?.(msg.action)}
                  sx={{
                    mt: 1,
                    background: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7b1fa2, #9c27b0)',
                    }
                  }}
                >
                  {msg.action.label}
                </Button>
              )}
            </Box>
          </Fade>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}>
              <ThinkIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              gap: 0.5,
            }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'secondary.main',
                    animation: 'bounce 1.4s infinite',
                    animationDelay: `${i * 0.2}s`,
                    '@keyframes bounce': {
                      '0%, 60%, 100%': { transform: 'translateY(0)' },
                      '30%': { transform: 'translateY(-4px)' },
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <TextField
          fullWidth
          placeholder="Ask me anything about your jobs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          InputProps={{
            sx: { 
              borderRadius: 3,
              bgcolor: 'grey.50',
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={handleSend}
                  disabled={!query.trim()}
                  sx={{ 
                    bgcolor: 'secondary.main', 
                    color: 'white',
                    '&:hover': { bgcolor: 'secondary.dark' },
                    '&.Mui-disabled': { bgcolor: 'grey.300' }
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
    </Drawer>
  )
}

// Main Modern Kanban Board Component
const ModernKanbanBoard = ({
  jobs = [],
  columns = KANBAN_COLUMNS,
  onJobClick,
  onStartJob,
  onPauseJob,
  onCompleteJob,
  onStatusChange,
  onUpdateJob,
  onRefresh,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAnchor, setFilterAnchor] = useState(null)
  const [activeFilters, setActiveFilters] = useState({
    priority: [],
    processingType: [],
    customer: [],
  })
  const [aiPanelOpen, setAIPanelOpen] = useState(false)
  const [selectedJobForAI, setSelectedJobForAI] = useState(null)

  const handleDrop = (jobId, newStatus) => {
    if (onStatusChange) {
      onStatusChange(jobId, newStatus)
    }
  }

  const handleAIAssist = (job) => {
    setSelectedJobForAI(job)
    setAIPanelOpen(true)
  }

  const openGeneralAI = () => {
    setSelectedJobForAI(null)
    setAIPanelOpen(true)
  }

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        job.jobNumber?.toLowerCase().includes(query) ||
        job.customerName?.toLowerCase().includes(query) ||
        job.material?.toLowerCase().includes(query) ||
        job.instructions?.toLowerCase().includes(query) ||
        job.id?.toString().includes(query)
      if (!matchesSearch) return false
    }

    // Priority filter
    if (activeFilters.priority.length > 0) {
      if (!activeFilters.priority.includes(job.priority)) return false
    }

    // Processing type filter
    if (activeFilters.processingType.length > 0) {
      if (!activeFilters.processingType.includes(job.processingType)) return false
    }

    return true
  })

  const activeFilterCount = Object.values(activeFilters).flat().length
  
  // Quick stats
  const totalJobs = filteredJobs.length
  const hotJobs = filteredJobs.filter(j => j.priority === 'HOT').length
  const overdueJobs = filteredJobs.filter(j => j.dueDate && new Date(j.dueDate) < new Date()).length
  const inProgressJobs = filteredJobs.filter(j => j.status === 'IN_PROCESS').length

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Modern Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          p: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid',
          borderColor: alpha('#000', 0.06),
        }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search jobs, customers, materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} fontSize="small" />
              </InputAdornment>
            ),
            sx: { 
              borderRadius: 2,
              bgcolor: 'grey.50',
              '&:hover': { bgcolor: 'grey.100' },
            }
          }}
          sx={{ minWidth: 280 }}
        />

        {/* Filters */}
        <Tooltip title="Filters">
          <IconButton 
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{ 
              bgcolor: activeFilterCount > 0 ? alpha('#1976d2', 0.1) : 'transparent',
              '&:hover': { bgcolor: alpha('#1976d2', 0.15) }
            }}
          >
            <Badge badgeContent={activeFilterCount} color="primary">
              <FilterIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 180 } }}
        >
          <MenuItem disabled>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              PRIORITY
            </Typography>
          </MenuItem>
          {['HOT', 'URGENT', 'NORMAL', 'LOW'].map((priority) => (
            <MenuItem
              key={priority}
              selected={activeFilters.priority.includes(priority)}
              onClick={() => {
                setActiveFilters((prev) => ({
                  ...prev,
                  priority: prev.priority.includes(priority)
                    ? prev.priority.filter((p) => p !== priority)
                    : [...prev.priority, priority],
                }))
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {priority === 'HOT' && <FireIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                {priority === 'URGENT' && <BoltIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                <span>{priority}</span>
              </Stack>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem
            onClick={() => setActiveFilters({ priority: [], processingType: [], customer: [] })}
          >
            <Typography color="error">Clear Filters</Typography>
          </MenuItem>
        </Menu>

        <Box sx={{ flex: 1 }} />

        {/* Quick Stats */}
        <Stack direction="row" spacing={1}>
          <Chip 
            label={`${totalJobs} total`} 
            size="small" 
            sx={{ fontWeight: 600, bgcolor: alpha('#1976d2', 0.1), color: 'primary.main' }}
          />
          {hotJobs > 0 && (
            <Chip 
              icon={<FireIcon sx={{ fontSize: '14px !important' }} />}
              label={`${hotJobs} hot`} 
              size="small" 
              sx={{ fontWeight: 600, bgcolor: alpha('#f44336', 0.1), color: 'error.main' }}
            />
          )}
          {overdueJobs > 0 && (
            <Chip 
              icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
              label={`${overdueJobs} overdue`} 
              size="small" 
              sx={{ fontWeight: 600, bgcolor: alpha('#ff9800', 0.1), color: 'warning.dark' }}
            />
          )}
          <Chip 
            icon={<SpeedIcon sx={{ fontSize: '14px !important' }} />}
            label={`${inProgressJobs} in progress`} 
            size="small" 
            sx={{ fontWeight: 600, bgcolor: alpha('#4caf50', 0.1), color: 'success.main' }}
          />
        </Stack>

        {/* AI Assistant Button */}
        <Button
          variant="contained"
          startIcon={<AIIcon />}
          onClick={openGeneralAI}
          sx={{
            background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 50%, #ba68c8 100%)',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: `0 4px 14px ${alpha('#9c27b0', 0.3)}`,
            '&:hover': {
              background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 50%, #ab47bc 100%)',
              boxShadow: `0 6px 20px ${alpha('#9c27b0', 0.4)}`,
            }
          }}
        >
          AI Assistant
        </Button>

        {/* Refresh */}
        {onRefresh && (
          <Tooltip title="Refresh jobs">
            <span>
              <IconButton 
                onClick={onRefresh} 
                disabled={loading}
                sx={{
                  bgcolor: alpha('#1976d2', 0.1),
                  '&:hover': { bgcolor: alpha('#1976d2', 0.15) }
                }}
              >
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Loading Bar */}
      <Collapse in={loading}>
        <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />
      </Collapse>

      {/* Kanban Columns */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: 0,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: alpha('#000', 0.05),
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha('#000', 0.15),
            borderRadius: 4,
            '&:hover': {
              bgcolor: alpha('#000', 0.25),
            }
          },
        }}
      >
        {columns.map((column) => (
          <ModernKanbanColumn
            key={column.id || column.status}
            column={column}
            jobs={filteredJobs}
            onJobClick={onJobClick}
            onStartJob={onStartJob}
            onPauseJob={onPauseJob}
            onCompleteJob={onCompleteJob}
            onUpdateJob={onUpdateJob}
            onDrop={handleDrop}
            onAIAssist={handleAIAssist}
          />
        ))}
      </Box>

      {/* AI Assistant Panel */}
      <AIAssistantPanel
        open={aiPanelOpen}
        onClose={() => {
          setAIPanelOpen(false)
          setSelectedJobForAI(null)
        }}
        selectedJob={selectedJobForAI}
        jobs={filteredJobs}
      />
    </Box>
  )
}

export default ModernKanbanBoard
