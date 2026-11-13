/**
 * Inventory
 *
 * The company keeps one stock list: the stock items that orders, receiving,
 * shipping and invoices all read and update (the Units screens, /api/coils).
 * This address used to open a second list held in separate RFID unit tables
 * that none of those update (finding D-024), so it now opens the real one.
 * The old screens are still in this folder (InventoryDashboardPage,
 * InventoryDetailPage) in case the RFID tables are taken up again.
 */
import { Routes, Route, Navigate } from 'react-router-dom';

export default function InventoryApp() {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/units" replace />} />
    </Routes>
  );
}
