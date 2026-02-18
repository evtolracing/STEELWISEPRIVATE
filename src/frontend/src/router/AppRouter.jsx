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
const WorkOrderCreatePage = lazy(() => import('../pages/WorkOrders/WorkOrderCreatePage'))
const ShipmentListPage = lazy(() => import('../pages/Logistics/ShipmentListPage'))
const ShipmentDetailPage = lazy(() => import('../pages/Logistics/ShipmentDetailPage'))
const PricingDashboardPage = lazy(() => import('../pages/Pricing/PricingDashboardPage'))
const QuoteBuilderPage = lazy(() => import('../pages/Pricing/QuoteBuilderPage'))
const DemandShapingDashboard = lazy(() => import('../pages/Commercial/DemandShapingDashboard'))
const QualityDashboardPage = lazy(() => import('../pages/QAQC/QualityDashboardPage'))
const TestEntryPage = lazy(() => import('../pages/QAQC/TestEntryPage'))

// Supplier Quality Management (SQM) / IQC Pages
const InboundReceivingPage = lazy(() => import('../pages/SQM/InboundReceivingPage'))
const IQCInspectionsPage = lazy(() => import('../pages/SQM/IQCInspectionsPage'))
const SupplierNonconformancePage = lazy(() => import('../pages/SQM/SupplierNonconformancePage'))
const SCARManagementPage = lazy(() => import('../pages/SQM/SCARManagementPage'))
const SupplierScorecardsPage = lazy(() => import('../pages/SQM/SupplierScorecardsPage'))
const SupplierListPage = lazy(() => import('../pages/SQM/SupplierListPage'))

// Customer Quality Pages
const ClaimsInboxPage = lazy(() => import('../pages/CustomerQuality/ClaimsInboxPage'))
const RMAManagementPage = lazy(() => import('../pages/CustomerQuality/RMAManagementPage'))
const CARManagementPage = lazy(() => import('../pages/CustomerQuality/CARManagementPage'))
const CreditsApprovalsPage = lazy(() => import('../pages/CustomerQuality/CreditsApprovalsPage'))

// Contractor Portal Pages
const ActiveVisitorsDashboard = lazy(() => import('../pages/ContractorPortal/ActiveVisitorsDashboard'))
const ContractorRegistryPage = lazy(() => import('../pages/ContractorPortal/ContractorRegistryPage'))
const PreRegistrationPage = lazy(() => import('../pages/ContractorPortal/PreRegistrationPage'))
const CheckInKiosk = lazy(() => import('../pages/ContractorPortal/CheckInKiosk'))

// Training Engine Pages
const TrainingDashboard = lazy(() => import('../pages/Training/TrainingDashboard'))
const CourseCatalogPage = lazy(() => import('../pages/Training/CourseCatalogPage'))
const MyCertificationsPage = lazy(() => import('../pages/Training/MyCertificationsPage'))
const CompetencyMatrixPage = lazy(() => import('../pages/Training/CompetencyMatrixPage'))

// Production Quality Pages
const ProdQualityDashboard = lazy(() => import('../pages/ProductionQuality/QualityDashboard'))
const InspectionExecution = lazy(() => import('../pages/ProductionQuality/InspectionExecution'))
const NCRManagement = lazy(() => import('../pages/ProductionQuality/NCRManagement'))
const SPCChartsPage = lazy(() => import('../pages/ProductionQuality/SPCChartsPage'))
const TraceabilitySearch = lazy(() => import('../pages/ProductionQuality/TraceabilitySearch'))

// Maintenance & Reliability Pages
const MaintenanceDashboard = lazy(() => import('../pages/Maintenance/MaintenanceDashboard'))
const WorkOrderCenter = lazy(() => import('../pages/Maintenance/WorkOrderCenter'))
const AssetRegistry = lazy(() => import('../pages/Maintenance/AssetRegistry'))
const PMSchedules = lazy(() => import('../pages/Maintenance/PMSchedules'))
const PartsInventory = lazy(() => import('../pages/Maintenance/PartsInventory'))

