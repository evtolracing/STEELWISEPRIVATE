import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { AppLayout } from '../components/layout'
import { RouteErrorPage } from '../components/common'
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

// Phase 1 - Service Center Pages
const OrderBoardPage = lazy(() => import('../pages/OrderBoardPage'))
const SchedulePage = lazy(() => import('../pages/SchedulePage'))
const ShopFloorPage = lazy(() => import('../pages/ShopFloorPage'))
const JobDetailPage = lazy(() => import('../pages/JobDetailPage'))
const ReceivingPage = lazy(() => import('../pages/ReceivingPage'))
const PackagingPage = lazy(() => import('../pages/PackagingPage'))
const ShippingDeskPage = lazy(() => import('../pages/ShippingDeskPage'))

// POS - Point of Sale
const POSPage = lazy(() => import('../pages/POSPage'))

// Planning App
const PlanningSchedulingApp = lazy(() => import('../apps/planning/PlanningSchedulingApp'))

// Production Workflow
const ProductionLayout = lazy(() => import('../components/production/ProductionLayout'))
const ProductionWorkflowBoard = lazy(() => import('../components/production/ProductionWorkflowBoard'))
const ShopFloorScreen = lazy(() => import('../components/production/ShopFloorScreen'))
const ShippingScreen = lazy(() => import('../components/production/ShippingScreen'))

// New App Pages
const ShipmentsPage = lazy(() => import('../apps/shipments/ShipmentsPage'))
const OrdersPage = lazy(() => import('../apps/orders/OrdersPage'))
const BOMsPage = lazy(() => import('../apps/boms/BOMsPage'))

// Inventory App
const InventoryApp = lazy(() => import('../apps/inventory/InventoryApp'))

// Logistics & Optimization
const RouteOptimizationScreen = lazy(() => import('../screens/RouteOptimizationScreen'))
const ShipmentTrackingScreen = lazy(() => import('../screens/ShipmentTrackingScreen'))
const DispatchPlanningScreen = lazy(() => import('../screens/DispatchPlanningScreen'))

// Ops Cockpit
const OpsCockpitPage = lazy(() => import('../pages/OpsCockpit/OpsCockpitPage'))

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
    errorElement: <RouteErrorPage />,
  },

  // Shop Floor - Standalone (no app layout for touch-friendly full screen)
  {
    path: '/shop-floor',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ShopFloorPage />
        </Suspense>
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
  },

  // POS - Point of Sale (standalone full-screen for counter operations)
  {
    path: '/pos',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <POSPage />
        </Suspense>
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
  },

  // Protected routes with layout
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      // Dashboard
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Ops Cockpit - Command Center
      {
        path: 'ops-cockpit',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OpsCockpitPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Heats
      {
        path: 'heats',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HeatListPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'heats/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HeatDetailPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Units
      {
        path: 'units',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UnitListPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'units/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UnitDetailPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Work Orders
      {
        path: 'work-orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkOrderListPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'work-orders/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkOrderDetailPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Logistics
      {
        path: 'logistics/shipments',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShipmentListPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'logistics/shipments/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShipmentDetailPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Pricing
      {
        path: 'pricing',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PricingDashboardPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'pricing/quotes/new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <QuoteBuilderPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // QA/QC
      {
        path: 'qaqc',
        element: (
          <Suspense fallback={<PageLoader />}>
            <QualityDashboardPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'qaqc/test-entry',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TestEntryPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Provenance
      {
        path: 'provenance',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProvenanceLookupPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // ============================================
      // Phase 1 - Service Center Operations Routes
      // ============================================

      // Production Workflow Board
      {
        path: 'production',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductionWorkflowBoard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Production Shop Floor Screen
      {
        path: 'production/shop-floor',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShopFloorScreen />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Production Shipping Screen
      {
        path: 'production/shipping',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShippingScreen />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Order Board (Kanban)
      {
        path: 'order-board',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OrderBoardPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Work Center Schedule
      {
        path: 'schedule',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SchedulePage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Job Detail
      {
        path: 'jobs/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <JobDetailPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Receiving
      {
        path: 'receiving',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReceivingPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Packaging
      {
        path: 'packaging',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PackagingPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Shipping/Shipments
      {
        path: 'shipping',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShipmentsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Route Optimization
      {
        path: 'logistics/route-optimization',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RouteOptimizationScreen />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Shipment Tracking
      {
        path: 'logistics/tracking',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShipmentTrackingScreen />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Dispatch Planning
      {
        path: 'logistics/dispatch',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DispatchPlanningScreen />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Orders (new detailed view)
      {
        path: 'orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OrdersPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // BOMs / Recipes
      {
        path: 'boms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BOMsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Inventory App (with AI Assistant)
      {
        path: 'inventory/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <InventoryApp />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Planning & Scheduling App
      {
        path: 'planning/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PlanningSchedulingApp />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Catch-all redirect
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
})

export default function AppRouter() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}
