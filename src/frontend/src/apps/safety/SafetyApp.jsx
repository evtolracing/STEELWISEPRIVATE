/**
 * Safety App
 * Main app component with routing for Safety/EHS module
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import SafetyDashboard from './SafetyDashboard';
import IncidentsPage from './IncidentsPage';
import IncidentDetailPage from './IncidentDetailPage';
import InspectionsPage from './InspectionsPage';
import InspectionDetailPage from './InspectionDetailPage';
import PermitsPage from './PermitsPage';
import PermitDetailPage from './PermitDetailPage';
import TrainingPage from './TrainingPage';
import ObservationsPage from './ObservationsPage';
import CorrectiveActionsPage from './CorrectiveActionsPage';
import SafetyAssistantPage from './SafetyAssistantPage';
import StopWorkDashboard from './StopWorkDashboard';
import StopWorkClearance from './StopWorkClearance';

export default function SafetyApp() {
  return (
    <Routes>
      <Route index element={<SafetyDashboard />} />
      <Route path="incidents" element={<IncidentsPage />} />
      <Route path="incidents/:incidentId" element={<IncidentDetailPage />} />
      <Route path="inspections" element={<InspectionsPage />} />
      <Route path="inspections/:inspectionId" element={<InspectionDetailPage />} />
      <Route path="permits" element={<PermitsPage />} />
      <Route path="permits/:permitId" element={<PermitDetailPage />} />
      <Route path="training" element={<TrainingPage />} />
      <Route path="observations" element={<ObservationsPage />} />
      <Route path="capa" element={<CorrectiveActionsPage />} />
      <Route path="assistant" element={<SafetyAssistantPage />} />
      <Route path="stop-work" element={<StopWorkDashboard />} />
      <Route path="stop-work/:id" element={<StopWorkClearance />} />
      <Route path="*" element={<Navigate to="/safety" replace />} />
    </Routes>
  );
}
