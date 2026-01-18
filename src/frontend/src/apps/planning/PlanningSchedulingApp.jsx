import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PlanningBoardPage from './PlanningBoardPage';
import ProductionWorkflowBoardPage from './ProductionWorkflowBoardPage';

function PlanningSchedulingApp() {
  return (
    <Routes>
      <Route path="/" element={<PlanningBoardPage />} />
      <Route path="/workflow" element={<ProductionWorkflowBoardPage />} />
    </Routes>
  );
}

export default PlanningSchedulingApp;
