import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from '@mui/material'
import {
  Search as SearchIcon,
  School as CourseIcon,
  PlayCircle as StartIcon,
  Timer as DurationIcon,
  Assignment as ModuleIcon,
  CheckCircle as CheckIcon,
  Videocam as VideoIcon,
  Quiz as QuizIcon,
  MenuBook as TextIcon,
  TouchApp as InteractiveIcon,
  CalendarMonth as RecertIcon,
} from '@mui/icons-material'

// Mock Course Catalog Data
const mockCourses = [
  {
    id: '1',
    code: 'GSO-101',
    name: 'General Safety Orientation',
    description: 'Comprehensive safety orientation covering facility hazards, emergency procedures, PPE requirements, and general safety rules.',
    format: 'ONLINE',
    duration: 60,
    modules: 6,
    competencyGranted: 'General Safety Awareness',
    hazardLevel: 'LOW',
    recertInterval: 12,
    category: 'SAFETY',
    prerequisites: [],
    status: 'ACTIVE',
  },
  {
    id: '2',
    code: 'FORK-101',
    name: 'Forklift Operation Fundamentals',
    description: 'Complete forklift operator certification course including classroom instruction, practical training, and performance evaluation.',
    format: 'BLENDED',
    duration: 480,
    modules: 8,
    competencyGranted: 'Forklift Operation - Qualified',
    hazardLevel: 'MEDIUM',
    recertInterval: 36,
    category: 'EQUIPMENT',
    prerequisites: ['GSO-101'],
    status: 'ACTIVE',
  },
  {
    id: '3',
    code: 'LOTO-201',
    name: 'LOTO Authorized Person Training',
    description: 'Lockout/Tagout training for authorized persons who apply energy isolation devices.',
    format: 'BLENDED',
    duration: 240,
    modules: 5,
    competencyGranted: 'LOTO Authorized',
    hazardLevel: 'HIGH',
    recertInterval: 12,
    category: 'SAFETY',
    prerequisites: ['GSO-101'],
    status: 'ACTIVE',
  },
  {
    id: '4',
    code: 'SAW-101',
    name: 'Horizontal Bandsaw Operation',
    description: 'Machine-specific training for horizontal bandsaw operation including setup, operation, and blade change procedures.',
    format: 'OJT',
    duration: 180,
    modules: 4,
    competencyGranted: 'Horizontal Bandsaw - Qualified',
    hazardLevel: 'MEDIUM',
    recertInterval: 24,
    category: 'EQUIPMENT',
    prerequisites: ['GSO-101', 'LOTO-201'],
    status: 'ACTIVE',
  },
  {
    id: '5',
    code: 'CRANE-101',
    name: 'Overhead Crane Operation',
    description: 'Comprehensive overhead crane operator training including rigging basics, load calculation, and hand signals.',
    format: 'BLENDED',
    duration: 360,
    modules: 7,
    competencyGranted: 'Overhead Crane - Qualified',
    hazardLevel: 'CRITICAL',
    recertInterval: 12,
    category: 'EQUIPMENT',
    prerequisites: ['GSO-101'],
    status: 'ACTIVE',
  },
  {
    id: '6',
    code: 'HOTWORK-101',
    name: 'Hot Work Permit Training',
    description: 'Training for performing and supervising hot work operations including fire watch responsibilities.',
    format: 'CLASSROOM',
    duration: 120,
    modules: 3,
    competencyGranted: 'Hot Work Permit - Qualified',
    hazardLevel: 'CRITICAL',
    recertInterval: 12,
    category: 'SAFETY',
    prerequisites: ['GSO-101'],
    status: 'ACTIVE',
  },
  {
    id: '7',
    code: 'FIRSTAID-101',
    name: 'First Aid / CPR / AED',
    description: 'American Red Cross First Aid, CPR, and AED certification course.',
    format: 'CLASSROOM',
    duration: 480,
    modules: 4,
    competencyGranted: 'First Aid/CPR/AED Certified',
    hazardLevel: 'LOW',
    recertInterval: 24,
    category: 'SAFETY',
    prerequisites: [],
    status: 'ACTIVE',
  },
  {
    id: '8',
    code: 'ELEC-301',
    name: 'Electrical Safety - Qualified Person',
    description: 'NFPA 70E electrical safety training for qualified electrical workers.',
    format: 'BLENDED',
    duration: 480,
    modules: 6,
    competencyGranted: 'Electrical Safety - Qualified',
    hazardLevel: 'CRITICAL',
    recertInterval: 12,
    category: 'SAFETY',
    prerequisites: ['GSO-101', 'LOTO-201'],
    status: 'ACTIVE',
  },
]

