/**
 * Inventory App
 * Main app component with routing for inventory module
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import InventoryDashboardPage from './InventoryDashboardPage';
import InventoryDetailPage from './InventoryDetailPage';

export default function InventoryApp() {
  return (
    <Routes>
      <Route index element={<InventoryDashboardPage />} />
      <Route path=":inventoryId" element={<InventoryDetailPage />} />
      <Route path="*" element={<Navigate to="/inventory" replace />} />
    </Routes>
  );
}
