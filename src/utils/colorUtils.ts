/**
 * Color analysis utilities for ExcelJS cells
 * Implements exact pink detection with tolerance and warning color checks.
 */

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
}

export function parseArgb(colorObj: any): { argb?: string; theme?: number; rgb?: ColorRGB } {
  if (!colorObj) return {};

  const theme = typeof colorObj.theme === 'number' ? colorObj.theme : undefined;
  let raw = colorObj.argb;

  if (typeof raw !== 'string') {
    return { theme };
  }

  // Clean hex string
  let clean = raw.trim().replace(/^#/, '').toUpperCase();

  // If 6 chars, assume FF alpha
  if (clean.length === 6) {
    clean = 'FF' + clean;
  }

  if (clean.length !== 8) {
    return { argb: clean, theme };
  }

  const a = parseInt(clean.slice(0, 2), 16);
  const r = parseInt(clean.slice(2, 4), 16);
  const g = parseInt(clean.slice(4, 6), 16);
  const b = parseInt(clean.slice(6, 8), 16);

  return {
    argb: clean,
    theme,
    rgb: { r, g, b, a, hex: `#${clean.slice(2)}` },
  };
}

/**
 * Known pink colors:
 * FFF4CCCC, FFE6B8AF (and tolerance rule)
 * Rule: R >= 0xD8 (216), G between 0x90 (144) and 0xD2 (210), B between 0x90 and 0xD2,
 * and (R - G) >= 20 and (R - B) >= 20.
 */
export function isPinkColor(colorObj: any): boolean {
  if (!colorObj) return false;
  const { argb, rgb } = parseArgb(colorObj);
  if (!argb || !rgb) return false;

  const hex6 = argb.slice(2);
  // Direct matches
  if (
    argb === 'FFF4CCCC' ||
    argb === 'FFE6B8AF' ||
    hex6 === 'F4CCCC' ||
    hex6 === 'E6B8AF'
  ) {
    return true;
  }

  // Tolerance check
  const { r, g, b } = rgb;
  const isRValid = r >= 0xd8; // >= 216
  const isGValid = g >= 0x90 && g <= 0xd2; // 144 to 210
  const isBValid = b >= 0x90 && b <= 0xd2; // 144 to 210
  const isDiffValid = r - g >= 20 && r - b >= 20;

  return isRValid && isGValid && isBValid && isDiffValid;
}

/**
 * Checks if the font color is white / invisible text
 */
export function isWhiteColor(colorObj: any): boolean {
  if (!colorObj) return false;
  const { argb } = parseArgb(colorObj);
  if (!argb) return false;
  return argb === 'FFFFFFFF' || argb === '00FFFFFF' || argb.slice(2) === 'FFFFFF';
}

/**
 * Checks if color is normal (theme, black or very dark grey, or undefined)
 */
export function isNormalOrBlackColor(colorObj: any): boolean {
  if (!colorObj) return true;
  const { argb, theme, rgb } = parseArgb(colorObj);

  // If theme is provided and no explicit argb is set, treat as normal
  if (theme !== undefined && !argb) {
    return true;
  }

  if (!argb || !rgb) return true;

  // Black or dark gray
  const { r, g, b } = rgb;
  if (r < 55 && g < 55 && b < 55) {
    return true;
  }

  return false;
}

/**
 * Checks if color is a warning/peach color:
 * Not black/normal, not pink, not white.
 * Known peach: FFFCE5CD / FCE5CD.
 */
export function isWarningPeachColor(colorObj: any): boolean {
  if (!colorObj) return false;
  if (isPinkColor(colorObj)) return false;
  if (isNormalOrBlackColor(colorObj)) return false;
  if (isWhiteColor(colorObj)) return false;

  // Any other distinct non-black color (e.g. peach, orange, amber)
  return true;
}

/**
 * Checks if a cell has a solid colored fill (distinct from white or none)
 */
export function hasSolidFill(cell: any): boolean {
  if (!cell || !cell.fill) return false;
  const fill = cell.fill;

  if (fill.type !== 'pattern' || fill.pattern === 'none') {
    return false;
  }

  // Check foreground color
  const fg = fill.fgColor;
  if (!fg) return false;

  const { argb, theme, rgb } = parseArgb(fg);

  // If theme is defined and > 0, consider it colored
  if (typeof theme === 'number' && theme > 0) {
    return true;
  }

  // If ARGB is present
  if (argb && rgb) {
    // If not white
    if (argb !== 'FFFFFFFF' && argb !== '00FFFFFF' && argb.slice(2) !== 'FFFFFF') {
      return true;
    }
  }

  return false;
}

/**
 * Formats color for human debug presentation
 */
export function formatColorForDisplay(colorObj: any): string {
  if (!colorObj) return 'Predeterminado (Normal)';
  const { argb, theme, rgb } = parseArgb(colorObj);
  if (theme !== undefined && !argb) {
    return `Theme ${theme}`;
  }
  if (argb && rgb) {
    return `${argb} (#${rgb.hex.replace('#', '')} R:${rgb.r} G:${rgb.g} B:${rgb.b})`;
  }
  return 'Desconocido';
}
