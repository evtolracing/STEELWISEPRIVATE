// Mock data for planning/scheduling pages

export const mockJobs = [
  {
    id: '1',
    jobNumber: 'JOB-000001',
    status: 'ORDERED',
    priority: 5,
    scheduledStart: '2026-01-20T08:00:00Z',
    scheduledEnd: '2026-01-20T16:00:00Z',
    operationType: 'Slitting',
    order: {
      id: 'ord-1',
      orderNumber: 'ORD-2026-001',
      buyerId: 'buyer-1',
    },
    workCenter: {
      id: 'wc-1',
      code: 'SLIT-01',
      name: 'Slitter Line 1',
    },
    assignedTo: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Smith',
    },
  },
  {
    id: '2',
    jobNumber: 'JOB-000002',
    status: 'SCHEDULED',
    priority: 3,
    scheduledStart: '2026-01-21T08:00:00Z',
    scheduledEnd: '2026-01-21T12:00:00Z',
    operationType: 'Shearing',
    order: {
      id: 'ord-2',
      orderNumber: 'ORD-2026-002',
      buyerId: 'buyer-2',
    },
    workCenter: {
      id: 'wc-2',
      code: 'SHEAR-01',
      name: 'Shear Line 1',
    },
    assignedTo: {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Doe',
    },
  },
  {
    id: '3',
    jobNumber: 'JOB-000003',
    status: 'IN_PROCESS',
    priority: 1,
    scheduledStart: '2026-01-18T08:00:00Z',
    scheduledEnd: '2026-01-18T17:00:00Z',
    actualStart: '2026-01-18T08:15:00Z',
    operationType: 'Leveling',
    order: {
      id: 'ord-3',
      orderNumber: 'ORD-2026-003',
      buyerId: 'buyer-3',
    },
    workCenter: {
      id: 'wc-3',
      code: 'LEVEL-01',
      name: 'Leveler Line 1',
    },
    assignedTo: {
      id: 'user-3',
      firstName: 'Mike',
      lastName: 'Johnson',
    },
  },
  {
    id: '4',
    jobNumber: 'JOB-000004',
    status: 'WAITING_QC',
    priority: 2,
    scheduledStart: '2026-01-17T08:00:00Z',
    scheduledEnd: '2026-01-17T16:00:00Z',
    actualStart: '2026-01-17T08:10:00Z',
    actualEnd: '2026-01-17T15:45:00Z',
    operationType: 'Blanking',
    order: {
      id: 'ord-4',
      orderNumber: 'ORD-2026-004',
      buyerId: 'buyer-4',
    },
    workCenter: {
      id: 'wc-4',
      code: 'BLANK-01',
      name: 'Blanking Line 1',
    },
    assignedTo: {
      id: 'user-4',
      firstName: 'Sarah',
      lastName: 'Williams',
    },
  },
  {
    id: '5',
    jobNumber: 'JOB-000005',
    status: 'PACKAGING',
    priority: 3,
    scheduledStart: '2026-01-16T08:00:00Z',
    scheduledEnd: '2026-01-16T12:00:00Z',
    actualStart: '2026-01-16T08:05:00Z',
    actualEnd: '2026-01-16T11:50:00Z',
    operationType: 'Edge Trimming',
    order: {
      id: 'ord-5',
      orderNumber: 'ORD-2026-005',
      buyerId: 'buyer-5',
    },
    workCenter: {
      id: 'wc-5',
      code: 'TRIM-01',
      name: 'Edge Trimmer 1',
    },
    assignedTo: null,
  },
  {
    id: '6',
    jobNumber: 'JOB-000006',
    status: 'READY_TO_SHIP',
    priority: 1,
    scheduledStart: '2026-01-15T08:00:00Z',
    scheduledEnd: '2026-01-15T14:00:00Z',
    actualStart: '2026-01-15T08:00:00Z',
    actualEnd: '2026-01-15T13:30:00Z',
    operationType: 'Slitting',
    order: {
      id: 'ord-6',
      orderNumber: 'ORD-2026-006',
      buyerId: 'buyer-1',
    },
    workCenter: {
      id: 'wc-1',
      code: 'SLIT-01',
      name: 'Slitter Line 1',
    },
    assignedTo: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Smith',
    },
  },
  {
    id: '7',
    jobNumber: 'JOB-000007',
    status: 'SHIPPED',
    priority: 4,
    scheduledStart: '2026-01-14T08:00:00Z',
    scheduledEnd: '2026-01-14T16:00:00Z',
    actualStart: '2026-01-14T08:10:00Z',
    actualEnd: '2026-01-14T15:45:00Z',
    operationType: 'Shearing',
    order: {
      id: 'ord-7',
      orderNumber: 'ORD-2026-007',
      buyerId: 'buyer-2',
    },
    workCenter: {
      id: 'wc-2',
      code: 'SHEAR-01',
      name: 'Shear Line 1',
    },
    assignedTo: {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Doe',
    },
  },
  {
    id: '8',
    jobNumber: 'JOB-000008',
    status: 'COMPLETED',
    priority: 3,
    scheduledStart: '2026-01-13T08:00:00Z',
    scheduledEnd: '2026-01-13T12:00:00Z',
    actualStart: '2026-01-13T08:05:00Z',
    actualEnd: '2026-01-13T11:55:00Z',
    operationType: 'Leveling',
    order: {
      id: 'ord-8',
      orderNumber: 'ORD-2026-008',
      buyerId: 'buyer-3',
    },
    workCenter: {
      id: 'wc-3',
      code: 'LEVEL-01',
      name: 'Leveler Line 1',
    },
    assignedTo: {
      id: 'user-3',
      firstName: 'Mike',
      lastName: 'Johnson',
    },
  },
  {
    id: '9',
    jobNumber: 'JOB-000009',
    status: 'ON_HOLD',
    priority: 5,
    scheduledStart: '2026-01-19T08:00:00Z',
    scheduledEnd: '2026-01-19T16:00:00Z',
    operationType: 'Blanking',
    notes: 'Waiting for material delivery',
    order: {
      id: 'ord-9',
      orderNumber: 'ORD-2026-009',
      buyerId: 'buyer-4',
    },
    workCenter: {
      id: 'wc-4',
      code: 'BLANK-01',
      name: 'Blanking Line 1',
    },
    assignedTo: {
      id: 'user-4',
      firstName: 'Sarah',
      lastName: 'Williams',
    },
  },
  {
    id: '10',
    jobNumber: 'JOB-000010',
    status: 'SCHEDULED',
    priority: 2,
    scheduledStart: '2026-01-22T08:00:00Z',
    scheduledEnd: '2026-01-22T16:00:00Z',
    operationType: 'Edge Trimming',
    order: {
      id: 'ord-10',
      orderNumber: 'ORD-2026-010',
      buyerId: 'buyer-5',
    },
    workCenter: {
      id: 'wc-5',
      code: 'TRIM-01',
      name: 'Edge Trimmer 1',
    },
    assignedTo: null,
  },
];

