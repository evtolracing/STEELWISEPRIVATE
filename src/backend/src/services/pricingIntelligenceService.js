/**
 * Pricing Intelligence Service
 * 
 * Core pricing engine for RFQ-to-Cash optimization.
 * Provides real-time pricing recommendations with margin protection,
 * capacity-aware promise dates, and substitution suggestions.
 */

import prisma from '../lib/db.js';

// Default margin targets by customer tier
const TIER_MARGINS = {
  A: { floor: 15, target: 22 },
  B: { floor: 18, target: 25 },
  C: { floor: 22, target: 30 },
  D: { floor: 28, target: 35 },
};

// Material cost multipliers (simplified - would connect to real-time feeds)
const MATERIAL_COST_BASE = {
  'STEEL': 0.45, // per lb
  'ALUMINUM': 1.25,
  'STAINLESS': 2.50,
  'BRASS': 3.00,
  'COPPER': 4.00,
  'PLASTIC': 0.80,
};

// Processing cost per operation type
const PROCESSING_COSTS = {
  'CUT_TO_LENGTH': 0.02,
  'SLITTING': 0.03,
  'BLANKING': 0.05,
  'SHEARING': 0.02,
  'SAW_CUTTING': 0.04,
  'FLAME_CUT': 0.08,
  'PLASMA_CUT': 0.06,
  'LASER_CUT': 0.10,
  'WATERJET': 0.12,
  'DRILLING': 0.03,
  'GRINDING': 0.04,
  'HEAT_TREAT': 0.08,
};

/**
 * Get customer pricing tier with margin settings
 */
