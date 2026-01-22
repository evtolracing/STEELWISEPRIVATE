import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { rfqs, contacts } from './orderHubRoutes.js';

const router = Router();

// ============================================================================
// ALRO-SPECIFIC VOCABULARY & CONSTANTS
// ============================================================================

// Metal grades by category
const ALUMINUM_GRADES = ['6061', '6061-T6', '5052', '3003', '7075', '2024', '6063'];
const STEEL_GRADES = ['A36', 'A572', 'A514', 'A588', '1018', '1020', '1045', '4140', '4340', '8620', 'AR400', 'AR500', 'A500'];
const STAINLESS_GRADES = ['304', '304L', '316', '316L', '410', '430', '201', '17-4', '17-4PH'];
const ALL_METAL_GRADES = [...ALUMINUM_GRADES, ...STEEL_GRADES, ...STAINLESS_GRADES];

// Plastics materials
const PLASTICS_MATERIALS = [
  'ACRYLIC', 'PLEXI', 'PLEXIGLASS', 'PMMA',
  'POLYCARBONATE', 'LEXAN', 'PC',
  'UHMW', 'UHMWPE',
  'HDPE', 'LDPE', 'PE',
  'ACETAL', 'DELRIN', 'POM',
  'PVC', 'CPVC',
  'ABS',
  'NYLON', 'PA', 'PA6', 'PA66',
  'PEI', 'ULTEM',
  'PTFE', 'TEFLON',
  'PEEK',
  'POLYPROPYLENE', 'PP'
];

// Form synonyms mapping
const FORM_SYNONYMS = {
  'PLATE': ['plate', 'plates', 'plt'],
  'SHEET': ['sheet', 'sheets', 'sht', 'shts'],
  'BAR': ['bar', 'bars'],
  'FLAT BAR': ['flat bar', 'flat', 'fb', 'flatbar'],
  'ROUND BAR': ['round bar', 'round', 'rd', 'rnd', 'rd bar'],
  'SQUARE BAR': ['square bar', 'sq bar', 'square', 'sq'],
  'PIPE': ['pipe', 'pipes'],
  'TUBE': ['tube', 'tubing', 'tubes', 'rect tube', 'rectangular tube', 'sq tube', 'square tube'],
  'ANGLE': ['angle', 'angle iron', 'L'],
  'CHANNEL': ['channel', 'channels', 'C', 'MC'],
  'BEAM': ['beam', 'beams', 'I-beam', 'W-beam', 'S-beam', 'I', 'W', 'S'],
  'ROD': ['rod', 'rods'],
  'COIL': ['coil', 'coils'],
  'PERFORATED': ['perforated', 'perf', 'perforated sheet']
};

// Gauge to thickness conversion (steel)
const GAUGE_TO_THICKNESS = {
  7: 0.1793, 8: 0.1644, 9: 0.1495, 10: 0.1345,
  11: 0.1196, 12: 0.1046, 13: 0.0897, 14: 0.0747,
  15: 0.0673, 16: 0.0598, 17: 0.0538, 18: 0.0478,
  19: 0.0418, 20: 0.0359, 21: 0.0329, 22: 0.0299,
  23: 0.0269, 24: 0.0239, 25: 0.0209, 26: 0.0179
};