export const mockWorkCenters = [
  {
    id: 'wc-1',
    code: 'SLIT-01',
    name: 'Slitter Line 1',
    type: 'Slitting',
    capabilities: ['Slitting', 'Coil Processing'],
    isActive: true,
    location: {
      id: 'loc-1',
      code: 'PLANT-01',
      name: 'Main Plant',
    },
  },
  {
    id: 'wc-2',
    code: 'SHEAR-01',
    name: 'Shear Line 1',
    type: 'Shearing',
    capabilities: ['Shearing', 'Blanking'],
    isActive: true,
    location: {
      id: 'loc-1',
      code: 'PLANT-01',
      name: 'Main Plant',
    },
  },
  {
    id: 'wc-3',
    code: 'LEVEL-01',
    name: 'Leveler Line 1',
    type: 'Leveling',
    capabilities: ['Leveling', 'Flattening'],
    isActive: true,
    location: {
      id: 'loc-1',
      code: 'PLANT-01',
      name: 'Main Plant',
    },
  },
  {
    id: 'wc-4',
    code: 'BLANK-01',
    name: 'Blanking Line 1',
    type: 'Blanking',
    capabilities: ['Blanking', 'Stamping'],
    isActive: true,
    location: {
      id: 'loc-1',
      code: 'PLANT-01',
      name: 'Main Plant',
    },
  },
  {
    id: 'wc-5',
    code: 'TRIM-01',
    name: 'Edge Trimmer 1',
    type: 'Edge Trimming',
    capabilities: ['Edge Trimming', 'Deburring'],
    isActive: true,
    location: {
      id: 'loc-1',
      code: 'PLANT-01',
      name: 'Main Plant',
    },
  },
  {
    id: 'wc-6',
    code: 'PACK-01',
    name: 'Packaging Station 1',
    type: 'Packaging',
    capabilities: ['Packaging', 'Labeling', 'Banding'],
    isActive: true,
    location: {
      id: 'loc-1',
      code: 'PLANT-01',
      name: 'Main Plant',
    },
  },
];

// Calculate work center statistics
export const getWorkCenterStats = () => {
  return mockWorkCenters.map(wc => {
    const wcJobs = mockJobs.filter(job => job.workCenter?.id === wc.id);
    const activeJobs = wcJobs.filter(job => 
      job.status === 'IN_PROCESS' || job.status === 'SCHEDULED'
    );
    const queuedJobs = wcJobs.filter(job => job.status === 'SCHEDULED');
    
    return {
      ...wc,
      activeJobCount: activeJobs.length,
      queuedJobCount: queuedJobs.length,
      jobs: wcJobs,
    };
  });
};

// Get job count by status
export const getJobStatusCounts = () => {
  const statuses = [
    'ORDERED',
    'SCHEDULED',
    'IN_PROCESS',
    'WAITING_QC',
    'PACKAGING',
    'READY_TO_SHIP',
    'SHIPPED',
    'COMPLETED',
    'ON_HOLD',
  ];
  
  return statuses.reduce((acc, status) => {
    acc[status] = mockJobs.filter(job => job.status === status).length;
    return acc;
  }, {});
};