export async function getCustomerPricingTier(customerId) {
  try {
    const tier = await prisma.customerPricingTier.findUnique({
      where: { customerId },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (tier) {
      return {
        tierCode: tier.tierCode,
        marginFloor: parseFloat(tier.marginFloor),
        marginTarget: parseFloat(tier.marginTarget),
        discountMaxPct: tier.discountMaxPct ? parseFloat(tier.discountMaxPct) : null,
        paymentTerms: tier.paymentTerms,
        freightTerms: tier.freightTerms,
        creditLimit: tier.creditLimit ? parseFloat(tier.creditLimit) : null,
      };
    }

    // Default to tier C if not configured
    return {
      tierCode: 'C',
      ...TIER_MARGINS.C,
      discountMaxPct: 5,
      paymentTerms: 'Net 30',
      freightTerms: 'FOB Origin',
      creditLimit: null,
    };
  } catch (error) {
    console.error('Error fetching customer pricing tier:', error);
    return { tierCode: 'C', ...TIER_MARGINS.C };
  }
}

/**
 * Calculate material cost based on grade and form
 */
export function calculateMaterialCost(materialType, grade, weightLbs) {
  const baseCost = MATERIAL_COST_BASE[materialType?.toUpperCase()] || 0.50;
  
  // Grade adjustments (simplified)
  let gradeMultiplier = 1.0;
  if (grade?.includes('4140') || grade?.includes('4340')) gradeMultiplier = 1.15;
  if (grade?.includes('A36')) gradeMultiplier = 0.95;
  if (grade?.includes('304') || grade?.includes('316')) gradeMultiplier = 1.0; // Already in stainless base
  
  return baseCost * gradeMultiplier * weightLbs;
}

/**
 * Calculate processing cost for value-add operations
 */
export function calculateProcessingCost(operations, weightLbs) {
  if (!operations || !Array.isArray(operations)) return 0;
  
  return operations.reduce((total, op) => {
    const costPerLb = PROCESSING_COSTS[op.type?.toUpperCase()] || 0.03;
    return total + (costPerLb * weightLbs);
  }, 0);
}

/**
 * Estimate freight cost based on weight and distance
 */
export function estimateFreightCost(weightLbs, destinationZip, originLocationId) {
  // Simplified freight estimation - would integrate with carrier APIs
  const baseRate = 0.08; // per lb
  const minimumCharge = 75;
  
  // Zone adjustments (simplified)
  let zoneMultiplier = 1.0;
  if (destinationZip?.startsWith('9')) zoneMultiplier = 1.3; // West coast
  if (destinationZip?.startsWith('0') || destinationZip?.startsWith('1')) zoneMultiplier = 1.2; // Northeast
  
  const calculatedFreight = baseRate * weightLbs * zoneMultiplier;
  return Math.max(calculatedFreight, minimumCharge);
}

/**
 * Calculate yield loss cost (scrap allowance)
 */
export function calculateYieldLossCost(materialCost, form, operations) {
  // Default yield loss percentages
  let yieldLossPct = 0.02; // 2% base
  
  if (operations?.some(op => ['FLAME_CUT', 'PLASMA_CUT', 'LASER_CUT'].includes(op.type))) {
    yieldLossPct = 0.05; // 5% for cutting operations
  }
  
  if (form === 'COIL' || form === 'SHEET') {
    yieldLossPct = 0.03;
  }
  
  return materialCost * yieldLossPct;
}

/**
 * Main pricing recommendation engine
 */
export async function generatePricingRecommendation({
  customerId,
  productCode,
  grade,
  form,
  materialType,
  dimensions, // { thickness, width, length }
  quantity,
  unit = 'LB',
  operations = [],
  destinationZip,
  originLocationId,
  requestedDeliveryDate,
}) {
  try {
    // Get customer tier
    const tier = await getCustomerPricingTier(customerId);
    
    // Calculate weight (simplified - would use product specs)
    const weightLbs = unit === 'LB' ? quantity : quantity * 100; // Assume 100 lbs per piece if not LB
    
    // Calculate cost components
    const materialCost = calculateMaterialCost(materialType || 'STEEL', grade, weightLbs);
    const processingCost = calculateProcessingCost(operations, weightLbs);
    const freightCost = estimateFreightCost(weightLbs, destinationZip, originLocationId);
    const yieldLossCost = calculateYieldLossCost(materialCost, form, operations);
    const packagingCost = weightLbs * 0.01; // $0.01/lb
    const overheadCost = (materialCost + processingCost) * 0.08; // 8% overhead
    
    const totalCost = materialCost + processingCost + freightCost + yieldLossCost + packagingCost + overheadCost;
    
    // Calculate prices at different margin levels
    const targetMarginPct = tier.marginTarget;
    const floorMarginPct = tier.marginFloor;
    
    const recommendedPrice = totalCost / (1 - targetMarginPct / 100);
    const minimumPrice = totalCost / (1 - floorMarginPct / 100);
    const listPrice = recommendedPrice * 1.15; // List is 15% above recommended
    
    // Calculate actual margin
    const marginPct = ((recommendedPrice - totalCost) / recommendedPrice) * 100;
    
    // Confidence score based on data quality
    let confidenceScore = 85; // Base confidence
    if (!customerId) confidenceScore -= 15;
    if (!grade) confidenceScore -= 10;
    if (!destinationZip) confidenceScore -= 5;
    
    // Generate alternatives
    const alternatives = [
      {
        type: 'LOWER_PRICE',
        price: minimumPrice,
        marginPct: floorMarginPct,
        description: `Floor price at ${floorMarginPct}% margin`,
        leadTimeDays: null,
      },
      {
        type: 'EXPEDITE',
        price: recommendedPrice * 1.15,
        marginPct: marginPct + 5,
        description: 'Expedited processing (+15%)',
        leadTimeDays: 2,
      },
    ];
    
    // Check for substitution options (simplified)
    if (grade?.includes('4140')) {
      alternatives.push({
        type: 'SUBSTITUTE',
        grade: '4142',
        price: recommendedPrice * 0.95,
        description: 'Equivalent grade 4142 at 5% less',
        leadTimeDays: null,
      });
    }
    
    // Calculate lead time
    const leadTimeDays = await calculateLeadTime({
      quantity: weightLbs,
      operations,
      originLocationId,
      requestedDeliveryDate,
    });
    
    // Create recommendation record
    const recommendation = await prisma.pricingRecommendation.create({
      data: {
        productCode,
        grade,
        form,
        dimensions,
        quantity,
        unit,
        materialCost,
        processingCost,
        laborCost: processingCost * 0.3, // Labor is ~30% of processing
        freightCost,
        yieldLossCost,
        packagingCost,
        overheadCost,
        totalCost,
        recommendedPrice,
        minimumPrice,
        listPrice,
        marginPct,
        confidenceScore,
        customerId,
        customerTier: tier.tierCode,
        locationId: originLocationId,
        inventorySource: 'STOCK', // Would check actual inventory
        leadTimeDays,
        alternatives,
        pricingModel: 'V1',
        modelInputs: {
          customerId,
          productCode,
          grade,
          form,
          materialType,
          dimensions,
          quantity,
          unit,
          operations,
          destinationZip,
          originLocationId,
        },
      },
    });
    
    return {
      recommendationId: recommendation.id,
      
      // Pricing
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      minimumPrice: Math.round(minimumPrice * 100) / 100,
      listPrice: Math.round(listPrice * 100) / 100,
      pricePerUnit: Math.round((recommendedPrice / weightLbs) * 100) / 100,
      
      // Margin
      marginPct: Math.round(marginPct * 10) / 10,
      marginTarget: targetMarginPct,
      marginFloor: floorMarginPct,
      marginCategory: marginPct >= targetMarginPct ? 'GREEN' : marginPct >= floorMarginPct ? 'YELLOW' : 'RED',
      
      // Cost breakdown
      costBreakdown: {
        material: Math.round(materialCost * 100) / 100,
        processing: Math.round(processingCost * 100) / 100,
        freight: Math.round(freightCost * 100) / 100,
        yieldLoss: Math.round(yieldLossCost * 100) / 100,
        packaging: Math.round(packagingCost * 100) / 100,
        overhead: Math.round(overheadCost * 100) / 100,
        total: Math.round(totalCost * 100) / 100,
      },
      
      // Delivery
      leadTimeDays,
      promiseDate: calculatePromiseDate(leadTimeDays),
      
      // Confidence
      confidenceScore,
      
      // Customer
      customerTier: tier.tierCode,
      paymentTerms: tier.paymentTerms,
      
      // Alternatives
      alternatives,
    };
  } catch (error) {
    console.error('Error generating pricing recommendation:', error);
    throw error;
  }
}

/**
 * Calculate lead time based on capacity and operations
 */
async function calculateLeadTime({ quantity, operations, originLocationId, requestedDeliveryDate }) {
  // Base lead time
  let leadTimeDays = 2; // Stock items
  
  // Add processing time
  if (operations?.length > 0) {
    leadTimeDays += operations.length; // 1 day per operation (simplified)
  }
  
  // Add transit time (simplified)
  leadTimeDays += 2; // Average transit
  
  // TODO: Check actual work center capacity
  // TODO: Check maintenance windows
  // TODO: Check inventory availability
  
  return leadTimeDays;
}

/**
 * Calculate promise date from lead time
 */
function calculatePromiseDate(leadTimeDays) {
  const date = new Date();
  date.setDate(date.getDate() + leadTimeDays);
  
  // Skip weekends
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Check if price override requires approval
 */
export function checkOverrideApproval(overridePrice, recommendedPrice, minimumPrice, customerTier) {
  const overrideMargin = ((overridePrice - minimumPrice) / overridePrice) * 100;
  const tierMargins = TIER_MARGINS[customerTier] || TIER_MARGINS.C;
  
  // Determine approval level needed
  if (overrideMargin < tierMargins.floor - 10) {
    return {
      requiresApproval: true,
      approvalLevel: 'VP_SALES',
      reason: 'More than 10% below margin floor',
    };
  } else if (overrideMargin < tierMargins.floor - 5) {
    return {
      requiresApproval: true,
      approvalLevel: 'BRANCH_MANAGER',
      reason: '5-10% below margin floor',
    };
  } else if (overrideMargin < tierMargins.floor) {
    return {
      requiresApproval: true,
      approvalLevel: 'SALES_MANAGER',
      reason: 'Below margin floor',
    };
  }
  
  return { requiresApproval: false };
}

/**
 * Record a pricing override
 */
export async function recordPricingOverride({
  quoteId,
  quoteLineId,
  originalPrice,
  overridePrice,
  originalMargin,
  overrideMargin,
  reason,
  justification,
  requestedById,
}) {
  try {
    const override = await prisma.pricingOverride.create({
      data: {
        quoteId,
        quoteLineId,
        originalPrice,
        overridePrice,
        originalMargin,
        overrideMargin,
        reason,
        justification,
        requestedById,
        approvalStatus: 'PENDING',
      },
    });
    
    return override;
  } catch (error) {
    console.error('Error recording pricing override:', error);
    throw error;
  }
}

/**
 * Get pricing analytics for a period
 */
export async function getPricingAnalytics({ period, customerId, locationId }) {
  try {
    const where = { period };
    if (customerId) where.customerId = customerId;
    if (locationId) where.locationId = locationId;
    
    const analytics = await prisma.pricingAnalytics.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    return analytics || {
      quotesCreated: 0,
      quotesWon: 0,
      quotesLost: 0,
      winRate: 0,
      avgMarginQuoted: 0,
      avgMarginWon: 0,
      avgResponseHours: 0,
      avgCycleTimeDays: 0,
      totalValueQuoted: 0,
      totalValueWon: 0,
    };
  } catch (error) {
    console.error('Error fetching pricing analytics:', error);
    throw error;
  }
}

/**
 * Suggest product substitutions
 */
export async function suggestSubstitutions({ productCode, grade, form, quantity }) {
  // Simplified substitution logic - would query product equivalencies
  const substitutions = [];
  
  // Grade equivalencies
  const gradeEquivalents = {
    '4140': ['4142', '4145'],
    '4340': ['4340H', '4330V'],
    '1018': ['1020', 'A36'],
    '304': ['304L', '321'],
    '316': ['316L', '317'],
  };
  
  const baseGrade = Object.keys(gradeEquivalents).find(g => grade?.includes(g));
  if (baseGrade && gradeEquivalents[baseGrade]) {
    for (const equiv of gradeEquivalents[baseGrade]) {
      substitutions.push({
        type: 'EQUIVALENT_GRADE',
        originalGrade: grade,
        substituteGrade: equiv,
        priceDiffPct: Math.random() * 10 - 5, // -5% to +5%
        availableQty: Math.floor(Math.random() * 10000),
        leadTimeDays: Math.floor(Math.random() * 5) + 1,
      });
    }
  }
  
  return substitutions;
}

export default {
  getCustomerPricingTier,
  generatePricingRecommendation,
  checkOverrideApproval,
  recordPricingOverride,
  getPricingAnalytics,
  suggestSubstitutions,
};