// Fraction to decimal conversion
const FRACTIONS = {
  '1/16': 0.0625, '1/8': 0.125, '3/16': 0.1875, '1/4': 0.25,
  '5/16': 0.3125, '3/8': 0.375, '7/16': 0.4375, '1/2': 0.5,
  '9/16': 0.5625, '5/8': 0.625, '11/16': 0.6875, '3/4': 0.75,
  '13/16': 0.8125, '7/8': 0.875, '15/16': 0.9375, '1': 1.0,
  '1-1/4': 1.25, '1-1/2': 1.5, '1-3/4': 1.75, '2': 2.0
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseFraction(str) {
  if (!str) return null;
  str = str.trim().replace(/\s+/g, '');
  
  // Direct lookup
  if (FRACTIONS[str]) return FRACTIONS[str];
  
  // Parse fraction like "1/4" or "3/8"
  const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
  }
  
  // Parse mixed number like "1-1/4" or "1 1/4"
  const mixedMatch = str.match(/^(\d+)[-\s](\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }
  
  // Parse decimal
  const decimal = parseFloat(str);
  if (!isNaN(decimal)) return decimal;
  
  return null;
}

function gaugeToThickness(gauge, material = 'steel') {
  const g = parseInt(gauge);
  if (GAUGE_TO_THICKNESS[g]) {
    return GAUGE_TO_THICKNESS[g];
  }
  return null;
}

function detectCommodity(text) {
  const upperText = text.toUpperCase();
  
  // Check for plastics first (more specific)
  for (const plastic of PLASTICS_MATERIALS) {
    if (upperText.includes(plastic)) {
      return { commodity: 'PLASTICS', material: plastic };
    }
  }
  
  // Check for metal indicators
  if (/ALUMINUM|ALUMINIUM|ALUM\b/i.test(text)) {
    return { commodity: 'METALS', material: 'ALUMINUM' };
  }
  if (/STAINLESS|SS\b|304|316/i.test(text)) {
    return { commodity: 'METALS', material: 'STAINLESS' };
  }
  if (/STEEL|CARBON|A36|A572|1018|4140|HR\b|CR\b|P&O|GALV/i.test(text)) {
    return { commodity: 'METALS', material: 'STEEL' };
  }
  
  // Check all metal grades
  for (const grade of ALL_METAL_GRADES) {
    if (upperText.includes(grade.toUpperCase())) {
      return { commodity: 'METALS', material: grade };
    }
  }
  
  return { commodity: null, material: null };
}

function detectForm(text) {
  const lowerText = text.toLowerCase();
  
  for (const [form, synonyms] of Object.entries(FORM_SYNONYMS)) {
    for (const syn of synonyms) {
      // Use word boundary matching
      const regex = new RegExp(`\\b${syn.replace(/\s+/g, '\\s*')}\\b`, 'i');
      if (regex.test(lowerText)) {
        return form;
      }
    }
  }
  return null;
}

function detectGrade(text) {
  const upperText = text.toUpperCase();
  
  // Aluminum grades
  for (const grade of ALUMINUM_GRADES) {
    if (upperText.includes(grade.toUpperCase())) {
      return grade.toUpperCase();
    }
  }
  
  // Steel grades
  for (const grade of STEEL_GRADES) {
    if (upperText.includes(grade.toUpperCase())) {
      return grade.toUpperCase();
    }
  }
  
  // Stainless grades
  for (const grade of STAINLESS_GRADES) {
    const regex = new RegExp(`\\b${grade}\\b`, 'i');
    if (regex.test(text)) {
      return grade.toUpperCase();
    }
  }
  
  // Plastics - return the material as grade
  for (const plastic of PLASTICS_MATERIALS) {
    if (upperText.includes(plastic)) {
      return plastic;
    }
  }
  
  return null;
}

function extractContact(fullText, emailFrom) {
  const warnings = [];
  const assumptions = [];
  
  let contactName = null;
  let contactEmail = null;
  let companyName = null;
  let phone = null;
  
  // Extract email
  const emailPatterns = [
    /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g
  ];
  for (const pattern of emailPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      contactEmail = match[0].toLowerCase();
      break;
    }
  }
  if (!contactEmail && emailFrom) {
    contactEmail = emailFrom.toLowerCase();
    assumptions.push(`Used emailFrom field for contact email: ${contactEmail}`);
  }
  
  // Extract company from email domain
  if (contactEmail && !companyName) {
    const domain = contactEmail.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'].includes(domain)) {
      const domainParts = domain.split('.')[0];
      companyName = domainParts.charAt(0).toUpperCase() + domainParts.slice(1);
      assumptions.push(`Inferred company name from email domain: ${companyName}`);
    }
  }
  
  // Look for company indicators in text
  const companyPatterns = [
    /(?:from|at|@)\s+([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Co|Ltd|Industries|Manufacturing|Steel|Metals|Fab|Fabrication|Machine|Machining)?\.?)/i,
    /([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Co\.|Ltd|Industries|Manufacturing|Steel|Metals|Fab|Fabrication)\.?)/
  ];
  for (const pattern of companyPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1].length > 3 && match[1].length < 50) {
      companyName = match[1].trim().replace(/[,.]$/, '');
      break;
    }
  }
  
  // Look for name in signature patterns
  const namePatterns = [
    /(?:thanks|regards|sincerely|best|cheers)[,\s]*\n+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:^|\n)([A-Z][a-z]+\s+[A-Z][a-z]+)\s*\n/m,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*[\n|$]/
  ];
  for (const pattern of namePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1] && match[1].length > 3 && match[1].length < 40) {
      contactName = match[1].trim();
      break;
    }
  }
  
  // Extract phone
  const phonePattern = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
  const phoneMatch = fullText.match(phonePattern);
  if (phoneMatch) {
    phone = `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}`;
  }
  
  return { contactName, contactEmail, companyName, phone, warnings, assumptions };
}

