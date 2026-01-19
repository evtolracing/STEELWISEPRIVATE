// src/dashboard/DashboardEngine.jsx
/**
 * Role-Based Dashboard Engine
 * Renders dynamic dashboards with real data services
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Typography, Alert, Paper, Button, Chip } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { DASHBOARD_CONFIG, ROLE_DISPLAY_NAMES } from './config/dashboardConfig';
import WIDGET_REGISTRY, { AiAssistantPanel } from './widgets/index.jsx';

// Import data services
import { getJobs, getSlaRiskJobs } from '../services/jobsApi';
import { getWorkCenterUtilization } from '../services/workCentersApi';
import { getInventoryRisk, getTransfers } from '../services/inventoryApi';
import { getShippingSummary, getShipments } from '../services/shippingApi';
import { getRfqFunnelStats } from '../services/rfqApi';
import { getMarginInsights } from '../services/marginApi';
import { getExceptionsFeed } from '../services/exceptionsApi';
import { getOpsForecast } from '../services/forecastApi';

// Size mapping for Grid items
const SIZE_MAP = {
  small: { xs: 12, sm: 6, md: 4 },
  medium: { xs: 12, sm: 6, md: 6 },
  large: { xs: 12, sm: 12, md: 12 },
};

// Map widget type to data key
const WIDGET_DATA_MAP = {
  FLOW_BOARD: 'jobs',
  SLA_RISK: 'slaRisk',
  WORKCENTER_UTIL: 'workCenterUtil',
  BOTTLENECK_STRIP: 'workCenterUtil',
  INVENTORY_HEATMAP: 'inventoryRisk',
  TRANSFERS: 'transfers',
  SHIPPING_PANEL: 'shippingSummary',
  RFQ_FUNNEL: 'rfqFunnel',
  MARGIN_INSIGHTS: 'marginInsights',
  BOM_QUALITY: 'bomQuality',
  EXCEPTIONS_FEED: 'exceptionsFeed',
  FORECAST: 'forecast',
};

// Data loading hook
function useDashboardData(role, locationId, division, workCenterId) {
  const [data, setData] = useState({
    jobs: null,
    slaRisk: null,
    workCenterUtil: null,
    inventoryRisk: null,
    transfers: null,
    shippingSummary: null,
    shipments: null,
    rfqFunnel: null,
    marginInsights: null,
    exceptionsFeed: null,
    forecast: null,
  });

  const [loading, setLoading] = useState({
    jobs: true,
    slaRisk: true,
    workCenterUtil: true,
    inventoryRisk: true,
    transfers: true,
    shippingSummary: true,
    shipments: true,
    rfqFunnel: true,
    marginInsights: true,
    exceptionsFeed: true,
    forecast: true,
  });

  const [errors, setErrors] = useState({});

  const loadData = useCallback(async () => {
    const params = { locationId, division };
    const operatorParams = { ...params, workCenterId };

    // Reset loading states
    setLoading({
      jobs: true,
      slaRisk: true,
      workCenterUtil: true,
      inventoryRisk: true,
      transfers: true,
      shippingSummary: true,
      shipments: true,
      rfqFunnel: true,
      marginInsights: true,
      exceptionsFeed: true,
      forecast: true,
    });
    setErrors({});

    // Load data based on role
    const loadJobs = async () => {
      try {
        let jobParams = {};
        if (role === 'OPERATOR') {
          jobParams = { workCenterId, status: 'IN_PROCESS,SCHEDULED' };
        } else if (role === 'SCHEDULER') {
          jobParams = { ...params, status: 'ORDERED,SCHEDULED' };
        } else if (role === 'BRANCH_MANAGER') {
          jobParams = params;
        }
        const jobs = await getJobs(jobParams);
        setData(prev => ({ ...prev, jobs }));
      } catch (err) {
        setErrors(prev => ({ ...prev, jobs: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, jobs: false }));
      }
    };

    const loadSlaRisk = async () => {
      try {
        const slaRisk = await getSlaRiskJobs(params);
        setData(prev => ({ ...prev, slaRisk }));
      } catch (err) {
        setErrors(prev => ({ ...prev, slaRisk: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, slaRisk: false }));
      }
    };

    const loadWorkCenterUtil = async () => {
      try {
        const workCenterUtil = await getWorkCenterUtilization(params);
        setData(prev => ({ ...prev, workCenterUtil }));
      } catch (err) {
        setErrors(prev => ({ ...prev, workCenterUtil: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, workCenterUtil: false }));
      }
    };

    const loadInventoryRisk = async () => {
      try {
        const inventoryRisk = await getInventoryRisk(params);
        setData(prev => ({ ...prev, inventoryRisk }));
      } catch (err) {
        setErrors(prev => ({ ...prev, inventoryRisk: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, inventoryRisk: false }));
      }
    };

    const loadTransfers = async () => {
      try {
        const transfers = await getTransfers(params);
        setData(prev => ({ ...prev, transfers }));
      } catch (err) {
        setErrors(prev => ({ ...prev, transfers: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, transfers: false }));
      }
    };

    const loadShipping = async () => {
      try {
        const [summary, shipments] = await Promise.all([
          getShippingSummary(params),
          getShipments(params),
        ]);
        setData(prev => ({ ...prev, shippingSummary: summary, shipments }));
      } catch (err) {
        setErrors(prev => ({ ...prev, shippingSummary: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, shippingSummary: false, shipments: false }));
      }
    };

    const loadRfqFunnel = async () => {
      try {
        const rfqFunnel = await getRfqFunnelStats(params);
        setData(prev => ({ ...prev, rfqFunnel }));
      } catch (err) {
        setErrors(prev => ({ ...prev, rfqFunnel: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, rfqFunnel: false }));
      }
    };

    const loadMarginInsights = async () => {
      try {
        const marginInsights = await getMarginInsights(params);
        setData(prev => ({ ...prev, marginInsights }));
      } catch (err) {
        setErrors(prev => ({ ...prev, marginInsights: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, marginInsights: false }));
      }
    };

    const loadExceptions = async () => {
      try {
        const exceptionsParams = role === 'OPERATOR' ? operatorParams : params;
        const exceptionsFeed = await getExceptionsFeed({ ...exceptionsParams, limit: 10 });
        setData(prev => ({ ...prev, exceptionsFeed }));
      } catch (err) {
        setErrors(prev => ({ ...prev, exceptionsFeed: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, exceptionsFeed: false }));
      }
    };

    const loadForecast = async () => {
      try {
        const horizonDays = role === 'CEO' ? 30 : role === 'VP_OPERATIONS' ? 7 : 2;
        const forecast = await getOpsForecast({ ...params, horizonDays });
        setData(prev => ({ ...prev, forecast }));
      } catch (err) {
        setErrors(prev => ({ ...prev, forecast: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, forecast: false }));
      }
    };

    // Execute all loads in parallel
    await Promise.all([
      loadJobs(),
      loadSlaRisk(),
      loadWorkCenterUtil(),
      loadInventoryRisk(),
      loadTransfers(),
      loadShipping(),
      loadRfqFunnel(),
      loadMarginInsights(),
      loadExceptions(),
      loadForecast(),
    ]);
  }, [role, locationId, division, workCenterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, errors, refresh: loadData };
}

// Get widget component by type
function getWidgetComponent(widgetType) {
  return WIDGET_REGISTRY[widgetType] || null;
}

// Widget Renderer with loading/error states
function WidgetRenderer({ widget, data, loading, errors, onRetry }) {
  const WidgetComponent = getWidgetComponent(widget.widgetType);
  const dataKey = WIDGET_DATA_MAP[widget.widgetType];
  const widgetData = dataKey ? data[dataKey] : null;
  const isLoading = dataKey ? loading[dataKey] : false;
  const widgetError = dataKey ? errors[dataKey] : null;

  if (!WidgetComponent) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Alert severity="warning" sx={{ fontSize: '0.75rem' }}>
          Unknown widget: {widget.widgetType}
        </Alert>
      </Paper>
    );
  }

  return (
    <WidgetComponent
      title={widget.title}
      data={widgetData}
      loading={isLoading}
      error={widgetError}
      onRetry={onRetry}
      {...(widget.props || {})}
    />
  );
}

// Layout: Simple (stacked vertically)
function SimpleLayout({ widgets, data, loading, errors, onRetry }) {
  return (
    <Grid container spacing={1.5}>
      {widgets.map((widget, index) => {
        const sizes = SIZE_MAP[widget.size] || SIZE_MAP.medium;
        return (
          <Grid item key={`${widget.widgetType}-${index}`} {...sizes}>
            <WidgetRenderer widget={widget} data={data} loading={loading} errors={errors} onRetry={onRetry} />
          </Grid>
        );
      })}
    </Grid>
  );
}

// Layout: 2-Column (main content + secondary)
function TwoColumnLayout({ widgets, showAiPanel, role, data, loading, errors, onRetry, locationId, division }) {
  // Split widgets: first large one goes to main, rest distributed
  const mainWidgets = [];
  const sideWidgets = [];

  widgets.forEach((widget, index) => {
    if (widget.size === 'large' && mainWidgets.length === 0) {
      mainWidgets.push(widget);
    } else if (mainWidgets.length === 0 || index < 3) {
      mainWidgets.push(widget);
    } else {
      sideWidgets.push(widget);
    }
  });

  return (
    <Grid container spacing={1.5}>
      {/* Main Column */}
      <Grid item xs={12} md={showAiPanel ? 6 : 8}>
        <Grid container spacing={1.5}>
          {mainWidgets.map((widget, index) => {
            const sizes = widget.size === 'large' 
              ? { xs: 12 } 
              : { xs: 12, sm: 6 };
            return (
              <Grid item key={`main-${widget.widgetType}-${index}`} {...sizes}>
                <WidgetRenderer widget={widget} data={data} loading={loading} errors={errors} onRetry={onRetry} />
              </Grid>
            );
          })}
        </Grid>
      </Grid>

      {/* Side Column */}
      <Grid item xs={12} md={showAiPanel ? 3 : 4}>
        <Grid container spacing={1.5}>
          {sideWidgets.map((widget, index) => (
            <Grid item key={`side-${widget.widgetType}-${index}`} xs={12}>
              <WidgetRenderer widget={widget} data={data} loading={loading} errors={errors} onRetry={onRetry} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* AI Panel (if enabled) */}
      {showAiPanel && (
        <Grid item xs={12} md={3}>
          <Box sx={{ position: 'sticky', top: 8 }}>
            <AiAssistantPanel title="Ops Assistant" role={role} context={{ locationId, division }} />
          </Box>
        </Grid>
      )}
    </Grid>
  );
}

