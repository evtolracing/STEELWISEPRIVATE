/**
 * Template Service
 * Manages label templates for drop tag printing
 */

import prisma from '../lib/db.js';

// Available placeholders for templates
export const PLACEHOLDERS = {
  // Drop Tag Identity
  dropTagId: '{{dropTagId}}',
  
  // Customer Info
  customerName: '{{customerName}}',
  customerPO: '{{customerPO}}',
  customerPartNo: '{{customerPartNo}}',
  
  // Order Info
  orderId: '{{orderId}}',
  orderLineNo: '{{orderLineNo}}',
  
  // Material Identity
  grade: '{{grade}}',
  form: '{{form}}',
  specification: '{{specification}}',
  condition: '{{condition}}',
  dimensions: '{{dimensions}}',
  length: '{{length}}',
  
  // Quantity
  pieces: '{{pieces}}',
  weight: '{{weight}}',
  uom: '{{uom}}',
  
  // Traceability
  heatNumber: '{{heatNumber}}',
  lotId: '{{lotId}}',
  mtrRef: '{{mtrRef}}',
  cocRef: '{{cocRef}}',
  
  // Shipping
  stopNumber: '{{stopNumber}}',
  shipToName: '{{shipToName}}',
  shipToCity: '{{shipToCity}}',
  requiredDate: '{{requiredDate}}',
  
  // Audit
  printedBy: '{{printedBy}}',
  printedAt: '{{printedAt}}',
  reprintCount: '{{reprintCount}}',
};

// Get all templates
export async function getTemplates({ templateType, customerId, active = true } = {}) {
  const where = {};
  
  if (templateType) where.templateType = templateType;
  if (customerId) where.customerId = customerId;
  if (active !== undefined) where.isActive = active;

  return prisma.labelTemplate.findMany({
    where,
    orderBy: [
      { isDefault: 'desc' },
      { name: 'asc' },
    ],
  });
}

// Get template by ID
export async function getTemplateById(id) {
  return prisma.labelTemplate.findUnique({
    where: { id },
  });
}

// Get template by code
export async function getTemplateByCode(code) {
  return prisma.labelTemplate.findUnique({
    where: { code },
  });
}

// Get default template for type
export async function getDefaultTemplate(templateType) {
  return prisma.labelTemplate.findFirst({
    where: {
      templateType,
      isDefault: true,
      isActive: true,
    },
  });
}

// Create template
export async function createTemplate(data) {
  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await prisma.labelTemplate.updateMany({
      where: { templateType: data.templateType, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.labelTemplate.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      templateType: data.templateType,
      mediaType: data.mediaType,
      widthInches: data.widthInches,
      heightInches: data.heightInches,
      templateContent: data.templateContent,
      barcodeType: data.barcodeType || 'QR',
      barcodePosition: data.barcodePosition || { x: 0, y: 0, width: 80, height: 80 },
      customerId: data.customerId,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
    },
  });
}

// Update template
export async function updateTemplate(id, data) {
  // If setting as default, unset other defaults
  if (data.isDefault) {
    const existing = await prisma.labelTemplate.findUnique({ where: { id } });
    if (existing) {
      await prisma.labelTemplate.updateMany({
        where: { templateType: existing.templateType, isDefault: true },
        data: { isDefault: false },
      });
    }
  }

  return prisma.labelTemplate.update({
    where: { id },
    data,
  });
}

// Delete template
export async function deleteTemplate(id) {
  return prisma.labelTemplate.delete({
    where: { id },
  });
}

// Render template with data
export async function renderTemplate(templateId, dropTag) {
  const template = await prisma.labelTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Get associated data
  const fullTag = await prisma.dropTag.findUnique({
    where: { id: dropTag.id || dropTag },
    include: {
      customer: true,
      order: true,
      orderLine: true,
    },
  });

  if (!fullTag) {
    throw new Error('Drop tag not found');
  }

  // Build data context
  const context = buildContext(fullTag);

  // Replace placeholders
  let content = template.templateContent;
  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value || '');
  }

  // Handle conditional blocks
  content = processConditionals(content, context);

  return {
    content,
    template,
    context,
  };
}