function extractDueDate(text) {
  const assumptions = [];
  let dueDate = null;
  
  // Common date patterns
  const duePhrases = [
    /(?:need(?:ed)?|required?|deliver(?:y)?|due|ship)\s*(?:by|date|on)?\s*[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s*(?:delivery|due|ship)/i,
    /(?:need(?:ed)?|required?|deliver(?:y)?|due)\s*(?:by|date|on)?\s*[:\s]*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}?)/i
  ];
  
  for (const pattern of duePhrases) {
    const match = text.match(pattern);
    if (match) {
      try {
        const parsed = new Date(match[1]);
        if (!isNaN(parsed.getTime())) {
          dueDate = parsed.toISOString().split('T')[0];
          break;
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }
  
  // Check for ASAP
  if (!dueDate && /\bASAP\b|urgent|rush/i.test(text)) {
    assumptions.push('ASAP/urgent request detected - no specific date');
  }
  
  return { dueDate, assumptions };
}

function parseLineItems(fullText) {
  const lines = [];
  const warnings = [];
  const assumptions = [];
  let lineIdCounter = 1;
  
  // Split by common line delimiters
  const textLines = fullText.split(/[\n\r]+/).filter(l => l.trim());
  
  // Patterns for extracting line items
  const patterns = [
    // "10 pcs 1/4" x 48" x 96" A36 plate"
    /(\d+)\s*(?:pcs?|pieces?|ea|each|sheets?|plates?)?\s*[-–]?\s*(\d+(?:\/\d+)?|\d+(?:\.\d+)?)["\s]*(?:x|×)\s*(\d+(?:\.\d+)?)["\s]*(?:x|×)\s*(\d+(?:\.\d+)?)["\s]*/gi,
    // "qty: 5 - 0.25 x 24 x 48"
    /(?:qty|quantity)[:\s]*(\d+)\s*[-–]?\s*(\d+(?:\/\d+)?|\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/gi,
    // "1/4 x 48 x 96 (10)"
    /(\d+(?:\/\d+)?|\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*\(?(\d+)\)?/gi
  ];
  
  // Process each line
  for (const textLine of textLines) {
    const trimmedLine = textLine.trim();
    if (trimmedLine.length < 5) continue;
    
    // Skip common non-item lines
    if (/^(hi|hello|dear|thanks|regards|sincerely|best|please|can you|we need|i need|quote|rfq|request)/i.test(trimmedLine)) {
      continue;
    }
    
    // Try to detect if this is a material line
    const { commodity } = detectCommodity(trimmedLine);
    const form = detectForm(trimmedLine);
    const grade = detectGrade(trimmedLine);
    
    // Only process if it looks like a material specification
    if (commodity || form || grade || /\d+\s*[x×]\s*\d+/.test(trimmedLine)) {
      let quantity = 1;
      let thickness = null;
      let width = null;
      let length = null;
      
      // Extract quantity
      const qtyMatch = trimmedLine.match(/(\d+)\s*(?:pcs?|pieces?|ea|each|sheets?|plates?|qty|quantity)/i) ||
                       trimmedLine.match(/(?:qty|quantity)[:\s]*(\d+)/i) ||
                       trimmedLine.match(/^\s*(\d+)\s+/);
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1]) || 1;
      }
      
      // Extract dimensions - try multiple patterns
      // Pattern: thickness x width x length
      const dimPattern3 = trimmedLine.match(/(\d+(?:\/\d+)?|\d+(?:\.\d+)?)\s*["']?\s*[x×]\s*(\d+(?:\.\d+)?)\s*["']?\s*[x×]\s*(\d+(?:\.\d+)?)\s*["']?/i);
      // Pattern: just dimensions
      const dimPattern2 = trimmedLine.match(/(\d+(?:\.\d+)?)\s*["']?\s*[x×]\s*(\d+(?:\.\d+)?)\s*["']?/i);
      // Pattern: gauge
      const gaugeMatch = trimmedLine.match(/(\d+)\s*(?:ga|gauge|g)\b/i);
      // Pattern: thickness only
      const thickMatch = trimmedLine.match(/(\d+(?:\/\d+)?|\d+(?:\.\d+)?)\s*["']\s*(?:thk|thick|thickness)?/i);
      
      if (dimPattern3) {
        thickness = parseFraction(dimPattern3[1]);
        width = parseFloat(dimPattern3[2]);
        length = parseFloat(dimPattern3[3]);
      } else if (dimPattern2) {
        width = parseFloat(dimPattern2[1]);
        length = parseFloat(dimPattern2[2]);
      }
      
      if (gaugeMatch && !thickness) {
        thickness = gaugeToThickness(gaugeMatch[1]);
        if (thickness) {
          assumptions.push(`Converted ${gaugeMatch[1]}ga to ${thickness}" thickness`);
        } else {
          warnings.push(`Could not convert gauge ${gaugeMatch[1]} to thickness`);
        }
      }
      
      if (thickMatch && !thickness) {
        thickness = parseFraction(thickMatch[1]);
      }
      
      // Create line item if we have meaningful data
      if (quantity || thickness || width || length || grade || form || commodity) {
        lines.push({
          id: `line-${lineIdCounter++}`,
          materialCode: null,
          commodity: commodity || null,
          form: form || null,
          grade: grade || null,
          thickness,
          width,
          length,
          quantity: quantity || 1,
          notes: trimmedLine.length < 100 ? trimmedLine : null
        });
      }
    }
  }
  
  // If no lines found, try a more aggressive scan
  if (lines.length === 0) {
    const globalCommodity = detectCommodity(fullText);
    const globalForm = detectForm(fullText);
    const globalGrade = detectGrade(fullText);
    
    // Look for any dimension pattern in full text
    const allDims = fullText.match(/(\d+(?:\/\d+)?|\d+(?:\.\d+)?)\s*["']?\s*[x×]\s*(\d+(?:\.\d+)?)\s*["']?\s*[x×]\s*(\d+(?:\.\d+)?)/gi);
    const allQty = fullText.match(/(\d+)\s*(?:pcs?|pieces?|ea|each|sheets?|plates?)/gi);
    
    if (allDims || globalGrade || globalForm) {
      let quantity = 1;
      let thickness = null;
      let width = null;
      let length = null;
      
      if (allQty && allQty[0]) {
        const qm = allQty[0].match(/(\d+)/);
        if (qm) quantity = parseInt(qm[1]);
      }
      
      if (allDims && allDims[0]) {
        const dm = allDims[0].match(/(\d+(?:\/\d+)?|\d+(?:\.\d+)?)\s*["']?\s*[x×]\s*(\d+(?:\.\d+)?)\s*["']?\s*[x×]\s*(\d+(?:\.\d+)?)/i);
        if (dm) {
          thickness = parseFraction(dm[1]);
          width = parseFloat(dm[2]);
          length = parseFloat(dm[3]);
        }
      }
      
      lines.push({
        id: `line-${lineIdCounter++}`,
        materialCode: null,
        commodity: globalCommodity.commodity,
        form: globalForm,
        grade: globalGrade,
        thickness,
        width,
        length,
        quantity,
        notes: null
      });
      
      assumptions.push('Extracted single line item from full email text');
    }
  }
  
  if (lines.length === 0) {
    warnings.push('Could not auto-extract line items. Manual review required.');
  }
  
  return { lines, warnings, assumptions };
}

// ============================================================================
// AI RFQ PARSER ENDPOINT
// ============================================================================
router.post('/parse-email-rfq', (req, res) => {
  try {
    const { emailSubject, emailBody, attachmentsText, emailFrom } = req.body;

    // Combine all text sources
    const fullText = [
      emailSubject || '',
      emailBody || '',
      ...(attachmentsText || [])
    ].join('\n\n');
    
    if (!fullText.trim()) {
      return res.status(400).json({ error: 'No email content provided' });
    }

    // Initialize tracking
    let warnings = [];
    let assumptions = [];
    let confidence = 0.5;

    // Extract contact information
    const contactResult = extractContact(fullText, emailFrom);
    warnings = [...warnings, ...contactResult.warnings];
    assumptions = [...assumptions, ...contactResult.assumptions];
    
    if (contactResult.contactEmail) confidence += 0.1;
    if (contactResult.contactName) confidence += 0.05;
    if (contactResult.companyName) confidence += 0.05;

    // Extract due date
    const dueDateResult = extractDueDate(fullText);
    assumptions = [...assumptions, ...dueDateResult.assumptions];

    // Parse line items
    const lineResult = parseLineItems(fullText);
    warnings = [...warnings, ...lineResult.warnings];
    assumptions = [...assumptions, ...lineResult.assumptions];
    
    if (lineResult.lines.length > 0) {
      confidence += 0.15;
      // Add confidence for complete lines
      for (const line of lineResult.lines) {
        if (line.thickness && line.width && line.length) confidence += 0.05;
        if (line.grade) confidence += 0.03;
        if (line.commodity) confidence += 0.02;
      }
    }

    // Cap confidence
    confidence = Math.min(confidence, 0.95);

    // Build response
    const parsedRfq = {
      contact: {
        companyName: contactResult.companyName || null,
        contactName: contactResult.contactName || null,
        email: contactResult.contactEmail || null,
        phone: contactResult.phone || null
      },
      channel: 'EMAIL',
      sourceRef: emailFrom || null,
      requestedDueDate: dueDateResult.dueDate || null,
      lines: lineResult.lines
    };

    res.json({
      ...parsedRfq,
      parseMeta: {
        confidence: Math.round(confidence * 100) / 100,
        warnings,
        assumptions
      }
    });
  } catch (error) {
    console.error('RFQ Parse Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AI QUOTE ASSISTANT - Suggest pricing for RFQ/Quote
// ============================================================================
router.post('/quote-assistant', (req, res) => {
  try {
    const { rfqId, quoteDraft } = req.body;

    let lines = [];
    let suggestions = [];
    let recommendedUnitPrices = [];

    // Get lines from RFQ if provided
    if (rfqId) {
      const rfq = rfqs.find(r => r.id === rfqId);
      if (rfq) {
        lines = rfq.lines;
      }
    }

    // Or use quote draft lines
    if (quoteDraft?.lines) {
      lines = quoteDraft.lines;
    }

    // Generate pricing suggestions based on simulated data
    const basePrices = {
      'METALS': {
        'PLATE': 2.50,
        'SHEET': 2.25,
        'BAR': 3.00,
        'TUBE': 4.50,
        'PIPE': 4.00,
        'ANGLE': 2.75,
        'CHANNEL': 3.25
      },
      'PLASTICS': {
        'SHEET': 8.00,
        'PLATE': 9.50,
        'BAR': 12.00,
        'TUBE': 15.00
      }
    };

    const gradeMultipliers = {
      'A36': 1.0,
      'A572': 1.15,
      '304': 3.5,
      '316': 4.2,
      '6061': 2.8,
      '4140': 1.8,
      'AR400': 2.2,
      'AR500': 2.5,
      'HDPE': 1.0,
      'UHMW': 1.5,
      'DELRIN': 3.0
    };

    for (const line of lines) {
      const commodity = line.commodity || 'METALS';
      const form = line.form || 'PLATE';
      const grade = (line.grade || 'A36').toUpperCase();
      const thickness = line.thickness || 0.25;
      const width = line.width || 48;
      const length = line.length || 96;
      const quantity = line.quantity || 1;

      // Calculate base price per lb
      const basePrice = basePrices[commodity]?.[form] || 2.50;
      const gradeMultiplier = gradeMultipliers[grade] || 1.0;
      const thicknessMultiplier = thickness < 0.1 ? 1.3 : thickness > 1 ? 0.9 : 1.0;

      // Estimate weight (lbs) for steel plate
      const sqFt = (width * length) / 144;
      const weightPerSqFt = thickness * 40.8; // steel density approx
      const estimatedWeight = sqFt * weightPerSqFt;

      const unitPrice = Math.round(basePrice * gradeMultiplier * thicknessMultiplier * estimatedWeight * 100) / 100;

      recommendedUnitPrices.push({
        rfqLineId: line.id || null,
        recommendedPrice: unitPrice,
        estimatedWeight: Math.round(estimatedWeight),
        reason: `Base rate $${basePrice}/lb × ${gradeMultiplier}x grade × ${estimatedWeight.toFixed(0)}lbs`
      });

      // Add suggestions
      if (quantity >= 10) {
        suggestions.push({
          lineId: line.id,
          message: `Volume discount opportunity: ${quantity} pcs qualifies for 5% discount`
        });
      }
      if (grade.includes('304') || grade.includes('316')) {
        suggestions.push({
          lineId: line.id,
          message: `Stainless steel prices volatile - consider 48hr quote validity`
        });
      }
    }

    // General suggestions
    if (lines.length > 5) {
      suggestions.push({
        lineId: null,
        message: 'Multi-line order: consider bundled pricing for freight efficiency'
      });
    }

    suggestions.push({
      lineId: null,
      message: 'Current lead time for plate processing: 3-5 business days'
    });

    res.json({
      suggestions,
      recommendedUnitPrices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
