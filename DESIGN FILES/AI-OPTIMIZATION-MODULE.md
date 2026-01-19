# Work Order Optimization AI Module

## Overview

The Work Order Optimization AI module provides intelligent job sequencing, work center assignment, and schedule optimization for service center operations. It helps schedulers and plant managers maximize throughput, protect SLAs, identify bottlenecks, and balance load across machines and shifts.

## Architecture

### Backend: `src/backend/src/routes/optimizationV1.js`

**Endpoints:**

1. **POST `/api/v1/ai/work-order-optimize/preview`**
   - Generates an optimized schedule proposal without committing changes
   - Request body:
     ```json
     {
       "locationId": "LOC-JACKSON",
       "division": "METALS",
       "horizonHours": 72,
       "jobIds": ["JOB-001", "JOB-002"]
     }
     ```
   - Response includes:
     - `optimizedJobs`: Array of jobs with assigned work centers and scheduled times
     - `unassignedJobs`: Jobs that couldn't be scheduled (with reasons)
     - `workCenterSchedules`: Detailed schedule for each work center
     - `bottlenecks`: Overloaded work centers (>90% utilization)
     - `metrics`: Overall statistics (utilization, jobs at risk, etc.)
     - `recommendations`: AI-generated action items

2. **POST `/api/v1/ai/work-order-optimize/apply`**
   - Commits an optimized schedule to the database
   - Request body:
     ```json
     {
       "optimizedJobs": [/* array of jobs from preview */]
     }
     ```
   - Updates job records with workCenterId, scheduledStart, scheduledEnd

3. **GET `/api/v1/ai/work-order-optimize/analysis`**
   - Analyzes current schedule without optimization
   - Query params: `locationId`, `division`
   - Returns metrics, bottlenecks, recommendations, work center utilization

4. **POST `/api/v1/ai/work-order-optimize/simulate`**
   - What-if scenario testing
   - Request body:
     ```json
     {
       "scenario": "Add Saw #3",
       "modifications": {
         "addWorkCenter": { /* work center object */ },
         "changePriorities": [
           { "jobId": "JOB-001", "newPriority": "HOT" }
         ]
       }
     }
     ```
   - Returns baseline vs simulated comparison

### Optimization Algorithm

**Priority Scoring:**
- Combines job priority (HOT/RUSH/VIP/NORMAL/LOW) with time urgency
- Jobs closer to due date receive higher urgency scores
- Formula: `priorityScore = (priorityWeight * 0.6) + (urgencyScore * 0.4)`

**Scheduling Strategy:**
1. Filter jobs by location/division
2. Calculate priority scores for all jobs
3. Sort jobs by priority (descending)
4. Use greedy algorithm to assign jobs:
   - Find work centers matching job's workCenterType
   - Assign to work center with earliest availability
   - Update work center's nextAvailableTime
5. Identify bottlenecks (utilization > 90%)
6. Flag jobs at risk (scheduledEnd > dueDate)
7. Generate recommendations

**Bottleneck Detection:**
- CRITICAL: Utilization > 100%
- WARNING: Utilization > 90%

**Recommendations:**
- BOTTLENECK: Work center overloaded, suggest redistribution
- SLA_RISK: Jobs may miss due dates, suggest expediting
- CAPACITY: Jobs unassigned, suggest adding equipment

### Frontend: `src/frontend/src/apps/optimization/`

**Components:**

1. **WorkOrderOptimizationPage.jsx** (main dashboard)
   - Metrics cards: Total jobs, utilization, jobs at risk, bottlenecks
   - AI recommendations panel with severity alerts
   - Bottlenecks table with utilization percentages
   - Work center utilization grid
   - Optimization preview section (when generated)
   - Apply/cancel controls for schedule commitment

2. **OptimizationApp.jsx** (router)
   - Single route for optimization dashboard

3. **optimizationApi.js** (service layer)
   - `getOptimizationPreview(params)`
   - `applyOptimization(optimizedJobs)`
   - `getOptimizationAnalysis(params)`
   - `simulateScenario(scenario, modifications)`

## Data Model

