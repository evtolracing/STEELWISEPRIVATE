// Mapbox Configuration and Service
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2lnbndpc2UiLCJhIjoiY21raXh4eGp5MHlxdDNlcHpid3M2a2g3NyJ9.RIqOGRmtiTyvbjAY2thruQ';

// Map styles - all Mapbox styles
export const MAP_STYLES = {
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
  SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v12',
  LIGHT: 'mapbox://styles/mapbox/light-v11',
  DARK: 'mapbox://styles/mapbox/dark-v11',
  NAVIGATION_DAY: 'mapbox://styles/mapbox/navigation-day-v1',
  NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1',
  TRAFFIC_DAY: 'mapbox://styles/mapbox/traffic-day-v2',
  TRAFFIC_NIGHT: 'mapbox://styles/mapbox/traffic-night-v2',
};

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  style: MAP_STYLES.STREETS,
  center: [-95.7129, 37.0902], // Center of USA
  zoom: 3.5,
  pitch: 0,
  bearing: 0,
};

// Get Mapbox access token
export function getMapboxToken() {
  return MAPBOX_TOKEN;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Array} coord1 - [lng, lat]
 * @param {Array} coord2 - [lng, lat]
 * @returns {number} - Distance in miles
 */
export function calculateDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Geocode an address to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} - { coordinates: [lng, lat], place_name }
 */
export async function geocodeAddress(address) {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        coordinates: feature.center, // [lng, lat]
        place_name: feature.place_name,
        address: feature.place_name,
      };
    }
    
    throw new Error('No results found');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Get route directions between multiple waypoints
 * @param {Array<Array>} coordinates - Array of [lng, lat] coordinates
 * @param {Object} options - Routing options
 * @returns {Promise<Object>} - Route data with geometry and duration
 */
export async function getRouteDirections(coordinates, options = {}) {
  const {
    profile = 'driving-traffic', // driving, driving-traffic, walking, cycling
    geometries = 'geojson',
    overview = 'full',
  } = options;
  
  const coordString = coordinates.map(c => c.join(',')).join(';');
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordString}?access_token=${MAPBOX_TOKEN}&geometries=${geometries}&overview=${overview}&steps=true`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        geometry: route.geometry,
        distance: route.distance * 0.000621371, // Convert meters to miles
        duration: route.duration / 60, // Convert seconds to minutes
        legs: route.legs,
      };
    }
    
    throw new Error('No route found');
  } catch (error) {
    console.error('Routing error:', error);
    throw error;
  }
}

/**
 * Optimize route for multiple stops (Traveling Salesman Problem)
 * @param {Array<Array>} coordinates - Array of [lng, lat] coordinates
 * @returns {Promise<Object>} - Optimized route with waypoint order
 */
export async function optimizeRoute(coordinates) {
  if (coordinates.length < 2) {
    throw new Error('Need at least 2 coordinates to optimize');
  }
  
  // First and last points are fixed (start and end)
  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];
  const waypoints = coordinates.slice(1, -1);
  
  const coordString = [start, ...waypoints, end].map(c => c.join(',')).join(';');
  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordString}?access_token=${MAPBOX_TOKEN}&source=first&destination=last&roundtrip=false&geometries=geojson&overview=full`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.trips && data.trips.length > 0) {
      const trip = data.trips[0];
      return {
        geometry: trip.geometry,
        distance: trip.distance * 0.000621371, // Miles
        duration: trip.duration / 60, // Minutes
        waypoint_order: data.waypoints.map(wp => wp.waypoint_index),
        waypoints: data.waypoints,
      };
    }
    
    throw new Error('No optimized route found');
  } catch (error) {
    console.error('Route optimization error:', error);
    throw error;
  }
}

/**
 * Calculate delivery cost based on distance and weight
 * @param {number} distance - Distance in miles
 * @param {number} weight - Weight in pounds
 * @returns {number} - Estimated delivery cost
 */
