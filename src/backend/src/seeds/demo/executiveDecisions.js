/**
 * Demo executive decisions, loaded by `npm run db:seed:demo`.
 */
export const executiveDecisions = [
    {
      id: 'DEC-2026-0047',
      timestamp: '2026-02-04T11:30:00Z',
      type: 'RFQ_ACCEPT',
      title: 'Accepted RFQ-2026-089 with Conditions',
      description: 'Accepted 15,000 lbs 4140 Round Bar order from Acme Manufacturing',
      decisionMaker: 'Sarah Chen',
      role: 'VP Sales',
      status: 'EXECUTED',
      scenarioId: 'SCENARIO-001',
      predictedOutcome: {
        margin: '+$18,500',
        capacity: '+7% utilization',
        delivery: '95% on-time probability',
      },
      actualOutcome: {
        margin: '+$17,200',
        capacity: '+6.5% utilization',
        delivery: '100% on-time (delivered Feb 6)',
      },
      variance: {
        margin: '-7%',
        overall: 'BETTER_THAN_EXPECTED',
      },
      conditions: [
        'Cleveland capacity confirmed',
        'Extended ship date by 2 days (approved by customer)',
        'Expedited 4140 raw material (arrived Feb 5)',
      ],
      aiRecommendation: 'ACCEPT_WITH_CONDITIONS',
      aiConfidence: 78,
    },
    {
      id: 'DEC-2026-0046',
      timestamp: '2026-02-03T16:45:00Z',
      type: 'CAPACITY_TRANSFER',
      title: 'Transferred 3 Jobs from Detroit to Cleveland',
      description: 'Moved SAW cutting jobs to reduce Detroit utilization from 97% to 82%',
      decisionMaker: 'Mike Rodriguez',
      role: 'COO',
      status: 'EXECUTED',
      scenarioId: 'SCENARIO-002',
      predictedOutcome: {
        capacity: '-15% Detroit, +15% Cleveland',
        delivery: 'Maintain 96% on-time',
        cost: '+$1,200 freight adjustment',
      },
      actualOutcome: {
        capacity: '-14% Detroit, +14% Cleveland',
        delivery: '97% on-time maintained',
        cost: '+$980 freight',
      },
      variance: {
        cost: '+18% better than expected',
        overall: 'AS_EXPECTED',
      },
      conditions: [],
      aiRecommendation: 'ACCEPT',
      aiConfidence: 92,
    },
    {
      id: 'DEC-2026-0044',
      timestamp: '2026-02-01T14:30:00Z',
      type: 'MAINTENANCE_DEFER',
      title: 'Deferred LAT-03 Maintenance by 1 Week',
      description: 'Postponed scheduled lathe maintenance to complete priority orders',
      decisionMaker: 'Mike Rodriguez',
      role: 'COO',
      status: 'PENDING_OUTCOME',
      scenarioId: 'SCENARIO-003',
      predictedOutcome: {
        capacity: '+40 hours available',
        risk: '15% increased breakdown probability',
        delivery: 'Complete 4 priority orders on time',
      },
      actualOutcome: null,
      variance: null,
      conditions: [
        'Reschedule maintenance by Feb 8',
        'Daily equipment inspection required',
      ],
      aiRecommendation: 'CAUTION',
      aiConfidence: 58,
    },
  ];
