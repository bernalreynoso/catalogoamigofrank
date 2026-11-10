/**
 * Text and string normalization utilities
 */

const PRESERVED_ACRONYMS = new Set([
  'RAM',
  'SSD',
  'HDD',
  'DDR',
  'DDR3',
  'DDR4',
  'DDR5',
  'M.2',
  'NVME',
  'SATA',
  'SODIMM',
  'DIMM',
  'CPU',
  'GPU',
  'RGB',
  'ARGB',
  'USB',
  'WIFI',
  'WI-FI',
  'LED',
  'OLED',
  'QLED',
  'IPS',
  'VA',
  'ATX',
  'ITX',
  'MATX',
  'SFX',
  'PSU',
  'UPS',
  'LAN',
  'HDMI',
  'DP',
  'FHD',
  '2K',
  '4K',
  'WQHD',
  'AMD',
  'INTEL',
  'NVIDIA',
  'RTX',
  'GTX',
  'RX',
  'XT',
  'XTX',
  'TI',
  'OC',
  'PRO',
  'MAX',
  'PLUS',
  'AI',
  'PC',
]);

const LOWERCASE_PARTICLES = new Set([
  'de',
  'del',
  'la',
  'el',
  'las',
  'los',
  'y',
  'en',
  'con',
  'por',
  'para',
  'o',
  'a',
]);

/**
 * Converts ANY ExcelJS cell value to plain text.
 * ExcelJS returns objects (not strings) for rich text, formulas, hyperlinks
 * and errors; calling .toString() on them yields "[object Object]".
 */
export function valueToText(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toLocaleDateString('es-MX');
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) {
      return v.richText.map((t: any) => (t && t.text != null ? String(t.text) : '')).join('');
    }
    if ('result' in v) return valueToText(v.result);
    if ('text' in v) return valueToText(v.text);
    if ('hyperlink' in v) return String(v.hyperlink);
  }
  return '';
}

/**
 * Removes extra whitespaces and trims
 */
export function cleanWhitespace(str: string | null | undefined): string {
  if (!str) return '';
  return str.toString().replace(/\s+/g, ' ').trim();
}

/**
 * Formats category names into Title Case while preserving key tech acronyms
 * Example: "TARJETAS MADRE" -> "Tarjetas Madre"
 * "MEMORIA RAM DDR5" -> "Memoria RAM DDR5"
 * "SSD M.2 NVME" -> "SSD M.2 NVMe"
 */
export function formatCategoryTitle(rawName: string): string {
  const cleaned = cleanWhitespace(rawName);
  if (!cleaned) return 'Sin Categoría';

  const words = cleaned.split(' ');
  const formattedWords = words.map((word, index) => {
    // Check if word contains punctuation like M.2
    const cleanWord = word.replace(/[^a-zA-Z0-9.-]/g, '');
    const upperWord = cleanWord.toUpperCase();

    // Check special handling
    if (upperWord === 'M.2') return 'M.2';
    if (upperWord === 'NVME') return 'NVMe';
    if (upperWord === 'WI-FI') return 'Wi-Fi';
    if (upperWord === 'WIFI') return 'Wi-Fi';

    // Exact acronym match
    if (PRESERVED_ACRONYMS.has(upperWord)) {
      return upperWord;
    }

    // Lowercase particles if not first word
    const lowerWord = cleanWord.toLowerCase();
    if (index > 0 && LOWERCASE_PARTICLES.has(lowerWord)) {
      return lowerWord;
    }

    // Capitalize first letter, lowercase rest
    if (word.length <= 1) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formattedWords.join(' ');
}

/**
 * Unifies brand casing based on the most frequent occurrence in the dataset
 */
export function unifyBrandCasing(rawBrands: string[]): Record<string, string> {
  const counts: Record<string, Record<string, number>> = {};

  for (const b of rawBrands) {
    const cleaned = cleanWhitespace(b);
    if (!cleaned) continue;

    const key = cleaned.toLowerCase();
    if (!counts[key]) {
      counts[key] = {};
    }
    counts[key][cleaned] = (counts[key][cleaned] || 0) + 1;
  }

  const unifiedMapping: Record<string, string> = {};

  for (const [key, variants] of Object.entries(counts)) {
    let mostFrequent = '';
    let maxCount = -1;

    for (const [variant, count] of Object.entries(variants)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = variant;
      }
    }

    unifiedMapping[key] = mostFrequent;
  }

  return unifiedMapping;
}

/**
 * Normalizes text for accent-insensitive and case-insensitive search
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Formats a number as a currency string ($#,##0.00)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0.00';
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats date value from cell D2 (could be Date, Excel serial number, or string)
 */
export function formatListDate(cellValue: any): string {
  if (!cellValue) return '';

  if (cellValue instanceof Date) {
    return cellValue.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // If number (Excel serial date)
  if (typeof cellValue === 'number' && cellValue > 20000 && cellValue < 60000) {
    // Excel base date is Dec 30, 1899
    const date = new Date(Math.round((cellValue - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }

  const str = cleanWhitespace(valueToText(cellValue));
  return str;
}