export function calculateDeliveryCost(distance, weight) {
  const baseCost = 50; // Base fee
  const perMileCost = 2.5; // Per mile
  const perPoundCost = 0.15; // Per pound
  
  return baseCost + (distance * perMileCost) + (weight * perPoundCost);
}

/**
 * Reverse geocode coordinates to an address
 * @param {Array} coordinates - [lng, lat]
 * @returns {Promise<Object>} - Address details
 */
export async function reverseGeocode(coordinates) {
  const [lng, lat] = coordinates;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        place_name: feature.place_name,
        address: feature.properties?.address || '',
        city: feature.context?.find(c => c.id.startsWith('place'))?.text || '',
        state: feature.context?.find(c => c.id.startsWith('region'))?.text || '',
        zip: feature.context?.find(c => c.id.startsWith('postcode'))?.text || '',
        country: feature.context?.find(c => c.id.startsWith('country'))?.text || '',
      };
    }
    
    throw new Error('No results found');
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

/**
 * Get isochrone (area reachable within time/distance)
 * @param {Array} coordinates - [lng, lat] center point
 * @param {Object} options - Isochrone options
 * @returns {Promise<Object>} - GeoJSON polygon
 */
export async function getIsochrone(coordinates, options = {}) {
  const {
    profile = 'driving',
    contours_minutes = [15, 30, 60], // Minutes of travel time
    polygons = true,
  } = options;
  
  const [lng, lat] = coordinates;
  const contours = contours_minutes.join(',');
  const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lng},${lat}?contours_minutes=${contours}&polygons=${polygons}&access_token=${MAPBOX_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Isochrone error:', error);
    throw error;
  }
}

/**
 * Get matrix of travel times between multiple points
 * @param {Array<Array>} sources - Source coordinates
 * @param {Array<Array>} destinations - Destination coordinates
 * @returns {Promise<Object>} - Distance/duration matrix
 */
export async function getDistanceMatrix(sources, destinations) {
  const allCoords = [...sources, ...destinations];
  const coordString = allCoords.map(c => c.join(',')).join(';');
  const sourceIndices = sources.map((_, i) => i).join(';');
  const destIndices = destinations.map((_, i) => i + sources.length).join(';');
  
  const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordString}?sources=${sourceIndices}&destinations=${destIndices}&annotations=distance,duration&access_token=${MAPBOX_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      durations: data.durations?.map(row => row.map(d => d ? d / 60 : null)), // Convert to minutes
      distances: data.distances?.map(row => row.map(d => d ? d * 0.000621371 : null)), // Convert to miles
      sources: data.sources,
      destinations: data.destinations,
    };
  } catch (error) {
    console.error('Matrix error:', error);
    throw error;
  }
}

/**
 * Search for places (POIs, addresses, etc)
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - List of places
 */
