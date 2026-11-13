/**
 * Ops Cockpit API Routes
 * Real-time production data for the Ops Cockpit dashboard
 * Queries Supabase via Prisma for live Job, Order, WorkCenter, Coil, Shipment data
 * Includes AI recommendation action endpoints (accept, dismiss, modify, explain)
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { AIProviderService } from '../services/ai/AIProviderService.js';

const router = Router();
const aiService = new AIProviderService();

// ── In-memory store for dismissed/accepted recommendations ──────────
// In production this would be a DB table; for now, in-memory per server lifecycle

// ── Helper: time difference in hours from now ────────────────────────
function hoursFromNow(date) {
  if (!date) return null;
  const diff = new Date(date) - new Date();
  return +(diff / 3600000).toFixed(1);
}

function formatTimeRemaining(date) {
  if (!date) return 'N/A';
  const diff = new Date(date) - new Date();
  if (diff <= 0) return 'OVERDUE';
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// ── GET /api/ops-cockpit — Full cockpit payload ─────────────────────
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // ── Parallel queries ──────────────────────────────────────────
    // Only the rows the page lists are loaded: open jobs and today's activity.
    // Totals and breakdowns are counted in the database, so the cost of this
    // route does not grow with history.
    const FINISHED = ['SHIPPED', 'COMPLETED', 'CANCELLED'];
    const [
      allJobs,
      jobStatusCounts,
      workCenters,
      totalOrders,
      noCarrierOrders,
      coilGroups,
      heldCoilRows,
      shipmentGroups,
      todayShipmentGroups,
      opGroups,
      qcHolds,
      recentMovements,
    ] = await Promise.all([
      // Open jobs, plus anything created or finished today
      prisma.job.findMany({
        where: { OR: [{ status: { notIn: FINISHED } }, { createdAt: { gte: startOfDay } }, { actualEnd: { gte: startOfDay } }] },
        // Only the customer name is read from the order.
        include: { order: { select: { buyer: { select: { name: true } } } } },
        orderBy: [{ scheduledEnd: 'asc' }, { id: 'asc' }],
      }),
      prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),

      // All work centers
      prisma.workCenter.findMany(),

      prisma.order.count(),
      // Confirmed orders with no shipment yet
      prisma.order.count({ where: { status: 'CONFIRMED', shipments: { none: {} } } }),

      // Stock grouped by grade, form, thickness and status
      prisma.coil.groupBy({ by: ['gradeId', 'form', 'thicknessIn', 'status'], _count: { _all: true }, _sum: { netWeightLb: true } }),
      prisma.coil.findMany({ where: { status: 'HOLD' }, include: { grade: true }, orderBy: { updatedAt: 'desc' }, take: 500 }),

      // Shipments by carrier and status (all time), and by status for today
      prisma.shipment.groupBy({ by: ['carrierName', 'status'], _count: { _all: true } }),
      prisma.shipment.groupBy({ by: ['status'], where: { createdAt: { gte: startOfDay } }, _count: { _all: true } }),

      // Dispatch operations per work center and status
      prisma.dispatchOperation.groupBy({ by: ['assignedWorkCenterId', 'status'], _count: { _all: true } }),

      // QC holds
      prisma.qCHold.findMany({
        where: { status: 'ACTIVE' },
        include: { coil: { include: { grade: true } } },
      }),

      // Recent material movements
      prisma.materialMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { coil: { include: { grade: true } } },
      }),
    ]);
    const totalJobs = jobStatusCounts.reduce((n, g) => n + g._count._all, 0);
    const gradeIds = [...new Set(coilGroups.map((g) => g.gradeId).filter(Boolean))];
    const grades = gradeIds.length ? await prisma.grade.findMany({ where: { id: { in: gradeIds } }, select: { id: true, code: true } }) : [];
    const gradeCode = new Map(grades.map((g) => [g.id, g.code]));
    const coilCount = (status) => coilGroups.filter((g) => !status || g.status === status).reduce((n, g) => n + g._count._all, 0);
    const shipmentCount = (groups, statuses) => groups.filter((g) => !statuses || statuses.includes(g.status)).reduce((n, g) => n + g._count._all, 0);
    const opCount = (workCenterId, statuses) => opGroups.filter((g) => g.assignedWorkCenterId === workCenterId && statuses.includes(g.status)).reduce((n, g) => n + g._count._all, 0);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. FLOW STATE — counts by job status pipeline
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const statusMap = {
      ORDERED: 0, SCHEDULED: 0, IN_PROCESS: 0, RUNNING: 0,
      PACKAGING: 0, WAITING_QC: 0, READY_TO_SHIP: 0, SHIPPED: 0,
      COMPLETED: 0,
    };
    jobStatusCounts.forEach(g => {
      if (statusMap[g.status] !== undefined) statusMap[g.status] = g._count._all;
    });

    const flowState = {
      ordered: statusMap.ORDERED,
      scheduled: statusMap.SCHEDULED,
      inProcess: statusMap.IN_PROCESS + statusMap.RUNNING,
      packaging: statusMap.PACKAGING + statusMap.WAITING_QC,
      readyToShip: statusMap.READY_TO_SHIP,
      shipped: statusMap.SHIPPED + statusMap.COMPLETED,
    };

    // Calculate day-over-day flow changes (use createdAt as proxy)
    const todayJobs = allJobs.filter(j => j.createdAt >= startOfDay);
    const flowChanges = {
      ordered: todayJobs.filter(j => j.status === 'ORDERED').length,
      scheduled: todayJobs.filter(j => j.status === 'SCHEDULED').length,
      inProcess: todayJobs.filter(j => ['IN_PROCESS', 'RUNNING'].includes(j.status)).length,
      packaging: todayJobs.filter(j => ['PACKAGING', 'WAITING_QC'].includes(j.status)).length,
      readyToShip: todayJobs.filter(j => j.status === 'READY_TO_SHIP').length,
      shipped: todayJobs.filter(j => ['SHIPPED', 'COMPLETED'].includes(j.status)).length,
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. PROMISE RISK — hot + at-risk jobs
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const activeJobs = allJobs.filter(j =>
      !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(j.status)
    );

    const hotJobs = [];
    const atRiskJobs = [];
    let safeCount = 0;

    activeJobs.forEach(job => {
      const hrsLeft = hoursFromNow(job.scheduledEnd || job.dueDate);
      const customer = job.order?.buyer?.name || 'Unknown';
      const entry = {
        id: job.jobNumber,
        customer,
        due: formatTimeRemaining(job.scheduledEnd || job.dueDate),
        status: job.status,
        risk: getRiskReason(job, hrsLeft),
      };

      if (hrsLeft !== null && hrsLeft <= 3 && hrsLeft > 0) {
        hotJobs.push(entry);
      } else if (hrsLeft !== null && hrsLeft <= 0) {
        entry.due = 'OVERDUE 🔥';
        hotJobs.push(entry);
      } else if (hrsLeft !== null && hrsLeft <= 8) {
        atRiskJobs.push(entry);
      } else {
        safeCount++;
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. WORK CENTER UTILIZATION — real machine data
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const wcUtilization = workCenters.map(wc => {
      // Count jobs assigned to this work center
      const wcJobs = allJobs.filter(j => j.workCenterId === wc.id);
      const activeWcJobs = wcJobs.filter(j =>
        ['IN_PROCESS', 'RUNNING', 'SCHEDULED', 'ORDERED'].includes(j.status)
      );
      const hotCount = wcJobs.filter(j => {
        const h = hoursFromNow(j.scheduledEnd || j.dueDate);
        return h !== null && h <= 3 && !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(j.status);
      }).length;

      // Dispatch ops on this work center
      const runningOps = { length: opCount(wc.id, ['RUNNING', 'IN_PROGRESS']) };
      const pendingOps = { length: opCount(wc.id, ['PENDING', 'SCHEDULED']) };

      // Estimate utilization: running ops / capacity (simple heuristic)
      const totalOps = runningOps.length + pendingOps.length;
      const utilization = Math.min(100, Math.round(
        totalOps > 0 ? (totalOps / Math.max(1, totalOps + 1)) * 100
          : activeWcJobs.length > 0 ? (activeWcJobs.length / (activeWcJobs.length + 2)) * 100
            : 0
      ));

      // Queue depth in hours (estimated)
      const queueHrs = +(pendingOps.length * 1.5 + activeWcJobs.length * 0.8).toFixed(1);

      let status = 'normal';
      if (utilization >= 90) status = 'bottleneck';
      else if (utilization < 40 && utilization > 0) status = 'under';
      else if (utilization >= 80) status = 'filling';

      return {
        id: wc.code,
        name: wc.name,
        type: wc.type,
        utilization,
        queue: queueHrs,
        hotJobs: hotCount,
        status,
        activeJobs: activeWcJobs.length,
        capabilities: wc.capabilities,
      };
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. EXCEPTION FEED — real events from data
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const exceptions = [];

    // QC holds as exceptions
    qcHolds.forEach(hold => {
      exceptions.push({
        id: `qc-${hold.id}`,
        time: formatTimeSince(hold.createdAt),
        type: 'QC_HOLD',
        icon: '🟡',
        title: `${hold.coil?.coilNumber || 'Coil'} - ${hold.holdType}`,
        eta: hold.holdReason || 'Under review',
        severity: 'warning',
      });
    });

    // Overdue jobs as exceptions
    allJobs.filter(j => {
      const h = hoursFromNow(j.scheduledEnd);
      return h !== null && h <= 0 && !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(j.status);
    }).forEach(j => {
      exceptions.push({
        id: `overdue-${j.id}`,
        time: formatTimeSince(j.scheduledEnd),
        type: 'OVERDUE',
        icon: '🔴',
        title: `${j.jobNumber} overdue - ${j.order?.buyer?.name || 'Unknown'}`,
        eta: `${Math.abs(hoursFromNow(j.scheduledEnd))}h late`,
        severity: 'error',
      });
    });

    // Held coils as exceptions
    heldCoilRows.forEach(c => {
      exceptions.push({
        id: `hold-${c.id}`,
        time: formatTimeSince(c.updatedAt),
        type: 'MATERIAL_HOLD',
        icon: '⚠️',
        title: `${c.coilNumber} on hold - ${c.grade?.code || ''}`,
        eta: 'Review needed',
        severity: 'warning',
      });
    });

    // Sort by recency
    exceptions.sort((a, b) => {
      const timeA = parseTimeSince(a.time);
      const timeB = parseTimeSince(b.time);
      return timeA - timeB;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. DAY COMPLETION FORECAST
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const todayDueJobs = activeJobs.filter(j => {
      const due = j.scheduledEnd || j.dueDate;
      return due && new Date(due) <= endOfDay;
    });
    const totalDueToday = todayDueJobs.length || activeJobs.length;
    const completedToday = allJobs.filter(j =>
      ['SHIPPED', 'COMPLETED'].includes(j.status) &&
      j.actualEnd && new Date(j.actualEnd) >= startOfDay
    ).length;

    // Calculate probability based on current progress + risk factors
    const riskFactors = [];
    const bottleneckWcs = wcUtilization.filter(wc => wc.status === 'bottleneck');
    if (bottleneckWcs.length > 0) {
      riskFactors.push(`${bottleneckWcs.map(w => w.id).join(', ')} at bottleneck capacity`);
    }
    if (hotJobs.length > 0) {
      riskFactors.push(`${hotJobs.length} job(s) with tight deadlines`);
    }
    if (qcHolds.length > 0) {
      riskFactors.push(`${qcHolds.length} QC hold(s) blocking progress`);
    }
    const heldCoils = coilCount('HOLD');
    if (heldCoils > 0) {
      riskFactors.push(`${heldCoils} coil(s) on hold`);
    }

    const riskPenalty = (hotJobs.length * 5) + (bottleneckWcs.length * 8) + (qcHolds.length * 3) + (heldCoils * 2);
    const baseProbability = totalDueToday > 0
      ? Math.min(95, Math.round(((totalDueToday - hotJobs.length) / totalDueToday) * 100))
      : 85;
    const probability = Math.max(20, baseProbability - riskPenalty);

    const forecast = {
      probability,
      totalJobs: totalDueToday,
      completedToday,
      scenarios: {
        best: { jobs: totalDueToday, percent: 100, label: riskFactors.length === 0 ? 'Likely' : 'Unlikely' },
        expected: {
          jobs: Math.round(totalDueToday * probability / 100),
          percent: probability,
          label: 'Most Likely',
        },
        worst: {
          jobs: Math.max(0, Math.round(totalDueToday * (probability - 20) / 100)),
          percent: Math.max(0, probability - 20),
          label: riskFactors.length > 2 ? 'Possible' : 'Unlikely',
        },
      },
      risks: riskFactors.length > 0 ? riskFactors : ['No significant risk factors detected'],
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. AI RECOMMENDATIONS — generated from real data patterns
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const recommendations = [];
    let recPriority = 1;

    // Recommend alleviating bottlenecks
    bottleneckWcs.forEach(bwc => {
      const underUtilized = wcUtilization.filter(wc =>
        wc.type === bwc.type && wc.status === 'under' && wc.id !== bwc.id
      );
      if (underUtilized.length > 0) {
        recommendations.push({
          id: recPriority,
          priority: recPriority++,
          title: `Rebalance ${bwc.id} bottleneck`,
          action: `Move jobs to ${underUtilized.map(u => u.id).join(', ')} (same type, lower utilization)`,
          why: `${bwc.id} (${bwc.name}) at ${bwc.utilization}% with ${bwc.queue}hr queue. ${underUtilized[0].id} at ${underUtilized[0].utilization}% with capacity.`,
          impact: `Reduce queue by ~${Math.round(bwc.queue * 0.4)}hrs, improve flow`,
          confidence: 85,
        });
      }
    });

    // Recommend expediting hot jobs
    hotJobs.slice(0, 2).forEach(hj => {
      recommendations.push({
        id: recPriority,
        priority: recPriority++,
        title: `Expedite ${hj.id} (${hj.customer})`,
        action: `Prioritize in queue, assign dedicated operator`,
        why: `Due in ${hj.due}. Status: ${hj.status}. Risk: ${hj.risk}`,
        impact: `+1 job meets promise window`,
        confidence: 90,
      });
    });

    // Material optimization
    const allocatedCoils = { length: coilCount('ALLOCATED') };
    if (allocatedCoils.length > 0) {
      recommendations.push({
        id: recPriority,
        priority: recPriority++,
        title: 'Review allocated material',
        action: `${allocatedCoils.length} coil(s) allocated — verify assignment and release if orders changed`,
        why: 'Allocated material may be blocking availability for new incoming orders.',
        impact: 'Free up inventory, reduce lead time on new quotes',
        confidence: 75,
      });
    }

    // If no recommendations from data, provide operational insights
    if (recommendations.length === 0) {
      recommendations.push({
        id: 1,
        priority: 1,
        title: 'Operations running smoothly',
        action: 'No immediate interventions needed. Consider reviewing upcoming schedule.',
        why: `All ${activeJobs.length} active jobs on track. No bottlenecks detected.`,
        impact: 'Continue monitoring for early risk detection',
        confidence: 95,
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. STAGING & SHIPPING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // A shipment that has left is IN_TRANSIT or DELIVERED (there is no SHIPPED shipment status).
    const SHIPPED_STATUSES = ['IN_TRANSIT', 'DELIVERED'];
    const readyToShipJobs = allJobs.filter(j => j.status === 'READY_TO_SHIP');
    const packagingJobs = allJobs.filter(j => ['PACKAGING', 'WAITING_QC'].includes(j.status));

    const todayShipments = { length: shipmentCount(todayShipmentGroups) };
    const shippedToday = { length: shipmentCount(todayShipmentGroups, SHIPPED_STATUSES) };
    const pendingShipments = { length: shipmentCount(shipmentGroups, ['PENDING', 'LOADING']) };

    // Group by carrier
    const carrierGroups = {};
    shipmentGroups.forEach(g => {
      const carrier = g.carrierName || 'Unassigned';
      if (!carrierGroups[carrier]) carrierGroups[carrier] = { total: 0, shipped: 0 };
      carrierGroups[carrier].total += g._count._all;
      if (SHIPPED_STATUSES.includes(g.status)) carrierGroups[carrier].shipped += g._count._all;
    });

    const staging = {
      readyToShip: readyToShipJobs.length,
      packaging: packagingJobs.length,
      pendingShipments: pendingShipments.length,
      total: readyToShipJobs.length + packagingJobs.length,
    };

    const dispatched = {
      total: shippedToday.length,
      byCarrier: carrierGroups,
      pendingPickup: pendingShipments.length,
    };

    const shippingData = {
      staging,
      dispatched,
      noCarrierCount: noCarrierOrders,
      totalShipmentsToday: todayShipments.length,
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. MATERIAL AVAILABILITY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Group coils by grade + form for availability analysis
    const materialGroups = {};
    coilGroups.forEach(g => {
      const key = `${gradeCode.get(g.gradeId) || 'UNK'}-${g.form}-${g.thicknessIn}"`;
      if (!materialGroups[key]) {
        materialGroups[key] = { available: 0, held: 0, allocated: 0, total: 0, totalWeight: 0 };
      }
      const n = g._count._all;
      materialGroups[key].total += n;
      materialGroups[key].totalWeight += parseFloat(g._sum.netWeightLb || 0);
      if (g.status === 'AVAILABLE') materialGroups[key].available += n;
      else if (g.status === 'HOLD') materialGroups[key].held += n;
      else if (g.status === 'ALLOCATED') materialGroups[key].allocated += n;
    });

    // Stockouts: materials with allocated or needed but none available
    const stockouts = Object.entries(materialGroups)
      .filter(([_, g]) => g.available === 0 && (g.allocated > 0 || g.held > 0))
      .map(([material, g]) => ({
        material,
        need: g.allocated + g.held,
        have: g.available,
        eta: g.held > 0 ? 'QC review pending' : 'Awaiting resupply',
      }));

    // Low stock: materials with low available count
    const lowStock = Object.entries(materialGroups)
      .filter(([_, g]) => g.available > 0 && g.available <= 2 && g.total > 1)
      .map(([material, g]) => ({
        material,
        stock: Math.round((g.available / Math.max(1, g.total)) * 100),
        status: g.allocated > 0 ? 'Partially allocated' : 'Low stock',
      }));

    // Inventory summary
    const totalWeightLb = coilGroups.reduce((sum, g) => sum + parseFloat(g._sum.netWeightLb || 0), 0);
    const availableCount = coilCount('AVAILABLE');

    const materialData = {
      stockouts,
      lowStock,
      inbound: recentMovements
        .filter(m => m.movementType === 'RECEIVE')
        .slice(0, 5)
        .map(m => ({
          id: m.id,
          source: 'Receiving',
          desc: `${m.coil?.grade?.code || ''} ${m.coil?.form || ''} ${m.qtyMoved} units`,
          eta: formatTimeSince(m.createdAt),
        })),
      summary: {
        totalCoils: coilCount(),
        available: availableCount,
        allocated: coilCount('ALLOCATED'),
        held: coilCount('HOLD'),
        totalWeightLb: Math.round(totalWeightLb),
      },
    };

    // ━━━━━━━━━━━━━━━━━━━━━━ RESPONSE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    res.json({
      timestamp: now.toISOString(),
      flowState,
      flowChanges,
      promiseRisk: {
        hotJobs,
        atRiskJobs,
        safeCount,
      },
      workCenterUtilization: wcUtilization,
      exceptions,
      forecast,
      recommendations,
      shipping: shippingData,
      material: materialData,
      summary: {
        totalJobs,
        activeJobs: activeJobs.length,
        totalOrders,
        totalCoils: coilCount(),
        totalWorkCenters: workCenters.length,
        totalShipments: shipmentCount(shipmentGroups),
      },
    });
  } catch (error) {
    console.error('Ops Cockpit error:', error);
    res.status(500).json({ error: 'Failed to fetch ops cockpit data', details: error.message });
  }
});

// ── Helper functions ────────────────────────────────────────────────

function getRiskReason(job, hrsLeft) {
  if (hrsLeft !== null && hrsLeft <= 0) return 'Overdue';
  if (job.status === 'ORDERED') return 'Not yet scheduled';
  if (job.status === 'SCHEDULED') return 'Waiting to start';
  if (['WAITING_QC'].includes(job.status)) return 'QC review pending';
  if (hrsLeft !== null && hrsLeft <= 3) return 'Tight timeline';
  return 'Monitor';
}

function formatTimeSince(date) {
  if (!date) return 'Unknown';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 0) return 'Upcoming';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function parseTimeSince(str) {
  if (!str) return Infinity;
  const match = str.match(/^(\d+)(m|h|d)/);
  if (!match) return 0;
  const val = parseInt(match[1]);
  if (match[2] === 'm') return val;
  if (match[2] === 'h') return val * 60;
  if (match[2] === 'd') return val * 1440;
  return 0;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECOMMENDATION ACTION ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── POST /api/ops-cockpit/recommendations/accept ────────────────────
router.post('/recommendations/accept', async (req, res) => {
  try {
    const { recommendation, modifications } = req.body;
    if (!recommendation) {
      return res.status(400).json({ error: 'Recommendation payload required' });
    }

    const actionToExecute = modifications?.action || recommendation.action;
    const results = [];

    // ── Execute real actions based on recommendation type ────────
    if (recommendation.title?.includes('bottleneck') || recommendation.title?.includes('Rebalance')) {
      // Rebalance: find jobs on bottlenecked work center, reassign to under-utilized
      const wcCodeMatch = recommendation.title.match(/(?:Rebalance\s+)(\S+)/);
      if (wcCodeMatch) {
        const bottleneckCode = wcCodeMatch[1];
        const targetCodes = recommendation.action.match(/Move jobs to (.+?) \(/)?.[1]?.split(', ') || [];

        if (targetCodes.length > 0) {
          // Find the target work center
          const targetWc = await prisma.workCenter.findFirst({ where: { code: targetCodes[0] } });
          const bottleneckWc = await prisma.workCenter.findFirst({ where: { code: bottleneckCode } });

          if (targetWc && bottleneckWc) {
            // Reassign up to 2 jobs from bottleneck to target
            const jobsToMove = await prisma.job.findMany({
              where: { workCenterId: bottleneckWc.id, status: { in: ['ORDERED', 'SCHEDULED'] } },
              take: 2,
              orderBy: { priority: 'desc' },
            });

            for (const job of jobsToMove) {
              await prisma.job.update({
                where: { id: job.id },
                data: { workCenterId: targetWc.id },
              });
              results.push({
                action: 'reassigned',
                jobNumber: job.jobNumber,
                from: bottleneckCode,
                to: targetCodes[0],
              });
            }
          }
        }
      }
    } else if (recommendation.title?.includes('Expedite')) {
      // Expedite: bump priority of the specific job
      const jobMatch = recommendation.title.match(/(JOB-\d+)/);
      if (jobMatch) {
        const job = await prisma.job.findFirst({ where: { jobNumber: jobMatch[1] } });
        if (job) {
          await prisma.job.update({
            where: { id: job.id },
            data: { priority: Math.max(1, (job.priority || 3) - 1) },
          });
          results.push({
            action: 'expedited',
            jobNumber: job.jobNumber,
            newPriority: Math.max(1, (job.priority || 3) - 1),
          });
        }
      }
    } else if (recommendation.title?.includes('allocated material') || recommendation.title?.includes('Review allocated')) {
      // Review allocated: gather allocation details for the operator
      const allocatedCoils = await prisma.coil.findMany({
        where: { status: 'ALLOCATED' },
        include: { grade: true, location: true },
      });
      results.push({
        action: 'review_flagged',
        coilCount: allocatedCoils.length,
        coils: allocatedCoils.map(c => ({
          coilNumber: c.coilNumber,
          grade: c.grade?.code,
          location: c.location?.name,
          weight: c.netWeightLb,
        })),
      });
    }

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        category: 'WORKFLOW',
        eventType: 'AI_RECOMMENDATION_ACCEPTED',
        severity: 'INFO',
        resourceType: 'RECOMMENDATION',
        resourceId: String(recommendation.id),
        action: 'ACCEPT',
        details: {
          recommendation,
          modifications: modifications || null,
          executedAction: actionToExecute,
          results,
          timestamp: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      message: `Recommendation "${recommendation.title}" accepted and executed`,
      results,
      executedAction: actionToExecute,
    });
  } catch (error) {
    console.error('Accept recommendation error:', error);
    res.status(500).json({ error: 'Failed to accept recommendation', details: error.message });
  }
});

// ── POST /api/ops-cockpit/recommendations/dismiss ───────────────────
router.post('/recommendations/dismiss', async (req, res) => {
  try {
    const { recommendation, reason } = req.body;
    if (!recommendation) {
      return res.status(400).json({ error: 'Recommendation payload required' });
    }


    // Log dismissal
    await prisma.auditLog.create({
      data: {
        category: 'WORKFLOW',
        eventType: 'AI_RECOMMENDATION_DISMISSED',
        severity: 'INFO',
        resourceType: 'RECOMMENDATION',
        resourceId: String(recommendation.id),
        action: 'DISMISS',
        details: {
          recommendation,
          dismissReason: reason || 'User dismissed without reason',
          timestamp: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      message: `Recommendation "${recommendation.title}" dismissed`,
    });
  } catch (error) {
    console.error('Dismiss recommendation error:', error);
    res.status(500).json({ error: 'Failed to dismiss recommendation', details: error.message });
  }
});

// ── POST /api/ops-cockpit/recommendations/explain ───────────────────
router.post('/recommendations/explain', async (req, res) => {
  try {
    const { recommendation } = req.body;
    if (!recommendation) {
      return res.status(400).json({ error: 'Recommendation payload required' });
    }

    // Gather additional context for the AI explanation
    const [
      jobCount,
      wcCount,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.job.count({ where: { status: { notIn: ['SHIPPED', 'COMPLETED', 'CANCELLED'] } } }),
      prisma.workCenter.count(),
      prisma.auditLog.findMany({
        where: {
          category: 'WORKFLOW',
          eventType: { startsWith: 'AI_RECOMMENDATION' },
        },
        orderBy: { timestamp: 'desc' },
        take: 5,
      }),
    ]);

    const systemPrompt = `You are an operations intelligence assistant for a steel service center (SteelWise). 
You provide deep explanations of AI-generated operational recommendations. 
Be specific, quantitative, and reference real operational concepts (throughput, cycle time, WIP, queue depth, OTD%).
Keep responses under 300 words. Use bullet points for clarity.`;

    const userPrompt = `Provide a detailed explanation for this AI recommendation:

**Recommendation:** ${recommendation.title}
**Suggested Action:** ${recommendation.action}
**Initial Rationale:** ${recommendation.why}
**Expected Impact:** ${recommendation.impact}
**Confidence:** ${recommendation.confidence}%

**Current Context:**
- Active jobs in system: ${jobCount}
- Work centers available: ${wcCount}
- Recent AI actions taken: ${recentAuditLogs.length}

Please explain:
1. **Root Cause** — What operational condition triggered this recommendation
2. **Mechanics** — How exactly the suggested action would fix the problem
3. **Risk Assessment** — What could go wrong if action is taken vs. not taken
4. **Expected Timeline** — When the impact would be visible
5. **Alternative Approaches** — Other options the operator could consider`;

    let explanation;
    try {
      const aiResponse = await aiService.getChatCompletion({
        provider: 'auto',
        task: 'analysis',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        config: { temperature: 0.4, maxTokens: 800 },
      });
      explanation = aiResponse.content;
    } catch (aiError) {
      console.warn('AI explain fallback - no AI provider:', aiError.message);
      // Fallback: generate a structured explanation from the data we have
      explanation = generateFallbackExplanation(recommendation, jobCount, wcCount);
    }

    // Log the explain action
    await prisma.auditLog.create({
      data: {
        category: 'WORKFLOW',
        eventType: 'AI_RECOMMENDATION_EXPLAINED',
        severity: 'INFO',
        resourceType: 'RECOMMENDATION',
        resourceId: String(recommendation.id),
        action: 'EXPLAIN',
        details: {
          recommendation: recommendation.title,
          timestamp: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      explanation,
      recommendation: recommendation.title,
    });
  } catch (error) {
    console.error('Explain recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate explanation', details: error.message });
  }
});

// ── GET /api/ops-cockpit/recommendations/history ────────────────────
router.get('/recommendations/history', async (req, res) => {
  try {
    const history = await prisma.auditLog.findMany({
      where: {
        category: 'WORKFLOW',
        eventType: { startsWith: 'AI_RECOMMENDATION' },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    res.json({
      history: history.map(h => ({
        id: h.id,
        eventType: h.eventType,
        resourceId: h.resourceId,
        action: h.action,
        details: h.details,
        timestamp: h.timestamp,
      })),
      totalActions: history.length,
    });
  } catch (error) {
    console.error('Recommendation history error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendation history' });
  }
});

// ── Helper: fallback explanation when no AI provider available ───────
function generateFallbackExplanation(rec, jobCount, wcCount) {
  return `## Detailed Analysis: ${rec.title}

**Root Cause:**
This recommendation was triggered by analyzing real-time operational data across ${jobCount} active jobs and ${wcCount} work centers. ${rec.why}

**How It Works:**
${rec.action}. This action directly addresses the identified bottleneck or risk by redistributing workload or adjusting priorities to optimize throughput.

**Risk Assessment:**
- **If accepted:** ${rec.impact}. Confidence level: ${rec.confidence}%.
- **If ignored:** The current condition may worsen, potentially affecting on-time delivery (OTD) metrics and increasing WIP.

**Expected Timeline:**
Impact should be visible within 1-2 hours of execution as queue depths adjust and jobs flow through the updated routing.

**Alternatives:**
- Manual review and selective job reassignment
- Temporary overtime authorization for the constrained resource
- Customer communication to renegotiate delivery windows for lower-priority jobs`;
}

export default router;