// Layout: 3-Column (executive view with more density)
function ThreeColumnLayout({ widgets, showAiPanel, role, data, loading, errors, onRetry, locationId, division }) {
  const columns = [[], [], []];
  
  widgets.forEach((widget, index) => {
    if (widget.size === 'large') {
      columns[0].push(widget);
    } else {
      // Distribute small/medium widgets across columns
      const targetCol = (index % 2) + 1;
      columns[targetCol].push(widget);
    }
  });

  return (
    <Grid container spacing={1.5}>
      {/* Left Column - Main */}
      <Grid item xs={12} md={showAiPanel ? 5 : 6}>
        <Grid container spacing={1.5}>
          {columns[0].map((widget, index) => (
            <Grid item key={`col0-${widget.widgetType}-${index}`} xs={12}>
              <WidgetRenderer widget={widget} data={data} loading={loading} errors={errors} onRetry={onRetry} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* Middle Column */}
      <Grid item xs={12} sm={6} md={showAiPanel ? 2 : 3}>
        <Grid container spacing={1.5}>
          {columns[1].map((widget, index) => (
            <Grid item key={`col1-${widget.widgetType}-${index}`} xs={12}>
              <WidgetRenderer widget={widget} data={data} loading={loading} errors={errors} onRetry={onRetry} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* Right Column */}
      <Grid item xs={12} sm={6} md={showAiPanel ? 2 : 3}>
        <Grid container spacing={1.5}>
          {columns[2].map((widget, index) => (
            <Grid item key={`col2-${widget.widgetType}-${index}`} xs={12}>
              <WidgetRenderer widget={widget} data={data} loading={loading} errors={errors} onRetry={onRetry} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* AI Panel */}
      {showAiPanel && (
        <Grid item xs={12} md={3}>
          <Box sx={{ position: 'sticky', top: 8 }}>
            <AiAssistantPanel title="Ops Assistant" role={role} context={{ locationId, division }} />
          </Box>
        </Grid>
      )}
    </Grid>
  );
}

// Main Dashboard Engine Component
export default function DashboardEngine({ 
  role, 
  locationId = 'FWA', 
  division = 'METALS',
  workCenterId = 'SAW-01'
}) {
  const config = DASHBOARD_CONFIG[role];
  const { data, loading, errors, refresh } = useDashboardData(role, locationId, division, workCenterId);

  if (!config) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Unknown role: {role}. No dashboard configuration found.
        </Alert>
      </Box>
    );
  }

  const { layout, widgets, showAiPanel, title } = config;
  const roleName = ROLE_DISPLAY_NAMES[role] || role;

  const layoutProps = {
    widgets,
    data,
    loading,
    errors,
    showAiPanel,
    role,
    onRetry: refresh,
    locationId,
    division,
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Dashboard Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight={600} sx={{ mb: 0.25 }}>
            {title || `${roleName} Dashboard`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={locationId} size="small" variant="outlined" />
            <Chip label={division} size="small" variant="outlined" />
            <Typography variant="caption" color="text.secondary">
              {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={refresh}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* Render Layout */}
      {layout === 'simple' && <SimpleLayout {...layoutProps} />}
      {layout === '2-column' && <TwoColumnLayout {...layoutProps} />}
      {layout === '3-column' && <ThreeColumnLayout {...layoutProps} />}
    </Box>
  );
}