// Packaging & Chain-of-Custody Pages
const PackagingQueue = lazy(() => import('../pages/Packaging/PackagingQueue'))
const PackageBuilder = lazy(() => import('../pages/Packaging/PackageBuilder'))
const QCReleaseStation = lazy(() => import('../pages/Packaging/QCReleaseStation'))
const LabelManagement = lazy(() => import('../pages/Packaging/LabelManagement'))
const StagingBoard = lazy(() => import('../pages/Packaging/StagingBoard'))
const CustodyTimeline = lazy(() => import('../pages/Packaging/CustodyTimeline'))
const DocumentationCenter = lazy(() => import('../pages/Packaging/DocumentationCenter'))

// Freight & Delivery Pages
const ShipmentPlanner = lazy(() => import('../pages/Freight/ShipmentPlanner'))
const FreightComparison = lazy(() => import('../pages/Freight/FreightComparison'))
const RouteView = lazy(() => import('../pages/Freight/RouteView'))
const ShipmentTrackingBoard = lazy(() => import('../pages/Freight/ShipmentTrackingBoard'))
const ExceptionInbox = lazy(() => import('../pages/Freight/ExceptionInbox'))
const PODViewer = lazy(() => import('../pages/Freight/PODViewer'))

// Sales & Pricing Pages
const RFQInbox = lazy(() => import('../pages/Sales/RFQInbox'))
const SalesQuoteBuilder = lazy(() => import('../pages/Sales/QuoteBuilder'))
const SalesDashboard = lazy(() => import('../pages/Sales/SalesDashboard'))
const CustomerQuotePortal = lazy(() => import('../pages/Sales/CustomerQuotePortal'))

// Executive Ops Cockpit & Digital Twin Pages
const ExecutiveCockpit = lazy(() => import('../pages/Executive/ExecutiveCockpit'))
const SimulationWorkspace = lazy(() => import('../pages/Executive/SimulationWorkspace'))
const ForecastExplorer = lazy(() => import('../pages/Executive/ForecastExplorer'))
const DecisionLog = lazy(() => import('../pages/Executive/DecisionLog'))
const DigitalTwinViewer = lazy(() => import('../pages/Executive/DigitalTwinViewer'))
const CompressionMetricsDashboard = lazy(() => import('../pages/Executive/CompressionMetricsDashboard'))

// Drop Tag Engine Pages
const DropTagPackagingQueue = lazy(() => import('../pages/DropTags/PackagingQueue'))
const DropTagPrintCenter = lazy(() => import('../pages/DropTags/DropTagPrintCenter'))
const DropTagApplyScanScreen = lazy(() => import('../pages/DropTags/ApplyScanScreen'))
const DropTagListingPage = lazy(() => import('../pages/DropTags/DropTagListingPage'))
const DropTagStagingBoard = lazy(() => import('../pages/DropTags/StagingBoard'))
const DropTagLoadingScreen = lazy(() => import('../pages/DropTags/LoadingScreen'))
const DropTagTraceabilityViewer = lazy(() => import('../pages/DropTags/TraceabilityViewer'))

const ProvenanceLookupPage = lazy(() => import('../pages/Provenance/ProvenanceLookupPage'))
const CustomersPage = lazy(() => import('../pages/Customers/CustomersPage'))
const CustomerPreferencesPage = lazy(() => import('../pages/Customers/CustomerPreferencesPage'))
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'))

// Phase 1 - Service Center Pages
const OrderBoardPage = lazy(() => import('../pages/ModernOrderBoardPage'))
const OrderBoardPageLegacy = lazy(() => import('../pages/OrderBoardPage'))
const SchedulePage = lazy(() => import('../pages/SchedulePage'))
const ShopFloorPage = lazy(() => import('../pages/ShopFloorPage'))
const JobDetailPage = lazy(() => import('../pages/JobDetailPage'))
const ReceivingPage = lazy(() => import('../pages/ReceivingPage'))
const ShippingDeskPage = lazy(() => import('../pages/ShippingDeskPage'))
const TimeTrackingPage = lazy(() => import('../pages/TimeTrackingPage'))

// QC Inspection Module
const QCDashboardPage = lazy(() => import('../pages/QC/QCDashboardPage'))
const QCInspectionPage = lazy(() => import('../pages/QC/QCInspectionPage'))

