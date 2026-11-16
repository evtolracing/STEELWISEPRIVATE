import { createTheme } from '@mui/material/styles'

// The design tokens of the product. Brand: steel blue with an industrial orange accent.
// Phase 9 (design system audit): every colour that carries text is chosen to read at 4.5 to 1 or
// better against what it sits on (WCAG 2.2 AA, 1.4.3). Screens take colours, spacing and radii from
// here, by name, and do not write their own.
export const tokens = {
  brand: { steel: '#1E3A5F', steelLight: '#4A6FA5', steelDark: '#0D1F33', orange: '#FF6B35' },
  // Text on white and on the page background.
  ink: { primary: '#1A1A2E', secondary: '#666687', muted: '#6B6B85' },
  surface: { page: '#F5F7FA', paper: '#FFFFFF', sunken: '#EEF1F6', divider: '#E0E0E9' },
  // One meaning, one colour. `main` reads on white; `tint` is a background that `ink` reads on.
  status: {
    good: { main: '#2E7D32', tint: '#E8F5E9', ink: '#1B5E20' },
    attention: { main: '#A34A00', tint: '#FFF3E0', ink: '#7A3600' },
    problem: { main: '#C62828', tint: '#FDECEA', ink: '#9F1B1B' },
    information: { main: '#0B6FB0', tint: '#E3F2FD', ink: '#01579B' },
    neutral: { main: '#5F6377', tint: '#EEF1F6', ink: '#3D4152' },
  },
  radius: { control: 6, surface: 8, card: 12 },
  // Multiples of the 8px grid, by use.
  space: { page: 3, section: 3, card: 2, field: 2, tight: 1 },
  layout: { drawerWidth: 260, topBarHeight: 64, readableWidth: 1440 },
  focusRing: '2px solid #1E3A5F',
  // The smallest target for a finger (WCAG 2.2 AA, 2.5.8 asks for 24; 40 is used where a hand is busy).
  touchTarget: 40,
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E3A5F',
      light: '#4A6FA5',
      dark: '#0D1F33',
      tint: '#E8EEF6',
      ink: '#0D1F33',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF6B35',
      light: '#FF9066',
      // Orange text on white: 5.6 to 1 (the brand orange itself is 2.8 to 1 and is for fills).
      dark: '#B8400F',
      tint: '#FFF0EA',
      ink: '#B8400F',
      // The brand orange is a light colour: white on it is 2.8 to 1, dark ink is 6.0 to 1.
      contrastText: tokens.ink.primary,
    },
    success: {
      // A background that dark text reads on, and the dark text for it.
      tint: tokens.status.good.tint,
      ink: tokens.status.good.ink,
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    // Darker than the Material default, so warning text and outlined warning chips read on white
    // (5.0 to 1; the default #ED6C02 is 3.1 to 1).
    warning: {
      // A background that dark text reads on, and the dark text for it.
      tint: tokens.status.attention.tint,
      ink: tokens.status.attention.ink,
      main: tokens.status.attention.main,
      light: '#FF9800',
      dark: tokens.status.attention.ink,
      contrastText: '#FFFFFF',
    },
    // Slightly darker than the Material default, so red text reads on its own tint (4.9 to 1).
    error: {
      tint: tokens.status.problem.tint,
      ink: tokens.status.problem.ink,
      main: tokens.status.problem.main,
      light: '#EF5350',
      dark: tokens.status.problem.ink,
      contrastText: '#FFFFFF',
    },
    // 5.4 to 1 on white (the default #0288D1 is 3.9 to 1).
    info: {
      // A background that dark text reads on, and the dark text for it.
      tint: tokens.status.information.tint,
      ink: tokens.status.information.ink,
      main: tokens.status.information.main,
      light: '#03A9F4',
      dark: tokens.status.information.ink,
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#666687',
      // Also used for hints. 5.2 to 1 on white.
      disabled: tokens.ink.muted,
    },
    divider: '#E0E0E9',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1)',
    '0px 2px 4px rgba(0, 0, 0, 0.1)',
    '0px 4px 6px rgba(0, 0, 0, 0.1)',
    '0px 6px 8px rgba(0, 0, 0, 0.1)',
    '0px 8px 12px rgba(0, 0, 0, 0.1)',
    '0px 12px 16px rgba(0, 0, 0, 0.1)',
    '0px 16px 24px rgba(0, 0, 0, 0.1)',
    '0px 20px 28px rgba(0, 0, 0, 0.1)',
    '0px 24px 32px rgba(0, 0, 0, 0.1)',
    '0px 28px 36px rgba(0, 0, 0, 0.1)',
    '0px 32px 40px rgba(0, 0, 0, 0.1)',
    '0px 36px 44px rgba(0, 0, 0, 0.1)',
    '0px 40px 48px rgba(0, 0, 0, 0.1)',
    '0px 44px 52px rgba(0, 0, 0, 0.1)',
    '0px 48px 56px rgba(0, 0, 0, 0.1)',
    '0px 52px 60px rgba(0, 0, 0, 0.1)',
    '0px 56px 64px rgba(0, 0, 0, 0.1)',
    '0px 60px 68px rgba(0, 0, 0, 0.1)',
    '0px 64px 72px rgba(0, 0, 0, 0.1)',
    '0px 68px 76px rgba(0, 0, 0, 0.1)',
    '0px 72px 80px rgba(0, 0, 0, 0.1)',
    '0px 76px 84px rgba(0, 0, 0, 0.1)',
    '0px 80px 88px rgba(0, 0, 0, 0.1)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // A person using a keyboard always sees where they are (2.4.7, 2.4.11).
        '*:focus-visible': { outline: tokens.focusRing, outlineOffset: 2 },
        '.MuiInputBase-input:focus-visible': { outline: 'none' },
        // Reaches the content without tabbing through the menu (2.4.1).
        '.skip-link': {
          position: 'absolute', left: 8, top: -48, zIndex: 2000, padding: '8px 16px', borderRadius: tokens.radius.control,
          background: tokens.brand.steel, color: '#FFFFFF', fontWeight: 600, textDecoration: 'none',
          '&:focus': { top: 8 },
        },
        '.visually-hidden': {
          position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
        },
        // Printing a page prints the page: no menu, no top bar, nothing cut off by a scrolling box.
        // A dialog marked data-print-dialog (a receipt, an order) prints alone.
        '@media print': {
          '.MuiDrawer-root, .MuiAppBar-root, .skip-link, .no-print, .MuiSnackbar-root, nav': { display: 'none !important' },
          'html, body': { background: '#FFFFFF !important' },
          main: { margin: '0 !important', padding: '0 !important', height: 'auto !important', width: '100% !important', overflow: 'visible !important' },
          '.MuiPaper-root': { boxShadow: 'none !important' },
          'body:has([data-print-dialog]) #root': { display: 'none !important' },
          '[data-print-dialog] .MuiDialogActions-root, [data-print-dialog] .MuiBackdrop-root': { display: 'none !important' },
          '[data-print-dialog].MuiDialog-root, [data-print-dialog] .MuiDialog-container': { position: 'static !important', height: 'auto !important', display: 'block !important' },
          '[data-print-dialog] .MuiDialog-paper': { margin: '0 !important', maxWidth: 'none !important', maxHeight: 'none !important', width: '100% !important' },
        },
        // People who ask their device for less motion get none (2.3.3).
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': { animationDuration: '0.01ms !important', animationIterationCount: '1 !important', transitionDuration: '0.01ms !important', scrollBehavior: 'auto !important' },
        },
        // On a touch screen a control is big enough for a finger (2.5.8).
        '@media (pointer: coarse)': {
          '.MuiIconButton-root': { minWidth: tokens.touchTarget, minHeight: tokens.touchTarget },
          '.MuiButton-root': { minHeight: 36 },
          '.MuiChip-clickable, .MuiChip-deletable': { minHeight: 28 },
          '.MuiTableSortLabel-root': { minHeight: 24, minWidth: 24 },
        },
      },
    },
    // The Material default (light text on light grey) is 1.8 to 1.
    MuiAvatar: { styleOverrides: { colorDefault: { backgroundColor: tokens.status.neutral.main, color: '#FFFFFF' } } },
    MuiTooltip: { defaultProps: { arrow: true, enterDelay: 400 } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: tokens.radius.card } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 600, fontSize: '1.125rem' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '12px 24px 16px' } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minHeight: 44 } } },
    MuiLink: { defaultProps: { underline: 'hover' } },
    MuiAlert: { styleOverrides: { root: { borderRadius: tokens.radius.surface } } },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
        },
        textSecondary: { color: '#B8400F' },
        outlinedSecondary: { color: '#B8400F', borderColor: '#E0885F' },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#2A4A70',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        outlinedSecondary: { color: '#B8400F', borderColor: '#E0885F' },
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F5F7FA',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#1A1A2E',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(30, 58, 95, 0.04)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
})

export default theme
