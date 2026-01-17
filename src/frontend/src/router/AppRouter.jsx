import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { AppLayout } from '../components/layout'
import { useAuth } from '../hooks/useAuth'

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'))
const HeatListPage = lazy(() => import('../pages/Heats/HeatListPage'))
const HeatDetailPage = lazy(() => import('../pages/Heats/HeatDetailPage'))
const UnitListPage = lazy(() => import('../pages/Units/UnitListPage'))
const UnitDetailPage = lazy(() => import('../pages/Units/UnitDetailPage'))
const WorkOrderListPage = lazy(() => import('../pages/WorkOrders/WorkOrderListPage'))
const WorkOrderDetailPage = lazy(() => import('../pages/WorkOrders/WorkOrderDetailPage'))
const ShipmentListPage = lazy(() => import('../pages/Logistics/ShipmentListPage'))
const ShipmentDetailPage = lazy(() => import('../pages/Logistics/ShipmentDetailPage'))
const PricingDashboardPage = lazy(() => import('../pages/Pricing/PricingDashboardPage'))
const QuoteBuilderPage = lazy(() => import('../pages/Pricing/QuoteBuilderPage'))
const QualityDashboardPage = lazy(() => import('../pages/QAQC/QualityDashboardPage'))
const TestEntryPage = lazy(() => import('../pages/QAQC/TestEntryPage'))
const ProvenanceLookupPage = lazy(() => import('../pages/Provenance/ProvenanceLookupPage'))
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'))

// Loading fallback
function PageLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
      }}
    >
      <CircularProgress />
    </Box>
  )
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Router configuration
const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },

  // Protected routes with layout
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      // Dashboard
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },

      // Heats
      {
        path: 'heats',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HeatListPage />
          </Suspense>
        ),
      },
      {
        path: 'heats/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HeatDetailPage />
          </Suspense>
        ),
      },

      // Units
      {
        path: 'units',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UnitListPage />
          </Suspense>
        ),
      },
      {
        path: 'units/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UnitDetailPage />
          </Suspense>
        ),
      },

      // Work Orders
      {
        path: 'work-orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkOrderListPage />
          </Suspense>
        ),
      },
      {
        path: 'work-orders/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkOrderDetailPage />
          </Suspense>
        ),
      },

      // Logistics
      {
        path: 'logistics/shipments',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShipmentListPage />
          </Suspense>
        ),
      },
      {
        path: 'logistics/shipments/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShipmentDetailPage />
          </Suspense>
        ),
      },

      // Pricing
      {
        path: 'pricing',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PricingDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'pricing/quotes/new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <QuoteBuilderPage />
          </Suspense>
        ),
      },

      // QA/QC
      {
        path: 'qaqc',
        element: (
          <Suspense fallback={<PageLoader />}>
            <QualityDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'qaqc/test-entry',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TestEntryPage />
          </Suspense>
        ),
      },

      // Provenance
      {
        path: 'provenance',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProvenanceLookupPage />
          </Suspense>
        ),
      },

      // Catch-all redirect
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