const formatConfig = {
  ONLINE: { label: 'Online', color: 'info' },
  CLASSROOM: { label: 'Classroom', color: 'primary' },
  OJT: { label: 'On-the-Job', color: 'warning' },
  BLENDED: { label: 'Blended', color: 'success' },
}

const hazardConfig = {
  LOW: { label: 'Low', color: 'success' },
  MEDIUM: { label: 'Medium', color: 'warning' },
  HIGH: { label: 'High', color: 'error' },
  CRITICAL: { label: 'Critical', color: 'error' },
}

const categoryConfig = {
  SAFETY: { label: 'Safety', color: 'error' },
  EQUIPMENT: { label: 'Equipment', color: 'primary' },
  PROCESS: { label: 'Process', color: 'info' },
  HAZARD: { label: 'Hazard', color: 'warning' },
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export default function CourseCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [formatFilter, setFormatFilter] = useState('ALL')
  const [selectedCourse, setSelectedCourse] = useState(null)

  const filteredCourses = mockCourses.filter((course) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !course.name.toLowerCase().includes(query) &&
        !course.code.toLowerCase().includes(query) &&
        !course.description.toLowerCase().includes(query)
      ) {
        return false
      }
    }
    if (categoryFilter !== 'ALL' && course.category !== categoryFilter) return false
    if (formatFilter !== 'ALL' && course.format !== formatFilter) return false
    return true
  })

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Training Course Catalog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse available safety and competency training courses
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search courses by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                <MenuItem value="SAFETY">Safety</MenuItem>
                <MenuItem value="EQUIPMENT">Equipment</MenuItem>
                <MenuItem value="PROCESS">Process</MenuItem>
                <MenuItem value="HAZARD">Hazard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={formatFilter}
                label="Format"
                onChange={(e) => setFormatFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Formats</MenuItem>
                <MenuItem value="ONLINE">Online</MenuItem>
                <MenuItem value="CLASSROOM">Classroom</MenuItem>
                <MenuItem value="OJT">On-the-Job</MenuItem>
                <MenuItem value="BLENDED">Blended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Course Grid */}
      <Grid container spacing={3}>
        {filteredCourses.map((course) => {
          const format = formatConfig[course.format]
          const hazard = hazardConfig[course.hazardLevel]
          const category = categoryConfig[course.category]

          return (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip label={course.code} size="small" variant="outlined" />
                    <Chip label={hazard.label} color={hazard.color} size="small" />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {course.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {course.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      icon={<DurationIcon />}
                      label={formatDuration(course.duration)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip label={format.label} color={format.color} size="small" />
                    <Chip label={category.label} size="small" variant="outlined" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ModuleIcon fontSize="small" color="action" />
                      <Typography variant="caption">{course.modules} modules</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <RecertIcon fontSize="small" color="action" />
                      <Typography variant="caption">{course.recertInterval} mo recert</Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button size="small" onClick={() => setSelectedCourse(course)}>
                    View Details
                  </Button>
                  <Button size="small" variant="contained" startIcon={<StartIcon />}>
                    Enroll
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Course Detail Dialog */}
      <Dialog
        open={!!selectedCourse}
        onClose={() => setSelectedCourse(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedCourse && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <CourseIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedCourse.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCourse.code}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body1" paragraph>
                    {selectedCourse.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Course Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <DurationIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Duration"
                        secondary={formatDuration(selectedCourse.duration)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ModuleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Modules" secondary={selectedCourse.modules} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <RecertIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Recertification"
                        secondary={`Every ${selectedCourse.recertInterval} months`}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Competency Granted
                  </Typography>
                  <Chip
                    icon={<CheckIcon />}
                    label={selectedCourse.competencyGranted}
                    color="success"
                    sx={{ mb: 2 }}
                  />

                  {selectedCourse.prerequisites.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Prerequisites
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {selectedCourse.prerequisites.map((prereq) => (
                          <Chip key={prereq} label={prereq} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Format
                  </Typography>
                  <Chip
                    label={formatConfig[selectedCourse.format].label}
                    color={formatConfig[selectedCourse.format].color}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedCourse(null)}>Close</Button>
              <Button variant="contained" startIcon={<StartIcon />}>
                Enroll Now
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
