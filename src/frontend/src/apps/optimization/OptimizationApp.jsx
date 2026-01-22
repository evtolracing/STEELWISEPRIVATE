import { Routes, Route, Navigate } from 'react-router-dom';
import WorkOrderOptimizationPage from './WorkOrderOptimizationPage';

export default function OptimizationApp() {
  return (
    <Routes>
      <Route path="/" element={<WorkOrderOptimizationPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