// Sales Rep Mobile Mode
const MobileRepLayout = lazy(() => import('../components/layout/MobileRepLayout'))
const MobileRepHomePage = lazy(() => import('../pages/MobileRep/MobileRepHomePage'))
const MobileRepIntakePage = lazy(() => import('../pages/MobileRep/MobileRepIntakePage'))
const MobileInventoryLookup = lazy(() => import('../pages/MobileRep/MobileInventoryLookup'))
const MobilePromisePreview = lazy(() => import('../pages/MobileRep/MobilePromisePreview'))
const MobileOrderPlacement = lazy(() => import('../pages/MobileRep/MobileOrderPlacement'))

// POS - Point of Sale
const POSPage = lazy(() => import('../pages/POSPage'))

// Order Intake + POS + Retail Counter
const CSRIntakePage = lazy(() => import('../pages/Orders/CSRIntakePage'))
const OnlineInboxPage = lazy(() => import('../pages/Orders/OnlineInboxPage'))
const IntakeOrderDetailPage = lazy(() => import('../pages/Orders/OrderDetailPage'))
const RetailPOSPage = lazy(() => import('../pages/Orders/RetailPOSPage'))

// E-Commerce Customer Portal + Admin
const ShopHomePage = lazy(() => import('../pages/Ecommerce/ShopHomePage'))
const SearchResultsPage = lazy(() => import('../pages/Ecommerce/SearchResultsPage'))
const ProductDetailPage = lazy(() => import('../pages/Ecommerce/ProductDetailPage'))
const CartPage = lazy(() => import('../pages/Ecommerce/CartPage'))
const CheckoutPage = lazy(() => import('../pages/Ecommerce/CheckoutPage'))
const MyOrdersPage = lazy(() => import('../pages/Ecommerce/MyOrdersPage'))
const MyOrderDetailPage = lazy(() => import('../pages/Ecommerce/MyOrderDetailPage'))
const AccountDashboardPage = lazy(() => import('../pages/Ecommerce/AccountDashboardPage'))
const AccountOrdersPage = lazy(() => import('../pages/Ecommerce/AccountOrdersPage'))
const AccountShipmentsPage = lazy(() => import('../pages/Ecommerce/AccountShipmentsPage'))
const AccountDocumentsPage = lazy(() => import('../pages/Ecommerce/AccountDocumentsPage'))
const AdminCatalogPage = lazy(() => import('../pages/Ecommerce/AdminCatalogPage'))
const OnlineSettingsPage = lazy(() => import('../pages/Ecommerce/OnlineSettingsPage'))
const RemnantCategoryPage = lazy(() => import('../pages/Ecommerce/RemnantCategoryPage'))

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

// BOM Recipes App
const BomRecipesApp = lazy(() => import('../apps/bom/BomRecipesApp'))

// Work Order Optimization App
const OptimizationApp = lazy(() => import('../apps/optimization/OptimizationApp'))

// Logistics & Optimization
const RouteOptimizationScreen = lazy(() => import('../screens/RouteOptimizationScreen'))
const ShipmentTrackingScreen = lazy(() => import('../screens/ShipmentTrackingScreen'))
const DispatchPlanningScreen = lazy(() => import('../screens/DispatchPlanningScreen'))

// Ops Cockpit
const OpsCockpitPage = lazy(() => import('../pages/OpsCockpit/OpsCockpitPage'))

// Role-Based Dashboard App
const DashboardApp = lazy(() => import('../apps/dashboard/DashboardApp.jsx'))

// Shop Floor Queue Pages (Dispatch Engine)
const WorkCenterSelectPage = lazy(() => import('../apps/shopfloor/WorkCenterSelectPage'))
const WorkCenterQueuePage = lazy(() => import('../apps/shopfloor/WorkCenterQueuePage'))

// OrderHub App
const OrderHubApp = lazy(() => import('../apps/orderhub/OrderHubApp'))

// Admin Pages
const UserManagementPage = lazy(() => import('../pages/Admin/UserManagementPage'))
const AuditLogPage = lazy(() => import('../pages/Admin/AuditLogPage'))
const RecipeEditorPage = lazy(() => import('../pages/Admin/RecipeEditorPage'))
const StaffManagementPage = lazy(() => import('../pages/Admin/StaffManagementPage'))

