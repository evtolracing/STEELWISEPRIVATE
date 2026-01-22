import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RfqListPage from './RfqListPage';
import RfqCreatePage from './RfqCreatePage';
import RfqDetailPage from './RfqDetailPage';
import OrderDetailPage from './OrderDetailPage';

export default function OrderHubApp() {
  return (
    <Routes>
      <Route index element={<RfqListPage />} />
      <Route path="rfq/new" element={<RfqCreatePage />} />
      <Route path="rfq/:rfqId" element={<RfqDetailPage />} />
      <Route path="orders/:orderId" element={<OrderDetailPage />} />
      <Route path="*" element={<Navigate to="/orderhub" replace />} />
    </Routes>
  );
}
