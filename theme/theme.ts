'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    black: {
      main: '#000000',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    }
  },
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },
});

export default theme;

/**
 * MUI TypeScript Module Augmentation
 *
 * Extends MUI's built-in type definitions to register custom palette colors.
 * This must be co-located with (or imported before) createTheme so TypeScript
 * picks up the declarations when the theme is consumed across the app.
 *
 * Without these declarations, using a custom color (e.g. color="black" on a
 * Button) would produce a TypeScript compile error even if the color exists
 * in the runtime theme object.
 */

/**
 * Registers `black` as a valid palette key in the MUI theme.
 * - `Palette` is used by components when reading colors at runtime.
 * - `PaletteOptions` is used by `createTheme()` when accepting the palette config.
 * Using `Palette['primary']` mirrors the shape of an existing palette color
 * (main, light, dark, contrastText) so no manual type definition is needed.
 */
declare module '@mui/material/styles' {
  interface Palette {
    black: Palette['primary'];
  }
  interface PaletteOptions {
    black?: PaletteOptions['primary'];
  }
}

/**
 * Allows `color="black"` to be passed to any MUI Button component.
 * `ButtonPropsColorOverrides` is an extension map — setting a key to `true`
 * adds it to the union of accepted color values for the Button's `color` prop.
 */
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    black: true;
  }
}