// Partner API Management
const PartnerRegistryPage = lazy(() => import('../pages/Partners/PartnerRegistryPage'))

// Safety / EHS App
const SafetyApp = lazy(() => import('../apps/safety'))

// Help / Manual
const ManualPage = lazy(() => import('../pages/Help/ManualPage'))

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

  // Sales Rep Mobile Mode — standalone (no sidebar, bottom nav layout)
  {
    path: '/mobile-rep',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <MobileRepLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><MobileRepHomePage /></Suspense> },
      { path: 'intake', element: <Suspense fallback={<PageLoader />}><MobileRepIntakePage /></Suspense> },
      { path: 'inventory', element: <Suspense fallback={<PageLoader />}><MobileInventoryLookup /></Suspense> },
      { path: 'promise', element: <Suspense fallback={<PageLoader />}><MobilePromisePreview /></Suspense> },
      { path: 'place-order', element: <Suspense fallback={<PageLoader />}><MobileOrderPlacement /></Suspense> },
    ],
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

      // Role-Based Dashboard
      {
        path: 'role-dashboard/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardApp />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // OrderHub - RFQ/Quote/Order Console
      {
        path: 'orderhub/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OrderHubApp />
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
        path: 'work-orders/new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkOrderCreatePage />
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
      {
        path: 'commercial/demand-shaping',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DemandShapingDashboard />
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

      // Supplier Quality Management (SQM) / Inbound Quality Control
      {
        path: 'sqm/receiving',
        element: (
          <Suspense fallback={<PageLoader />}>
            <InboundReceivingPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'sqm/inspections',
        element: (
          <Suspense fallback={<PageLoader />}>
            <IQCInspectionsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'sqm/snc',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SupplierNonconformancePage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'sqm/scar',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SCARManagementPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'sqm/scorecards',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SupplierScorecardsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'sqm/suppliers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SupplierListPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Customer Quality Management (RMA/CAR)
      {
        path: 'customer-quality/claims',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ClaimsInboxPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'customer-quality/rma',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RMAManagementPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'customer-quality/car',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CARManagementPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'customer-quality/credits',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CreditsApprovalsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Contractor Portal
      {
        path: 'contractors/active',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ActiveVisitorsDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'contractors/registry',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ContractorRegistryPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'contractors/invitations',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PreRegistrationPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'contractors/kiosk',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CheckInKiosk />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Training Engine
      {
        path: 'training/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TrainingDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'training/courses',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CourseCatalogPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'training/my-certs',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MyCertificationsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'training/matrix',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CompetencyMatrixPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // QC Inspection Module
      {
        path: 'qc',
        element: (
          <Suspense fallback={<PageLoader />}>
            <QCDashboardPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'qc/inspect/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <QCInspectionPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Production Quality
      {
        path: 'production-quality/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProdQualityDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'production-quality/inspections',
        element: (
          <Suspense fallback={<PageLoader />}>
            <InspectionExecution />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'production-quality/ncr',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NCRManagement />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'production-quality/spc',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SPCChartsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'production-quality/trace',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TraceabilitySearch />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Maintenance & Reliability
      {
        path: 'maintenance/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MaintenanceDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'maintenance/work-orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkOrderCenter />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'maintenance/assets',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AssetRegistry />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'maintenance/pm-schedules',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PMSchedules />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'maintenance/parts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PartsInventory />
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

      // Safety / EHS Module
      {
        path: 'safety/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SafetyApp />
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

      // Order Board (Kanban) - Modern AI-Ready Version
      {
        path: 'order-board',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OrderBoardPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Order Board - Legacy Version
      {
        path: 'order-board-legacy',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OrderBoardPageLegacy />
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

      // Packaging & Chain-of-Custody Module
      {
        path: 'packaging',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PackagingQueue />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'packaging/queue',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PackagingQueue />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'packaging/builder/:orderId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PackageBuilder />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'packaging/qc-release',
        element: (
          <Suspense fallback={<PageLoader />}>
            <QCReleaseStation />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'packaging/labels',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LabelManagement />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'packaging/staging',
        element: (
          <Suspense fallback={<PageLoader />}>
            <StagingBoard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'packaging/custody',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CustodyTimeline />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'packaging/custody/:packageId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CustodyTimeline />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'packaging/docs',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DocumentationCenter />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Freight & Delivery Module
      {
        path: 'freight/planner',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShipmentPlanner />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'freight/comparison',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FreightComparison />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'freight/comparison/:shipmentId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FreightComparison />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'freight/route/:shipmentId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RouteView />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'freight/tracking',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShipmentTrackingBoard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'freight/exceptions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExceptionInbox />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'freight/pod/:shipmentId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PODViewer />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Sales & Pricing Module
      {
        path: 'sales/rfq-inbox',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RFQInbox />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'sales/quote/:quoteId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SalesQuoteBuilder />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'sales/quote/new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SalesQuoteBuilder />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'sales/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SalesDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'portal/quote/:quoteToken',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CustomerQuotePortal />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Executive Ops Cockpit & Digital Twin Module
      {
        path: 'executive/cockpit',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExecutiveCockpit />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'executive/simulation',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SimulationWorkspace />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'executive/forecast',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForecastExplorer />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'executive/decisions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DecisionLog />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'executive/digital-twin',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DigitalTwinViewer />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'executive/compression-metrics',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CompressionMetricsDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Drop Tag Engine Module
      {
        path: 'drop-tags/queue',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DropTagPackagingQueue />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'drop-tags/print-center',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DropTagPrintCenter />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'drop-tags/apply',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DropTagApplyScanScreen />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'drop-tags/listings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DropTagListingPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'drop-tags/staging',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DropTagStagingBoard />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'drop-tags/load',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DropTagLoadingScreen />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'drop-tags/traceability',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DropTagTraceabilityViewer />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'drop-tags/traceability/:tagId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DropTagTraceabilityViewer />
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

      // Time Tracking Report
      {
        path: 'time-tracking',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TimeTrackingPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Shop Floor Queue - Work Center Selection
      {
        path: 'shopfloor',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkCenterSelectPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Shop Floor Queue - Work Center Queue View
      {
        path: 'shopfloor/:workCenterId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkCenterQueuePage />
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

      // BOM Recipes App
      {
        path: 'bom/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BomRecipesApp />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Work Order Optimization App
      {
        path: 'optimization/*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OptimizationApp />
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

      // Order Intake
      {
        path: 'orders/intake',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CSRIntakePage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'orders/online-inbox',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OnlineInboxPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'orders/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <IntakeOrderDetailPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // POS - Point of Sale
      {
        path: 'pos',
        element: (
          <Suspense fallback={<PageLoader />}>
            <POSPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'pos/retail',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RetailPOSPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Customers
      {
        path: 'customers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CustomersPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'customers/preferences',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CustomerPreferencesPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Admin - User Management
      {
        path: 'admin/users',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UserManagementPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // Admin - Partner API Registry
      {
        path: 'admin/partners',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PartnerRegistryPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      // Admin - Override Audit Log
      {
        path: 'admin/audit-log',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AuditLogPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      // Admin - Processing Recipes & Time Standards
      {
        path: 'admin/processing-recipes',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecipeEditorPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      // Admin - Staff & Operator Management
      {
        path: 'admin/staff',
        element: (
          <Suspense fallback={<PageLoader />}>
            <StaffManagementPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // ═══ E-Commerce — Customer Portal ═══
      {
        path: 'shop',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShopHomePage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'shop/search',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SearchResultsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'shop/remnants',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RemnantCategoryPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'shop/products/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductDetailPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'shop/cart',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CartPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'shop/checkout',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CheckoutPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'shop/orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MyOrdersPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'shop/orders/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MyOrderDetailPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // ═══ Enterprise Customer Account ═══
      {
        path: 'account/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AccountDashboardPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'account/orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AccountOrdersPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'account/shipments',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AccountShipmentsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'account/documents',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AccountDocumentsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // ═══ E-Commerce — Admin ═══
      {
        path: 'admin/catalog',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminCatalogPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'admin/online-settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OnlineSettingsPage />
          </Suspense>
        ),
        errorElement: <RouteErrorPage />,
      },

      // ═══ Help / Manual ═══
      {
        path: 'help/manual',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ManualPage />
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