export async function searchPlaces(query, options = {}) {
  const {
    proximity = null, // [lng, lat] to bias results
    types = null, // poi, address, place, etc
    limit = 5,
    bbox = null, // Bounding box [minLng, minLat, maxLng, maxLat]
  } = options;
  
  let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=${limit}`;
  
  if (proximity) url += `&proximity=${proximity.join(',')}`;
  if (types) url += `&types=${types}`;
  if (bbox) url += `&bbox=${bbox.join(',')}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features?.map(f => ({
      id: f.id,
      name: f.text,
      place_name: f.place_name,
      coordinates: f.center,
      type: f.place_type?.[0],
      properties: f.properties,
    })) || [];
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * Get traffic data for a route
 * @param {Array<Array>} coordinates - Route coordinates
 * @returns {Promise<Object>} - Traffic-aware routing data
 */
export async function getTrafficRoute(coordinates) {
  const coordString = coordinates.map(c => c.join(',')).join(';');
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordString}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&annotations=congestion,speed&steps=true`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        geometry: route.geometry,
        distance: route.distance * 0.000621371,
        duration: route.duration / 60,
        duration_typical: route.duration_typical ? route.duration_typical / 60 : null,
        congestion: route.legs?.[0]?.annotation?.congestion || [],
        speed: route.legs?.[0]?.annotation?.speed || [],
        steps: route.legs?.[0]?.steps || [],
      };
    }
    
    throw new Error('No route found');
  } catch (error) {
    console.error('Traffic route error:', error);
    throw error;
  }
}

/**
 * Get static map image URL
 * @param {Object} options - Map options
 * @returns {string} - Static map image URL
 */
export function getStaticMapUrl(options = {}) {
  const {
    center = [-95.7129, 37.0902],
    zoom = 10,
    width = 600,
    height = 400,
    style = 'streets-v12',
    markers = [],
    path = null,
    retina = true,
  } = options;
  
  let url = `https://api.mapbox.com/styles/v1/mapbox/${style}/static`;
  
  // Add markers
  if (markers.length > 0) {
    const markerString = markers.map(m => {
      const color = m.color || 'ff0000';
      const label = m.label || '';
      return `pin-s-${label}+${color}(${m.coordinates.join(',')})`;
    }).join(',');
    url += `/${markerString}`;
  }
  
  // Add path if provided
  if (path) {
    const pathCoords = path.coordinates.map(c => c.join(',')).join(',');
    url += `/path-${path.width || 5}+${path.color || '3887be'}(${encodeURIComponent(pathCoords)})`;
  }
  
  url += `/${center.join(',')},${zoom}/${width}x${height}${retina ? '@2x' : ''}?access_token=${MAPBOX_TOKEN}`;
  
  return url;
}

/**
 * Calculate fuel cost for a route
 * @param {number} distance - Distance in miles
 * @param {Object} options - Fuel options
 * @returns {Object} - Fuel cost breakdown
 */
export function calculateFuelCost(distance, options = {}) {
  const {
    mpg = 6, // Truck fuel efficiency
    fuelPrice = 4.50, // Price per gallon
  } = options;
  
  const gallons = distance / mpg;
  const cost = gallons * fuelPrice;
  
  return {
    gallons: Math.round(gallons * 10) / 10,
    cost: Math.round(cost * 100) / 100,
    distance,
    mpg,
    fuelPrice,
  };
}

/**
 * Estimate delivery time considering traffic
 * @param {number} baseDuration - Base duration in minutes
 * @param {Date} departureTime - Departure time
 * @returns {Object} - Estimated arrival time and window
 */
export function estimateDeliveryTime(baseDuration, departureTime = new Date()) {
  const hour = departureTime.getHours();
  
  // Traffic multipliers by hour
  let trafficMultiplier = 1.0;
  if (hour >= 7 && hour <= 9) trafficMultiplier = 1.4; // Morning rush
  else if (hour >= 16 && hour <= 18) trafficMultiplier = 1.5; // Evening rush
  else if (hour >= 11 && hour <= 13) trafficMultiplier = 1.2; // Lunch
  else if (hour >= 22 || hour <= 5) trafficMultiplier = 0.9; // Night
  
  const adjustedDuration = baseDuration * trafficMultiplier;
  const arrivalTime = new Date(departureTime.getTime() + adjustedDuration * 60000);
  
  // Add buffer for delivery window
  const windowStart = new Date(arrivalTime.getTime() - 15 * 60000);
  const windowEnd = new Date(arrivalTime.getTime() + 30 * 60000);
  
  return {
    duration: Math.round(adjustedDuration),
    arrivalTime,
    window: {
      start: windowStart,
      end: windowEnd,
    },
    trafficMultiplier,
  };
}

export default {
  getMapboxToken,
  MAP_STYLES,
  DEFAULT_MAP_CONFIG,
  calculateDistance,
  geocodeAddress,
  reverseGeocode,
  getRouteDirections,
  getTrafficRoute,
  optimizeRoute,
  getIsochrone,
  getDistanceMatrix,
  searchPlaces,
  getStaticMapUrl,
  calculateDeliveryCost,
  calculateFuelCost,
  estimateDeliveryTime,
};
