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
      <div class="header-sub">${p.branchName || ''}</div>
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
      <div class="header-sub">${p.branchName || ''}</div>
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

// ── Bill of lading and packing list (letter) ────────────────────────────────
// Both are drawn from lib/shippingDocuments.js. A fact that is not on file prints as a blank
// line to be written in by hand. Freight class and NMFC number are not kept in this system,
// so their columns are left empty: nothing is printed there that nobody entered (Phase 8, N-014).
const BLANK = '<span style="display:inline-block;min-width:1.4in;border-bottom:1px solid #000;">&nbsp;</span>';
const or = (v) => (v === '' || v == null ? BLANK : v);
const qty = (v) => (v === '' || v == null ? '' : Number(v).toLocaleString());
const address = (a) => [a.address, [a.city, a.state].filter(Boolean).join(', '), a.postalCode].filter(Boolean).join('<br/>');
const when = (d) => (d ? new Date(d).toLocaleDateString() : '');
function stockLines(l) {
  return (l.stock || []).map((x) => `${x.tag || ''}${x.heatNumber ? ` · heat ${x.heatNumber}` : ''}${x.grade ? ` · ${x.grade}` : ''} · ${qty(x.quantity)} ${x.unit || ''}${x.bin ? ` · bin ${x.bin}` : ''}`).join('<br/>');
}
function parties(p) {
  const from = p.shipFrom || {}; const to = p.shipTo || {};
  return `
  <div style="display:flex;gap:16px;margin-top:12px;">
    <div style="flex:1;border:1px solid #ccc;padding:8px;">
      <div class="cell-label">SHIP FROM</div>
      <div style="font-weight:bold;">${or(from.name)}</div>
      <div>${address(from) || BLANK}</div>
    </div>
    <div style="flex:1;border:1px solid #ccc;padding:8px;">
      <div class="cell-label">SHIP TO</div>
      <div style="font-weight:bold;">${or(to.name)}</div>
      <div>${address(to) || BLANK}</div>
    </div>
    <div style="flex:1;border:1px solid #ccc;padding:8px;">
      <div class="cell-label">CARRIER</div>
      <div style="font-weight:bold;">${or(p.shipment?.carrier)}</div>
      <div class="cell-label" style="margin-top:4px;">TRUCK / DRIVER</div>
      <div>${[p.shipment?.truckNumber, p.shipment?.driverName].filter(Boolean).join(' / ') || BLANK}</div>
      <div class="cell-label" style="margin-top:4px;">SHIP DATE</div>
      <div>${when(p.shipment?.shippedAt) || when(p.shipment?.scheduledDate) || BLANK}</div>
    </div>
  </div>
  <div class="row" style="margin-top:8px;">
    <div class="cell"><div class="cell-label">Order</div><div class="cell-value-sm">${p.order?.orderNumber || ''}</div></div>
    <div class="cell"><div class="cell-label">Customer PO</div><div class="cell-value-sm">${p.order?.customerPo || ''}</div></div>
    <div class="cell"><div class="cell-label">Freight terms</div><div class="cell-value-sm">${p.order?.freightTerms || ''}</div></div>
    <div class="cell"><div class="cell-label">Sold by</div><div class="cell-value-sm">${p.order?.soldBy || ''}</div></div>
  </div>`;
}
const draft = (p) => (p.stage === 'BEFORE_DISPATCH' ? '<div class="reprint-banner">NOT YET DISPATCHED — the stock listed is what is reserved</div>' : '');
const reprint = (p) => (p.reprint ? '<div class="reprint-banner">REPRINT</div>' : '');
const foot = (p) => `
  <div class="footer" style="margin-top:12px;">
    <span>Generated: ${new Date(p.printedAt || Date.now()).toLocaleString()}</span>
    <span>Shipment: ${p.shipment?.shipmentNumber || ''}</span>
    <span>SteelWise ERP</span>
  </div>`;