// Build context object from drop tag
function buildContext(dropTag) {
  const formatDimensions = (dims) => {
    if (!dims) return '';
    const parts = [];
    if (dims.od) parts.push(`${dims.od}" OD`);
    if (dims.id) parts.push(`${dims.id}" ID`);
    if (dims.width) parts.push(`${dims.width}" W`);
    if (dims.thickness) parts.push(`${dims.thickness}" THK`);
    if (dims.length) parts.push(`${dims.length}" L`);
    return parts.join(' x ');
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
  };

  return {
    // Drop Tag Identity
    dropTagId: dropTag.dropTagId,
    
    // Customer Info
    customerName: dropTag.customer?.name || '',
    customerPO: dropTag.customerPO || '',
    customerPartNo: dropTag.customerPartNo || '',
    
    // Order Info
    orderId: dropTag.order?.orderNumber || '',
    orderLineNo: dropTag.orderLine?.lineNumber?.toString() || '',
    
    // Material Identity
    grade: dropTag.grade || '',
    form: dropTag.form || '',
    specification: dropTag.specification || '',
    condition: dropTag.condition || '',
    dimensions: formatDimensions(dropTag.dimensions),
    length: dropTag.lengthFeet ? `${dropTag.lengthFeet} FT` : '',
    
    // Quantity
    pieces: dropTag.pieces?.toString() || '',
    weight: dropTag.weightLbs?.toString() || '',
    uom: dropTag.uom || 'EA',
    
    // Traceability
    heatNumber: dropTag.heatNumber || '',
    lotId: dropTag.lotId || '',
    mtrRef: dropTag.mtrDocId || '',
    cocRef: dropTag.cocDocId || '',
    
    // Shipping
    stopNumber: dropTag.routeStop?.toString() || '',
    shipToName: dropTag.shipToAddress?.name || '',
    shipToCity: dropTag.shipToAddress?.city || '',
    requiredDate: formatDate(dropTag.requiredDate),
    
    // Audit
    printedBy: dropTag.printedBy || '',
    printedAt: formatDate(dropTag.printedAt),
    reprintCount: dropTag.reprintCount?.toString() || '0',
    
    // Barcode content
    barcodeContent: dropTag.dropTagId,
  };
}

// Process conditional blocks in template
function processConditionals(content, context) {
  // Handle {{#if field}}...{{/if}} blocks
  const ifPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  
  content = content.replace(ifPattern, (match, field, inner) => {
    const value = context[field];
    if (value && value !== '0' && value !== '') {
      return inner;
    }
    return '';
  });

  // Handle {{#if field > 0}}...{{/if}} blocks
  const compPattern = /\{\{#if\s+(\w+)\s*>\s*(\d+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  
  content = content.replace(compPattern, (match, field, num, inner) => {
    const value = parseInt(context[field] || '0', 10);
    if (value > parseInt(num, 10)) {
      return inner;
    }
    return '';
  });

  return content;
}

// Generate preview with sample data
export async function generatePreview(templateId, sampleData = {}) {
  const template = await prisma.labelTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Default sample data
  const defaultSample = {
    dropTagId: 'DT-2026-001234',
    customerName: 'Acme Manufacturing',
    customerPO: 'ACME-PO-2026-1234',
    customerPartNo: 'ACME-4140-RB-2.5',
    orderId: 'SO-000001',
    orderLineNo: '1',
    grade: '4140',
    form: 'ROUND_BAR',
    specification: 'ASTM A108',
    condition: 'Q&T',
    dimensions: '2.5" OD x 12\' L',
    length: '12 FT',
    pieces: '5',
    weight: '1250.50',
    uom: 'EA',
    heatNumber: 'A12345',
    lotId: 'LOT-2026-001',
    mtrRef: 'MTR-001',
    cocRef: 'COC-001',
    stopNumber: '1',
    shipToName: 'Acme Manufacturing',
    shipToCity: 'Cleveland, OH',
    requiredDate: '02/07/26',
    printedBy: 'John Smith',
    printedAt: '02/05/26',
    reprintCount: '0',
    barcodeContent: 'DT-2026-001234',
  };

  const context = { ...defaultSample, ...sampleData };

  // Replace placeholders
  let content = template.templateContent;
  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value || '');
  }

  content = processConditionals(content, context);

  return {
    content,
    template,
    context,
  };
}

