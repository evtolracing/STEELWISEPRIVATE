export { default as LoadDiagram } from './LoadDiagram'
export { default as RouteMap } from './RouteMap'

// Mapbox-powered logistics components
export { default as DeliveryMapDialog } from './DeliveryMapDialog';
export { default as AddressAutocomplete } from './AddressAutocomplete';
export { default as DeliveryZoneMap } from './DeliveryZoneMap';
export { default as InboundShipmentTracker } from './InboundShipmentTracker';

// Re-export map utilities for convenience
export {
  geocodeAddress,
  reverseGeocode,
  getRouteDirections,
  getTrafficRoute,
  optimizeRoute,
  getIsochrone,
  getDistanceMatrix,
  searchPlaces,
  getStaticMapUrl,
  calculateDistance,
  calculateDeliveryCost,
  calculateFuelCost,
  estimateDeliveryTime,
  MAP_STYLES,
  DEFAULT_MAP_CONFIG,
  getMapboxToken,
} from '../../services/mapService';