function renderBOL(p) {
  const rows = (p.lines || []).map((l) => `
        <tr>
          <td>${l.description || ''}<div style="font-size:8pt;color:#333;">${stockLines(l)}</div></td>
          <td>${qty(l.quantity)} ${l.unit || ''}</td>
          <td>${qty(l.weightLb)}</td>
          <td></td>
          <td></td>
        </tr>`).join('');
  return wrapHTML(`BOL – ${p.shipment?.shipmentNumber || ''}`, `
<div class="tag-full">
  ${reprint(p)}${draft(p)}
  <div class="header">
    <div>
      <div class="header-title">BILL OF LADING</div>
      <div class="header-sub">${p.shipFrom?.name || ''}</div>
    </div>
    <div style="font-size:20pt;font-weight:bold;">BOL # ${p.shipment?.bolNumber || '<span style="font-weight:normal;font-size:10pt;">(not entered)</span>'}</div>
  </div>
  ${parties(p)}
  <div style="margin-top:12px;">
    <table class="bol-table">
      <thead><tr><th>Description</th><th>Quantity</th><th>Weight (lbs)</th><th>Class</th><th>NMFC</th></tr></thead>
      <tbody>
        ${rows || '<tr><td colspan="5" style="text-align:center;color:#777;">Nothing is on this shipment</td></tr>'}
        <tr><td style="text-align:right;font-weight:bold;">Total${p.totals?.packages ? ` · ${p.totals.packages} package${p.totals.packages === 1 ? '' : 's'}` : ''}</td><td></td><td style="font-weight:bold;">${qty(p.totals?.weightLb) || BLANK}</td><td></td><td></td></tr>
      </tbody>
    </table>
  </div>
  ${p.shipment?.notes ? `
  <div style="border:1px solid #ccc;padding:8px;margin-top:8px;">
    <div class="cell-label">Notes</div>
    <div>${p.shipment.notes}</div>
  </div>` : ''}
  <div style="display:flex;gap:16px;margin-top:20px;">
    <div style="flex:1;border-top:1px solid #000;padding-top:4px;"><div class="cell-label">Shipper Signature / Date</div><div style="height:40px;"></div></div>
    <div style="flex:1;border-top:1px solid #000;padding-top:4px;"><div class="cell-label">Carrier Signature / Date</div><div style="height:40px;"></div></div>
    <div style="flex:1;border-top:1px solid #000;padding-top:4px;"><div class="cell-label">Consignee Signature / Date</div><div style="height:40px;"></div></div>
  </div>
  ${foot(p)}
</div>`);
}

function renderPackingList(p) {
  const rows = (p.lines || []).map((l) => `
    <tr>
      <td>${l.lineNumber ?? ''}</td>
      <td>${l.description || ''}</td>
      <td>${stockLines(l)}</td>
      <td>${qty(l.quantity)} ${l.unit || ''}</td>
      <td>${qty(l.weightLb)}</td>
      <td>${l.quantityStillToShip > 0 ? `${qty(l.quantityStillToShip)} ${l.unit || ''}` : ''}</td>
    </tr>`).join('');
  const pk = (p.packages || []).map((k) => `
    <tr><td>${k.packageId}</td><td>${k.type || ''}</td><td>${k.lineNumber ?? ''}</td><td>${k.pieces || ''}</td><td>${qty(k.netWeightLb)}</td><td>${qty(k.grossWeightLb)}</td><td>${(k.tags || []).join(', ')}</td></tr>`).join('');
  return wrapHTML(`Packing List – ${p.shipment?.shipmentNumber || ''}`, `
<div class="tag-full">
  ${reprint(p)}${draft(p)}
  <div class="header">
    <div>
      <div class="header-title">${p.stage === 'BEFORE_DISPATCH' ? 'PICK LIST / PACKING LIST' : 'PACKING LIST'}</div>
      <div class="header-sub">${p.shipFrom?.name || ''}</div>
    </div>
    <div style="font-size:18pt;font-weight:bold;">${p.shipment?.shipmentNumber || ''}</div>
  </div>
  ${parties(p)}
  <table class="bol-table" style="margin-top:12px;">
    <thead><tr><th>Line</th><th>Description</th><th>Stock item, heat, grade</th><th>Quantity</th><th>Weight (lbs)</th><th>Still to ship</th></tr></thead>
    <tbody>
      ${rows || '<tr><td colspan="6" style="text-align:center;color:#777;">Nothing is on this shipment</td></tr>'}
    </tbody>
  </table>
  ${pk ? `
  <table class="bol-table" style="margin-top:12px;">
    <thead><tr><th>Package</th><th>Type</th><th>Line</th><th>Pieces</th><th>Net (lbs)</th><th>Gross (lbs)</th><th>Tags</th></tr></thead>
    <tbody>${pk}</tbody>
  </table>` : ''}
  <div class="row" style="margin-top:8px;">
    <div class="cell"><div class="cell-label">Total weight</div><div class="cell-value-sm">${qty(p.totals?.weightLb) ? `${qty(p.totals.weightLb)} lbs` : BLANK}</div></div>
    <div class="cell"><div class="cell-label">Received by</div><div class="cell-value-sm">${p.shipment?.receivedBy || (p.shipment?.noSignatureReason ? `No signature: ${p.shipment.noSignatureReason}` : BLANK)}</div></div>
  </div>
  ${foot(p)}
</div>`);
}

/** Text from the records is shown as text: a customer or note cannot put markup on the page. */
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function clean(v) {
  if (v == null) return '';
  if (typeof v === 'string') return esc(v);
  if (Array.isArray(v)) return v.map(clean);
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]));
  return v;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function renderTagHTML(type, rawPayload) {
  const payload = clean(rawPayload || {});
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