### Job (extended from existing)
```javascript
{
  id: string,
  jobNumber: string,
  orderId: string,
  orderLineId: string,
  materialCode: string,
  commodity: string,
  form: string,
  grade: string,
  thickness: number,
  division: string,
  locationId: string,
  workCenterType: string,      // SAW, ROUTER, WATERJET, SHEAR, etc.
  workCenterId: string | null, // actual machine assignment
  status: string,              // ORDERED, SCHEDULED, IN_PROCESS, etc.
  scheduledStart: string | null,
  scheduledEnd: string | null,
  estimatedMinutes: number,    // from BOM recipe
  priority: string,            // NORMAL, HOT, RUSH, VIP
  dueDate: string,             // ISO 8601
  recipeId: string,
  recipeVersion: number,
  hasCustomRouting: boolean
}
```

### WorkCenter (existing)
```javascript
{
  id: string,
  name: string,
  locationId: string,
  division: string,
  workCenterType: string,
  shiftCapacityMinutesPerDay: number,
  isOnline: boolean
}
```

## UI Flow

1. **Initial Load:**
   - Dashboard loads analysis for current location/division
   - Displays metrics, bottlenecks, recommendations
   - Shows work center utilization

2. **Generate Optimization:**
   - User clicks "Generate Optimized Schedule"
   - System runs optimization algorithm
   - Preview panel appears with proposed schedule
   - Shows comparison: assigned jobs, bottlenecks, at-risk jobs

3. **Review & Apply:**
   - User reviews optimized schedule in table
   - Can expand to see individual job assignments
   - Clicks "Apply Schedule" to commit changes
   - System updates job records in database

4. **What-If Scenarios (future):**
   - User modifies parameters (add work center, change priorities)
   - Runs simulation to see impact
   - Compares baseline vs simulated metrics

## Integration Points

### With BOM/Recipes Module
- Uses `estimatedMinutes` from BOM operations
- Jobs created from orders use recipe data
- Future: Could re-optimize when recipe changes

### With Jobs Module
- Updates job fields: workCenterId, scheduledStart, scheduledEnd
- Respects job status (only optimizes ORDERED/SCHEDULED)
- Future: Live updates as jobs progress

### With Work Centers Module
- Queries available work centers by type
- Respects capacity constraints (shiftCapacityMinutesPerDay)
- Filters out offline work centers

## Navigation

- **Sidebar:** Operations → AI Optimization
- **Route:** `/optimization`
- **Icon:** AutoAwesome (sparkle)

## Sample Data

The backend includes 3 sample jobs and 4 sample work centers for testing:
- Jobs: SAW (HOT, 8hr due), SHEAR (NORMAL, 24hr due), ROUTER (RUSH, 12hr due)
- Work Centers: 2 Saws, 1 Shear, 1 Router

## Future Enhancements

1. **Machine Learning Integration:**
   - Use historical data to improve time estimates
   - Predict equipment downtime
   - Learn operator skill levels

2. **Real-Time Optimization:**
   - Auto-reoptimize when jobs complete early/late
   - Handle rush orders dynamically
   - React to equipment failures

3. **Multi-Objective Optimization:**
   - Minimize setup time (material/tool changes)
   - Balance shift loading
   - Optimize for energy costs

4. **Constraint Handling:**
   - Operator qualifications
   - Material availability
   - Customer priority tiers

5. **Advanced UI:**
   - Gantt chart view of schedules
   - Drag-and-drop manual adjustments
   - Interactive what-if scenarios
   - Export schedules to PDF/Excel

## Testing

**Backend:**
```bash
cd src/backend
# Start server
npm run dev

# Test preview endpoint
curl -X POST http://localhost:3001/api/v1/ai/work-order-optimize/preview \
  -H "Content-Type: application/json" \
  -d '{"horizonHours": 72}'

# Test analysis endpoint
curl http://localhost:3001/api/v1/ai/work-order-optimize/analysis
```

**Frontend:**
1. Navigate to http://localhost:5176/optimization
2. Click "Generate Optimized Schedule"
3. Review preview panel
4. Click "Apply Schedule" to commit

## Performance Considerations

- Current implementation uses in-memory data and greedy algorithm (O(n log n))
- For production with 1000+ jobs: consider caching, pagination, incremental updates
- For complex constraints: integrate with constraint programming solver (Google OR-Tools)
- For real-time: use WebSocket for live schedule updates

## Security & Permissions

- Future: Restrict optimization controls to schedulers/managers
- Log all schedule changes for audit trail
- Require confirmation before applying (protect against accidental changes)
