/**
 * Icon Map — Maps icon name strings from the server to MUI icon components.
 * This allows the backend to store icon names as strings while the frontend
 * resolves them to actual React components dynamically.
 */

import ContentCut from '@mui/icons-material/ContentCut'
import Settings from '@mui/icons-material/Settings'
import LocalShipping from '@mui/icons-material/LocalShipping'
import Water from '@mui/icons-material/Water'
import BuildCircle from '@mui/icons-material/BuildCircle'
import Router from '@mui/icons-material/Router'
import Straighten from '@mui/icons-material/Straighten'
import AlignVerticalBottom from '@mui/icons-material/AlignVerticalBottom'
import GridOn from '@mui/icons-material/GridOn'
import FlashOn from '@mui/icons-material/FlashOn'
import FactCheck from '@mui/icons-material/FactCheck'
import Inventory2 from '@mui/icons-material/Inventory2'
import Build from '@mui/icons-material/Build'
import CallSplit from '@mui/icons-material/CallSplit'
import AutoFixHigh from '@mui/icons-material/AutoFixHigh'
import Carpenter from '@mui/icons-material/Carpenter'
import Handyman from '@mui/icons-material/Handyman'
import PrecisionManufacturing from '@mui/icons-material/PrecisionManufacturing'
import Construction from '@mui/icons-material/Construction'
import Engineering from '@mui/icons-material/Engineering'
import Science from '@mui/icons-material/Science'
import Speed from '@mui/icons-material/Speed'
import Warehouse from '@mui/icons-material/Warehouse'
import ViewInAr from '@mui/icons-material/ViewInAr'
import Hub from '@mui/icons-material/Hub'
import Memory from '@mui/icons-material/Memory'
import Layers from '@mui/icons-material/Layers'
import Category from '@mui/icons-material/Category'
import Tune from '@mui/icons-material/Tune'
import Agriculture from '@mui/icons-material/Agriculture'
import Hardware from '@mui/icons-material/Hardware'
import Plumbing from '@mui/icons-material/Plumbing'
import ElectricalServices from '@mui/icons-material/ElectricalServices'
import Factory from '@mui/icons-material/Factory'

/**
 * Map of icon name (string) → MUI Icon Component
 * When adding new work center types, add their icon name here.
 */
export const ICON_MAP = {
  ContentCut,
  Settings,
  LocalShipping,
  Water,
  BuildCircle,
  Router,
  Straighten,
  AlignVerticalBottom,
  GridOn,
  FlashOn,
  FactCheck,
  Inventory2,
  Build,
  CallSplit,
  AutoFixHigh,
  Carpenter,
  Handyman,
  PrecisionManufacturing,
  Construction,
  Engineering,
  Science,
  Speed,
  Warehouse,
  ViewInAr,
  Hub,
  Memory,
  Layers,
  Category,
  Tune,
  Agriculture,
  Hardware,
  Plumbing,
  ElectricalServices,
  Factory,
}

/**
 * All available icon names (for the type editor dropdown)
 */
export const AVAILABLE_ICONS = Object.keys(ICON_MAP)

/**
 * Resolve an icon name to a component, with fallback
 */
export function resolveIcon(iconName) {
  return ICON_MAP[iconName] || ICON_MAP.Settings
}
