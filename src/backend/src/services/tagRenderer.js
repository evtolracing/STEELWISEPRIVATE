/**
 * Tag Renderer Service
 * Generates print-ready HTML for each tag/doc type.
 * Output is a self-contained HTML page styled for Zebra/label printers (4x6") or letter.
 */

const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; background: white; color: #000; }
  .tag { width: 4in; padding: 0.15in; border: 2px solid #000; }
  .tag-full { width: 100%; max-width: 8.5in; padding: 0.25in; }
  .header { background: #1a1a1a; color: white; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; }
  .header-title { font-size: 14pt; font-weight: bold; letter-spacing: 1px; }
  .header-sub { font-size: 9pt; opacity: 0.85; }
  .row { display: flex; border-bottom: 1px solid #ccc; }
  .cell { flex: 1; padding: 4px 8px; }
  .cell-label { font-size: 7pt; text-transform: uppercase; color: #555; font-weight: bold; }
  .cell-value { font-size: 11pt; font-weight: bold; }
  .cell-value-sm { font-size: 9pt; }
  .sep { border-top: 2px solid #000; margin: 4px 0; }
  .barcode-zone { text-align: center; padding: 8px; background: #f5f5f5; border-top: 1px solid #ccc; }
  .barcode-text { font-family: 'Courier New', monospace; font-size: 8pt; margin-top: 4px; word-break: break-all; }
  .badge { display: inline-block; background: #1a1a1a; color: white; padding: 2px 6px; font-size: 8pt; border-radius: 2px; }
  .badge-red { background: #c0392b; }
  .badge-blue { background: #2980b9; }
  .badge-green { background: #27ae60; }
  .reprint-banner { background: #f39c12; color: white; text-align: center; font-size: 9pt; font-weight: bold; padding: 3px; }
  .footer { font-size: 7pt; color: #777; display: flex; justify-content: space-between; padding: 4px 8px; border-top: 1px dashed #ccc; }
  .bol-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 8px 0; }
  .bol-table th { background: #eee; border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
  .bol-table td { border: 1px solid #ccc; padding: 4px 8px; }
  @media print {
    @page { margin: 0; }
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
`;

function wrapHTML(title, body) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body onload="window.print()">
${body}
</body>
</html>`;
}

// ── DTL Tag (Work Order Detail) ───────────────────────────────────────────────
function renderDTLTag(p) {
  const priorityBadge = ['HOT', 'RUSH', 'URGENT', '5'].includes(String(p.priority))
    ? '<span class="badge badge-red">🔥 HOT</span>'
    : Number(p.priority) >= 4
    ? '<span class="badge badge-blue">HIGH</span>'
    : '';

  return wrapHTML(`DTL Tag – ${p.jobNumber}`, `
<div class="tag">
  <div class="header">
    <div>
      <div class="header-title">WORK ORDER — DTL TAG</div>
      <div class="header-sub">SteelWise Service Center</div>
    </div>
    <div style="font-size:18pt;font-weight:bold;">${p.jobNumber}</div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Customer</div>
      <div class="cell-value">${p.customerName}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Order #</div>
      <div class="cell-value">${p.orderNumber}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Operation</div>
      <div class="cell-value-sm">${p.operationType}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Work Center</div>
      <div class="cell-value-sm">${p.workCenter}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Grade</div>
      <div class="cell-value-sm">${p.grade}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Coil #</div>
      <div class="cell-value-sm">${p.coilNumber}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Thickness</div>
      <div class="cell-value-sm">${p.thickness || '—'}"</div>
    </div>
    <div class="cell">
      <div class="cell-label">Width</div>
      <div class="cell-value-sm">${p.width || '—'}"</div>
    </div>
    <div class="cell">
      <div class="cell-label">Qty</div>
      <div class="cell-value-sm">${p.quantity} ${p.unit}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Sched Start</div>
      <div class="cell-value-sm">${p.scheduledStart}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Due Date</div>
      <div class="cell-value-sm" style="font-weight:bold;">${p.scheduledEnd}</div>
    </div>
  </div>

  ${p.instructions ? `
  <div class="row">
    <div class="cell">
      <div class="cell-label">Instructions</div>
      <div class="cell-value-sm">${p.instructions}</div>
    </div>
  </div>` : ''}

  ${priorityBadge ? `<div style="padding:4px 8px;">${priorityBadge}</div>` : ''}

  <div class="barcode-zone">
    <div style="font-size:36pt;font-family:'Courier New',monospace;letter-spacing:4px;font-weight:bold;">
      ||| ${p.jobNumber} |||
    </div>
    <div class="barcode-text">${p.barcodeValue}</div>
  </div>

  <div class="footer">
    <span>Printed: ${new Date(p.printedAt).toLocaleString()}</span>
    <span>SteelWise ERP</span>
  </div>
</div>`);
}

// ── Bundle Tag ────────────────────────────────────────────────────────────────
function renderBundleTag(p) {
  return wrapHTML(`Bundle Tag – ${p.jobNumber}`, `
<div class="tag">
  <div class="header">
    <div>
      <div class="header-title">BUNDLE TAG</div>
      <div class="header-sub">SteelWise Service Center</div>
    </div>
    <div style="font-size:18pt;font-weight:bold;">${p.jobNumber}</div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Customer</div>
      <div class="cell-value">${p.customerName}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Order #</div>
      <div class="cell-value">${p.orderNumber}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Grade</div>
      <div class="cell-value-sm">${p.grade}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Heat #</div>
      <div class="cell-value-sm">${p.heatNumber}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Thk</div>
      <div class="cell-value-sm">${p.thickness || '—'}"</div>
    </div>
    <div class="cell">
      <div class="cell-label">Width</div>
      <div class="cell-value-sm">${p.width || '—'}"</div>
    </div>
    <div class="cell">
      <div class="cell-label">Length</div>
      <div class="cell-value-sm">${p.length || '—'}'</div>
    </div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Weight</div>
      <div class="cell-value" style="font-size:14pt;">${p.weight ? `${Number(p.weight).toLocaleString()} LBS` : '—'}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Pieces</div>
      <div class="cell-value" style="font-size:14pt;">${p.pieces} ${p.unit}</div>
    </div>
  </div>

  <div class="sep"></div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Ship To</div>
      <div class="cell-value-sm" style="font-weight:bold;">${p.shipToName}</div>
      <div class="cell-value-sm">${p.shipToAddress || p.shipToCity}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Required Date</div>
      <div class="cell-value-sm" style="font-weight:bold;">${p.requiredDate}</div>
    </div>
  </div>

  ${p.instructions ? `
  <div class="row">
    <div class="cell">
      <div class="cell-label">Special Instructions</div>
      <div class="cell-value-sm">${p.instructions}</div>
    </div>
  </div>` : ''}

  <div class="barcode-zone">
    <div style="font-size:32pt;font-family:'Courier New',monospace;letter-spacing:4px;font-weight:bold;">
      ||| ${p.jobNumber} |||
    </div>
    <div class="barcode-text">${p.barcodeValue}</div>
  </div>

  <div class="footer">
    <span>Printed: ${new Date(p.printedAt).toLocaleString()}</span>
    <span>SteelWise ERP</span>
  </div>
</div>`);
}

// ── Shipping Label ────────────────────────────────────────────────────────────
function renderShippingLabel(p) {
  return wrapHTML(`Shipping Label – ${p.jobNumber}`, `
<div class="tag">
  <div class="header">
    <div>
      <div class="header-title">SHIPPING LABEL</div>
      <div class="header-sub">${p.shipFromName}</div>
    </div>
    <span class="badge badge-blue" style="font-size:10pt;padding:4px 8px;">JOB ${p.jobNumber}</span>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">FROM</div>
      <div class="cell-value-sm" style="font-weight:bold;">${p.shipFromName}</div>
      <div class="cell-value-sm">${p.shipFromAddress}</div>
    </div>
  </div>

  <div class="sep"></div>

  <div class="row">
    <div class="cell">
      <div class="cell-label" style="font-size:9pt;">SHIP TO</div>
      <div class="cell-value" style="font-size:16pt;font-weight:bold;">${p.shipToName}</div>
      <div class="cell-value-sm">${p.shipToAddress}</div>
      <div class="cell-value-sm">${p.shipToCity}</div>
    </div>
  </div>

  <div class="sep"></div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Order #</div>
      <div class="cell-value-sm">${p.orderNumber}</div>
    </div>
    <div class="cell">
      <div class="cell-label">PO #</div>
      <div class="cell-value-sm">${p.customerPO}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Required</div>
      <div class="cell-value-sm" style="font-weight:bold;">${p.requiredDate}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell">
      <div class="cell-label">Grade</div>
      <div class="cell-value-sm">${p.grade}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Heat #</div>
      <div class="cell-value-sm">${p.heatNumber}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Wt (lbs)</div>
      <div class="cell-value-sm">${p.weight ? Number(p.weight).toLocaleString() : '—'}</div>
    </div>
  </div>

  ${p.carrier ? `
  <div class="row">
    <div class="cell">
      <div class="cell-label">Carrier</div>
      <div class="cell-value-sm" style="font-weight:bold;">${p.carrier} ${p.serviceLevel || ''}</div>
    </div>
  </div>` : ''}

  <div class="barcode-zone">
    <div style="font-size:32pt;font-family:'Courier New',monospace;letter-spacing:4px;font-weight:bold;">
      ||| ${p.jobNumber} |||
    </div>
    <div class="barcode-text">${p.barcodeValue}</div>
  </div>

  <div class="footer">
    <span>Printed: ${new Date(p.printedAt).toLocaleString()}</span>
    <span>SteelWise ERP</span>
  </div>
</div>`);
}

// ── Bill of Lading (Letter/A4 format) ────────────────────────────────────────
function renderBOL(p) {
  return wrapHTML(`BOL – ${p.shipmentNumber}`, `
<div class="tag-full">
  <div class="header">
    <div>
      <div class="header-title">BILL OF LADING</div>
      <div class="header-sub">SteelWise Service Center — ${p.shipFromAddress}</div>
    </div>
    <div style="font-size:20pt;font-weight:bold;">BOL #${p.bolNumber}</div>
  </div>

  <div style="display:flex;gap:16px;margin-top:12px;">
    <div style="flex:1;border:1px solid #ccc;padding:8px;">
      <div class="cell-label">SHIP FROM</div>
      <div style="font-weight:bold;">${p.shipFromName}</div>
      <div>${p.shipFromAddress}</div>
    </div>
    <div style="flex:1;border:1px solid #ccc;padding:8px;">
      <div class="cell-label">SHIP TO</div>
      <div style="font-weight:bold;">${p.shipToName}</div>
      <div>${p.shipToAddress}</div>
    </div>
    <div style="flex:1;border:1px solid #ccc;padding:8px;">
      <div class="cell-label">CARRIER</div>
      <div style="font-weight:bold;">${p.carrier}</div>
      <div class="cell-label" style="margin-top:4px;">TRACKING #</div>
      <div>${p.trackingNumber}</div>
      <div class="cell-label" style="margin-top:4px;">SHIP DATE</div>
      <div>${p.shipDate}</div>
    </div>
  </div>

  <div style="margin-top:12px;">
    <table class="bol-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Pieces</th>
          <th>Weight (lbs)</th>
          <th>Class</th>
          <th>NMFC</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Steel Products — See Packing List #${p.shipmentNumber}</td>
          <td>${p.totalPieces || '—'}</td>
          <td>${p.totalWeight ? Number(p.totalWeight).toLocaleString() : '—'}</td>
          <td>60</td>
          <td>123456</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${p.specialInstructions ? `
  <div style="border:1px solid #ccc;padding:8px;margin-top:8px;">
    <div class="cell-label">Special Instructions</div>
    <div>${p.specialInstructions}</div>
  </div>` : ''}

  <div style="display:flex;gap:16px;margin-top:20px;">
    <div style="flex:1;border-top:1px solid #000;padding-top:4px;">
      <div class="cell-label">Shipper Signature / Date</div>
      <div style="height:40px;"></div>
    </div>
    <div style="flex:1;border-top:1px solid #000;padding-top:4px;">
      <div class="cell-label">Carrier Signature / Date</div>
      <div style="height:40px;"></div>
    </div>
    <div style="flex:1;border-top:1px solid #000;padding-top:4px;">
      <div class="cell-label">Consignee Signature / Date</div>
      <div style="height:40px;"></div>
    </div>
  </div>

  <div class="footer" style="margin-top:12px;">
    <span>Generated: ${new Date(p.printedAt).toLocaleString()}</span>
    <span>Shipment: ${p.shipmentNumber}</span>
    <span>SteelWise ERP</span>
  </div>
</div>`);
}

// ── Packing List ──────────────────────────────────────────────────────────────
function renderPackingList(p) {
  const rows = (p.items || []).map((item) => `
    <tr>
      <td>${item.jobNumber}</td>
      <td>${item.orderNumber}</td>
      <td>${item.description}</td>
      <td>${item.grade}</td>
      <td>${item.pieces} ${item.unit}</td>
      <td>${item.weight ? Number(item.weight).toLocaleString() : '—'}</td>
    </tr>`).join('');

  return wrapHTML(`Packing List – ${p.shipmentNumber}`, `
<div class="tag-full">
  <div class="header">
    <div>
      <div class="header-title">PACKING LIST</div>
      <div class="header-sub">SteelWise Service Center</div>
    </div>
    <div style="font-size:18pt;font-weight:bold;">SHIP# ${p.shipmentNumber}</div>
  </div>

  <div class="row" style="margin-top:8px;">
    <div class="cell">
      <div class="cell-label">Ship To</div>
      <div class="cell-value-sm" style="font-weight:bold;">${p.shipToName}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Total Weight</div>
      <div class="cell-value-sm">${p.totalWeight ? `${Number(p.totalWeight).toLocaleString()} lbs` : '—'}</div>
    </div>
    <div class="cell">
      <div class="cell-label">Total Pieces</div>
      <div class="cell-value-sm">${p.totalPieces || (p.items?.length ?? '—')}</div>
    </div>
  </div>

  <table class="bol-table" style="margin-top:12px;">
    <thead>
      <tr>
        <th>Job #</th>
        <th>Order #</th>
        <th>Description</th>
        <th>Grade</th>
        <th>Qty</th>
        <th>Weight (lbs)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6" style="text-align:center;color:#777;">No items</td></tr>'}
    </tbody>
  </table>

  <div class="footer" style="margin-top:12px;">
    <span>Generated: ${new Date(p.printedAt).toLocaleString()}</span>
    <span>Shipment: ${p.shipmentNumber}</span>
    <span>SteelWise ERP</span>
  </div>
</div>`);
}

// ── Main export ───────────────────────────────────────────────────────────────
export function renderTagHTML(type, payload) {
  switch (type) {
    case 'DTL_TAG':        return renderDTLTag(payload);
    case 'BUNDLE_TAG':     return renderBundleTag(payload);
    case 'SHIPPING_LABEL': return renderShippingLabel(payload);
    case 'BOL':            return renderBOL(payload);
    case 'PACKING_LIST':   return renderPackingList(payload);
    default:
      throw new Error(`Unknown tag type: ${type}`);
  }
}
