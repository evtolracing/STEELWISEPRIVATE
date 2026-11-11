/**
 * Database store for the v1 inventory routes. Each table keeps the full API
 * record in `data`, plus the columns the routes filter on.
 */
import prisma from '../lib/db.js';

const dataOf = (rows) => rows.map((r) => r.data);

/** Everything the v1 inventory routes read, in API shape. */
export async function loadInventoryState() {
  const [catalog, sites, units, transfers, events] = await Promise.all([
    prisma.inventoryCatalogItem.findMany({ orderBy: { materialCode: 'asc' } }),
    prisma.inventorySite.findMany({ orderBy: { id: 'asc' } }),
    prisma.inventoryUnit.findMany({ orderBy: { id: 'asc' } }),
    prisma.inventoryTransfer.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.rfidScanEvent.findMany({ orderBy: { occurredAt: 'asc' } }),
  ]);
  return {
    catalogItems: dataOf(catalog),
    locations: dataOf(sites),
    inventoryUnits: dataOf(units),
    transfers: dataOf(transfers),
    rfidEvents: dataOf(events),
  };
}

const plain = (obj) => JSON.parse(JSON.stringify(obj));

export async function saveCatalogItem(item) {
  const data = plain(item);
  await prisma.inventoryCatalogItem.upsert({
    where: { materialCode: item.materialCode },
    update: { data },
    create: { materialCode: item.materialCode, data },
  });
}

export async function saveSite(site) {
  const data = plain(site);
  const cols = { type: site.type, parentId: site.parentId || null, data };
  await prisma.inventorySite.upsert({ where: { id: site.id }, update: cols, create: { id: site.id, ...cols } });
}

export async function saveUnit(unit) {
  const data = plain(unit);
  const cols = {
    materialCode: unit.materialCode,
    locationId: unit.locationId,
    status: unit.status,
    rfidTagId: unit.rfidTagId || null,
    etchedId: unit.etchedId || null,
    data,
  };
  await prisma.inventoryUnit.upsert({ where: { id: unit.id }, update: cols, create: { id: unit.id, ...cols } });
}

export async function saveTransfer(transfer) {
  const data = plain(transfer);
  const cols = { status: transfer.status, data };
  await prisma.inventoryTransfer.upsert({
    where: { id: transfer.id },
    update: cols,
    create: { id: transfer.id, ...cols, createdAt: transfer.createdAt ? new Date(transfer.createdAt) : undefined },
  });
}

export async function saveRfidEvent(event) {
  const data = plain(event);
  const cols = {
    rfidTagId: event.rfidTagId,
    inventoryId: event.inventoryId || null,
    occurredAt: new Date(event.createdAt || Date.now()),
    data,
  };
  await prisma.rfidScanEvent.upsert({ where: { id: event.id }, update: cols, create: { id: event.id, ...cols } });
}

export async function saveAdjustment(adjustment) {
  const data = plain(adjustment);
  await prisma.inventoryAdjustment.create({
    data: { id: adjustment.id, inventoryId: adjustment.inventoryId, data },
  });
}