// Seed default templates
export async function seedDefaultTemplates() {
  const templates = [
    {
      name: 'Standard Bundle Tag',
      code: 'BUNDLE_TAG_STANDARD',
      description: '4x6 bundle tag for standard steel bundles',
      templateType: 'BUNDLE_TAG',
      mediaType: 'PAPER',
      widthInches: 4.0,
      heightInches: 6.0,
      templateContent: `<div class="bundle-tag" style="width: 4in; height: 6in; border: 1px solid #000; padding: 8px; font-family: Arial, sans-serif;">
  <div class="header" style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
    <div style="font-size: 18px; font-weight: bold;">STEELWISE</div>
    <div style="font-size: 14px;">BUNDLE TAG</div>
  </div>
  
  <div class="row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
    <div>
      <div style="font-size: 12px; font-weight: bold;">TAG#: {{dropTagId}}</div>
      <div style="font-size: 11px;">CUSTOMER: {{customerName}}</div>
      <div style="font-size: 11px;">PO: {{customerPO}}</div>
    </div>
    <div style="width: 80px; height: 80px; border: 1px solid #000; display: flex; align-items: center; justify-content: center;">
      [QR CODE]
    </div>
  </div>
  
  <div style="font-size: 11px; margin-bottom: 4px;">ORDER: {{orderId}} / LINE {{orderLineNo}}</div>
  
  <div style="border-top: 1px solid #000; padding-top: 8px; margin-top: 8px;">
    <div style="font-size: 12px; font-weight: bold;">MATERIAL: {{grade}} {{form}}</div>
    <div style="font-size: 11px;">SPEC: {{specification}}</div>
    <div style="font-size: 11px;">CONDITION: {{condition}}</div>
    <div style="font-size: 11px;">SIZE: {{dimensions}}</div>
    <div style="font-size: 11px;">LENGTH: {{length}}</div>
  </div>
  
  <div style="border-top: 1px solid #000; padding-top: 8px; margin-top: 8px;">
    <div style="display: flex; justify-content: space-between;">
      <div style="font-size: 11px;">HEAT: {{heatNumber}}</div>
      <div style="font-size: 11px;">QTY: {{pieces}} PCS</div>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <div style="font-size: 11px;">LOT: {{lotId}}</div>
      <div style="font-size: 11px;">WT: {{weight}} LBS</div>
    </div>
    <div style="font-size: 11px;">MTR: {{mtrRef}}</div>
    <div style="font-size: 11px;">COC: {{cocRef}}</div>
  </div>
  
  <div style="border-top: 1px solid #000; padding-top: 8px; margin-top: 8px;">
    <div style="font-size: 11px;">SHIP TO: {{shipToName}}</div>
    <div style="font-size: 11px;">{{shipToCity}}</div>
    <div style="display: flex; justify-content: space-between;">
      <div style="font-size: 11px;">STOP: {{stopNumber}}</div>
      <div style="font-size: 11px;">DATE: {{requiredDate}}</div>
    </div>
  </div>
  
  <div style="border-top: 1px solid #000; padding-top: 4px; margin-top: 8px; font-size: 10px; display: flex; justify-content: space-between;">
    <div>{{printedAt}} {{printedBy}}</div>
    {{#if reprintCount > 0}}<div style="color: red;">REPRINT #{{reprintCount}}</div>{{/if}}
  </div>
</div>`,
      barcodeType: 'QR',
      barcodePosition: { x: 280, y: 20, width: 80, height: 80 },
      isActive: true,
      isDefault: true,
    },
    {
      name: 'Small Piece Tag',
      code: 'PIECE_TAG_SMALL',
      description: '2x3 piece tag for individual pieces',
      templateType: 'PIECE_TAG',
      mediaType: 'PLASTIC',
      widthInches: 2.0,
      heightInches: 3.0,
      templateContent: `<div class="piece-tag" style="width: 2in; height: 3in; border: 1px solid #000; padding: 4px; font-family: Arial, sans-serif; font-size: 9px;">
  <div style="text-align: center; font-weight: bold; font-size: 10px;">PIECE TAG</div>
  
  <div style="display: flex; justify-content: space-between; margin-top: 4px;">
    <div style="font-weight: bold;">{{dropTagId}}</div>
    <div style="width: 50px; height: 50px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 8px;">[QR]</div>
  </div>
  
  <div style="margin-top: 4px;">
    <div style="font-weight: bold;">{{grade}}</div>
    <div>{{form}}</div>
    <div>{{dimensions}}</div>
    <div>{{length}}</div>
  </div>
  
  <div style="border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
    <div>HT: {{heatNumber}}</div>
    <div style="display: flex; justify-content: space-between;">
      <span>PC: {{pieces}}</span>
      <span>WT: {{weight}}</span>
    </div>
    <div>PO: {{customerPO}}</div>
    <div>STOP: {{stopNumber}}</div>
  </div>
  
  {{#if reprintCount > 0}}<div style="color: red; font-size: 8px; text-align: center;">REPRINT #{{reprintCount}}</div>{{/if}}
</div>`,
      barcodeType: 'QR',
      barcodePosition: { x: 100, y: 30, width: 50, height: 50 },
      isActive: true,
      isDefault: false,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.labelTemplate.findUnique({
      where: { code: template.code },
    });

    if (!existing) {
      await prisma.labelTemplate.create({ data: template });
      console.log(`Created template: ${template.code}`);
    }
  }
}

export default {
  PLACEHOLDERS,
  getTemplates,
  getTemplateById,
  getTemplateByCode,
  getDefaultTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  renderTemplate,
  generatePreview,
  seedDefaultTemplates,
};
