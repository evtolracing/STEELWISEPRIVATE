import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  ToggleButtonGroup, 
  ToggleButton,
  Tooltip,
  Chip,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Room,
  LocalShipping,
  Warehouse,
  Map as MapIcon,
  Satellite,
  Terrain,
  Traffic,
  ThreeDRotation,
  MyLocation,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Layers,
} from '@mui/icons-material';
import { getMapboxToken, MAP_STYLES } from '../services/mapService';

// Set Mapbox token
mapboxgl.accessToken = getMapboxToken();

const MapComponent = ({
  locations = [],
  routes = [],
  center = [-95.7129, 37.0902],
  zoom = 3.5,
  style = 'streets',
  height = '500px',
  onMarkerClick = null,
  onMapClick = null,
  showControls = true,
  showStyleSwitcher = true,
  show3D = false,
  showTraffic = false,
  interactive = true,
  fitBounds = true,
  padding = 50,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const popupsRef = useRef([]);
  
  const [currentStyle, setCurrentStyle] = useState(style);
  const [is3D, setIs3D] = useState(show3D);
  const [showTrafficLayer, setShowTrafficLayer] = useState(showTraffic);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get style URL from style name
  const getStyleUrl = (styleName) => {
    const styles = {
      streets: MAP_STYLES.STREETS,
      outdoors: MAP_STYLES.OUTDOORS,
      satellite: MAP_STYLES.SATELLITE_STREETS,
      light: MAP_STYLES.LIGHT,
      dark: MAP_STYLES.DARK,
      navigation: MAP_STYLES.NAVIGATION_DAY,
      traffic: MAP_STYLES.TRAFFIC_DAY,
    };
    return styles[styleName] || MAP_STYLES.STREETS;
  };

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getStyleUrl(currentStyle),
      center: center,
      zoom: zoom,
      pitch: is3D ? 45 : 0,
      bearing: 0,
      interactive: interactive,
      attributionControl: false,
    });

    // Add controls
    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
      map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        'top-right'
      );
    }

    // Attribution
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    // Map load event
    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add 3D buildings if enabled
      if (is3D) {
        add3DBuildings();
      }
      
      // Add traffic layer if enabled
      if (showTrafficLayer) {
        addTrafficLayer();
      }
    });

    // Click handler
    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick({
          coordinates: [e.lngLat.lng, e.lngLat.lat],
          point: e.point,
        });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add 3D buildings layer
  const add3DBuildings = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    const layers = map.current.getStyle().layers;
    const labelLayerId = layers.find(
      (layer) => layer.type === 'symbol' && layer.layout['text-field']
    )?.id;

    if (!map.current.getLayer('3d-buildings')) {
      map.current.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6,
          },
        },
        labelLayerId
      );
    }
  }, []);

  // Add traffic layer
  const addTrafficLayer = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (!map.current.getSource('mapbox-traffic')) {
      map.current.addSource('mapbox-traffic', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1',
      });

      map.current.addLayer({
        id: 'traffic-layer',
        type: 'line',
        source: 'mapbox-traffic',
        'source-layer': 'traffic',
        paint: {
          'line-width': 2,
          'line-color': [
            'match',
            ['get', 'congestion'],
            'low', '#2dc4b2',
            'moderate', '#f1f075',
            'heavy', '#e55e5e',
            'severe', '#b42222',
            '#888888',
          ],
        },
      });
    }
  }, []);

  // Remove traffic layer
  const removeTrafficLayer = useCallback(() => {
    if (!map.current) return;
    if (map.current.getLayer('traffic-layer')) {
      map.current.removeLayer('traffic-layer');
    }
    if (map.current.getSource('mapbox-traffic')) {
      map.current.removeSource('mapbox-traffic');
    }
  }, []);

  // Handle style change
  const handleStyleChange = (event, newStyle) => {
    if (newStyle && map.current) {
      setCurrentStyle(newStyle);
      map.current.setStyle(getStyleUrl(newStyle));
      
      // Re-add layers after style change
      map.current.once('style.load', () => {
        if (is3D) add3DBuildings();
        if (showTrafficLayer) addTrafficLayer();
        // Re-add routes
        addRoutes();
      });
    }
  };

  // Toggle 3D
  const toggle3D = () => {
    if (!map.current) return;
    const new3D = !is3D;
    setIs3D(new3D);
    
    map.current.easeTo({
      pitch: new3D ? 45 : 0,
      duration: 500,
    });
    
    if (new3D && mapLoaded) {
      add3DBuildings();
    } else if (map.current.getLayer('3d-buildings')) {
      map.current.removeLayer('3d-buildings');
    }
  };

  // Toggle traffic
  const toggleTraffic = () => {
    const newTraffic = !showTrafficLayer;
    setShowTrafficLayer(newTraffic);
    
    if (newTraffic) {
      addTrafficLayer();
    } else {
      removeTrafficLayer();
    }
  };

  // Update center when it changes
  useEffect(() => {
    if (map.current && center && mapLoaded) {
      map.current.flyTo({ 
        center, 
        zoom: zoom || 10,
        duration: 1500,
        essential: true,
      });
    }
  }, [center, zoom, mapLoaded]);

  // Fit bounds to locations
  useEffect(() => {
    if (!map.current || !mapLoaded || !fitBounds || locations.length === 0) return;

    if (locations.length === 1) {
      map.current.flyTo({
        center: locations[0].coordinates,
        zoom: 14,
        duration: 1500,
      });
    } else if (locations.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(loc => bounds.extend(loc.coordinates));
      
      map.current.fitBounds(bounds, {
        padding: padding,
        duration: 1500,
      });
    }
  }, [locations, mapLoaded, fitBounds, padding]);

  // Add/update markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    popupsRef.current.forEach(popup => popup.remove());
    popupsRef.current = [];

    // Add new markers
    locations.forEach((location) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      
      // Set marker style based on type
      let bgColor = '#757575';
      let icon = '📍';
      let size = 40;
      
      switch (location.type) {
        case 'warehouse':
          bgColor = '#1976d2';
          icon = '🏭';
          size = 44;
          break;
        case 'customer':
          bgColor = '#d32f2f';
          icon = '📍';
          break;
        case 'truck':
          bgColor = '#2e7d32';
          icon = '🚚';
          size = 42;
          break;
        case 'stop':
          bgColor = '#ff9800';
          icon = location.stopNumber || '•';
          break;
        case 'origin':
          bgColor = '#4caf50';
          icon = '🏠';
          break;
        case 'destination':
          bgColor = '#f44336';
          icon = '🎯';
          break;
      }

      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.6}px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid ${bgColor};
        transition: transform 0.2s;
      `;
      
      el.innerHTML = typeof icon === 'number' ? 
        `<span style="font-size: 16px; font-weight: bold; color: ${bgColor};">${icon}</span>` : 
        icon;
      
      el.onmouseenter = () => el.style.transform = 'scale(1.15)';
      el.onmouseleave = () => el.style.transform = 'scale(1)';

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(location.coordinates)
        .addTo(map.current);

      // Add popup
      if (location.name || location.address || location.info) {
        const popupContent = `
          <div style="padding: 8px; min-width: 150px;">
            <strong style="font-size: 14px;">${location.name || 'Location'}</strong>
            ${location.address ? `<p style="margin: 4px 0 0; font-size: 12px; color: #666;">${location.address}</p>` : ''}
            ${location.info ? `<p style="margin: 8px 0 0; font-size: 12px;">${location.info}</p>` : ''}
            ${location.eta ? `<p style="margin: 4px 0 0; font-size: 11px; color: #1976d2;"><b>ETA:</b> ${location.eta}</p>` : ''}
          </div>
        `;
        
        const popup = new mapboxgl.Popup({ 
          offset: 25, 
          closeButton: true,
          closeOnClick: false,
          className: 'mapbox-popup',
        }).setHTML(popupContent);
        
        marker.setPopup(popup);
        popupsRef.current.push(popup);
      }

      // Add click handler
      if (onMarkerClick) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onMarkerClick(location);
        });
      }

      markersRef.current.push(marker);
    });
  }, [locations, onMarkerClick, mapLoaded]);

  // Add routes function
  const addRoutes = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Remove existing route layers
    for (let i = 0; i < 10; i++) {
      if (map.current.getLayer(`route-line-${i}`)) map.current.removeLayer(`route-line-${i}`);
      if (map.current.getLayer(`route-casing-${i}`)) map.current.removeLayer(`route-casing-${i}`);
      if (map.current.getLayer(`route-arrows-${i}`)) map.current.removeLayer(`route-arrows-${i}`);
      if (map.current.getSource(`route-${i}`)) map.current.removeSource(`route-${i}`);
    }

    // Add new routes
    routes.forEach((route, index) => {
      if (!route.geometry) return;

      const sourceId = `route-${index}`;
      const color = route.color || '#1976d2';
      const width = route.width || 5;

      map.current.addSource(sourceId, {
        type: 'geojson',
        data: route.geometry,
      });

      // Route casing (outline)
      map.current.addLayer({
        id: `route-casing-${index}`,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': width + 3,
          'line-opacity': 0.8,
        },
      });

      // Main route line
      map.current.addLayer({
        id: `route-line-${index}`,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': width,
          'line-opacity': 0.9,
        },
      });

      // Direction arrows
      if (route.showArrows !== false) {
        map.current.addLayer({
          id: `route-arrows-${index}`,
          type: 'symbol',
          source: sourceId,
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 100,
            'text-field': '▶',
            'text-size': 12,
            'text-rotate': 0,
            'text-keep-upright': false,
          },
          paint: {
            'text-color': color,
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
          },
        });
      }
    });
  }, [routes]);

  // Add/update routes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (map.current.isStyleLoaded()) {
      addRoutes();
    } else {
      map.current.once('style.load', addRoutes);
    }
  }, [routes, mapLoaded, addRoutes]);

  // Fly to location
  const flyToLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 14,
            duration: 2000,
          });
        },
        (error) => console.error('Geolocation error:', error)
      );
    }
  }, []);

  return (
    <Box sx={{ height, position: 'relative' }}>
      {/* Map container */}
      <Box
        ref={mapContainer}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      />

      {/* Style switcher */}
      {showStyleSwitcher && (
        <Paper
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            p: 0.5,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 1000,
          }}
        >
          <ToggleButtonGroup
            value={currentStyle}
            exclusive
            onChange={handleStyleChange}
            size="small"
          >
            <ToggleButton value="streets">
              <Tooltip title="Streets">
                <MapIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="satellite">
              <Tooltip title="Satellite">
                <Satellite fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="outdoors">
              <Tooltip title="Outdoors">
                <Terrain fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="dark">
              <Tooltip title="Dark Mode">
                <Layers fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      )}

      {/* Additional controls */}
      {showControls && (
        <Paper
          sx={{
            position: 'absolute',
            top: showStyleSwitcher ? 60 : 10,
            left: 10,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 1000,
          }}
        >
          <Tooltip title="3D Buildings" placement="right">
            <IconButton onClick={toggle3D} size="small" color={is3D ? 'primary' : 'default'}>
              <ThreeDRotation fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Traffic" placement="right">
            <IconButton onClick={toggleTraffic} size="small" color={showTrafficLayer ? 'primary' : 'default'}>
              <Traffic fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="My Location" placement="right">
            <IconButton onClick={flyToLocation} size="small">
              <MyLocation fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      )}

      {/* Legend */}
      {locations.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            bottom: 30,
            left: 10,
            p: 1.5,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 1000,
            maxWidth: 180,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
            Legend
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🏭</Box>
              <Typography variant="caption">Warehouse</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #d32f2f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📍</Box>
              <Typography variant="caption">Customer</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🚚</Box>
              <Typography variant="caption">In Transit</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Route info */}
      {routes.length > 0 && routes[0].distance && (
        <Paper
          sx={{
            position: 'absolute',
            bottom: 30,
            right: 10,
            p: 1.5,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 1000,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            Route Info
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={`${routes[0].distance?.toFixed(1)} mi`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={`${Math.round(routes[0].duration || 0)} min`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default MapComponent;
