import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BomRecipeListPage from './BomRecipeListPage';
import BomRecipeEditorPage from './BomRecipeEditorPage';

export default function BomRecipesApp() {
  return (
    <Routes>
      <Route path="/" element={<BomRecipeListPage />} />
      <Route path="/new" element={<BomRecipeEditorPage />} />
      <Route path="/:recipeId" element={<BomRecipeEditorPage />} />
      <Route path="*" element={<Navigate to="/bom" replace />} />
    </Routes>
  );
}
