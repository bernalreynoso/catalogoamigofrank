import ExcelJS from 'exceljs';

/**
 * Creates a realistic supplier .xlsx workbook buffer matching the exact specifications:
 * - Sheet "IMPORTANTE" with date in D2
 * - Sheet "Productos" with categories (solid fill in A/B, no price in C)
 * - Products with normal, pink (omitted), peach (warning), and missing price cells
 * - Other sheets like "Ensambles" and "REMATES" to verify sheet ignoring
 */
export async function createSampleWorkbookBuffer(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Distribuidor Mayorista';

  // 1. Sheet "IMPORTANTE"
  const wsImportante = wb.addWorksheet('IMPORTANTE');
  wsImportante.getCell('A1').value = 'INFORMACIÓN DE VIGENCIA';
  wsImportante.getCell('D1').value = 'FECHA DE EMISIÓN:';
  wsImportante.getCell('D2').value = '20 de Octubre 2026';

  // 2. Extra sheets that must be ignored
  const wsEnsambles = wb.addWorksheet('Ensambles');
  wsEnsambles.getCell('A1').value = 'Paquetes armados (Ignorar)';
  const wsRemates = wb.addWorksheet('REMATES');
  wsRemates.getCell('A1').value = 'Liquidaciones (Ignorar)';

  // 3. Main Sheet "Productos"
  const wsProductos = wb.addWorksheet('Productos');

  // Category header fill styles (Solid non-white color)
  const categoryFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }, // Soft blue header fill
  };

  const categoryFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FF000000' },
  };

  const normalFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 10,
    color: { argb: 'FF000000' },
  };

  // Known pinks: FFF4CCCC, FFE6B8AF
  const pinkFont1: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 10,
    color: { argb: 'FFF4CCCC' }, // Light pink
  };

  const pinkFont2: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 10,
    color: { argb: 'FFE6B8AF' }, // Salmon pink
  };

  // Peach warning: FFFCE5CD
  const peachFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 10,
    color: { argb: 'FFFCE5CD' }, // Peach
  };

  let currentRow = 1;

  interface SampleCategory {
    name: string;
    items: {
      brand: string;
      name: string;
      price: number | null;
      fontType: 'normal' | 'pink1' | 'pink2' | 'peach' | 'white';
      note?: string;
    }[];
  }

  const sampleCategories: SampleCategory[] = [
    {
      name: 'PROCESADORES',
      items: [
        { brand: 'AMD', name: 'Ryzen 5 7600 6-Core 3.8GHz AM5', price: 3450, fontType: 'normal', note: 'Incluye disipador Wraith Stealth y gráficos Radeon' },
        { brand: 'AMD', name: 'Ryzen 7 7800X3D 8-Core 4.2GHz AM5', price: 7990, fontType: 'normal' },
        { brand: 'Intel', name: 'Core i5-14600K 14-Core 3.5GHz LGA1700', price: 5490, fontType: 'peach', note: 'Pocas piezas en bodega' },
        { brand: 'Intel', name: 'Core i7-14700KF 20-Core 3.4GHz LGA1700', price: 7350, fontType: 'normal' },
        { brand: 'Intel', name: 'Core i3-12100 4-Core 3.3GHz LGA1700', price: 1850, fontType: 'normal', note: 'Gráficos Intel UHD 730' },
        { brand: 'AMD', name: 'Ryzen 5 5600G 6-Core 3.9GHz AM4', price: 2390, fontType: 'normal', note: 'Gráficos Vega 7 integrados' },
        { brand: 'Intel', name: 'Core i9-14900KS Edición Especial', price: 12500, fontType: 'pink1', note: 'Sin existencias' },
        { brand: 'AMD', name: 'Ryzen 9 7950X 16-Core 4.5GHz', price: null, fontType: 'normal' },
      ],
    },
    {
      name: 'TARJETAS MADRE',
      items: [
        { brand: 'MSI', name: 'PRO B840M-B M.2 X 2,', price: 1370, fontType: 'normal' },
        { brand: 'ASUS', name: 'PRIME B650M-A AX II Wi-Fi DDR5', price: 2890, fontType: 'normal' },
        { brand: 'ASUS', name: 'ROG STRIX B650-A GAMING WIFI', price: 4650, fontType: 'normal', note: 'Base de regalo' },
        { brand: 'MSI', name: 'B760 GAMING PLUS WIFI DDR5', price: 3190, fontType: 'peach' },
        { brand: 'Gigabyte', name: 'B550M DS3H AC DDR4', price: 1750, fontType: 'normal' },
        { brand: 'Gigabyte', name: 'Z790 AORUS ELITE AX ICE', price: 5690, fontType: 'pink2' },
        { brand: 'ASRock', name: 'B650M-HDV/M.2 DDR5', price: 1980, fontType: 'normal' },
      ],
    },
    {
      name: 'MEMORIA RAM DDR5',
      items: [
        { brand: 'Kingston', name: 'Fury Beast Black 32GB (2x16GB) DDR5 6000MHz', price: 2150, fontType: 'normal' },
        { brand: 'Kingston', name: 'Fury Renegade Silver RGB 32GB DDR5 6400MHz', price: 2590, fontType: 'normal' },
        { brand: 'Corsair', name: 'Vengeance RGB DDR5 32GB (2x16GB) 6000MHz White', price: 2390, fontType: 'peach', note: 'Edición blanca limitada' },
        { brand: 'ADATA', name: 'XPG Lancer Blade RGB 32GB DDR5 6000MHz', price: 2050, fontType: 'normal' },
        { brand: 'Kingston', name: 'Fury Beast Black 16GB DDR5 5600MHz', price: 1090, fontType: 'normal' },
        { brand: 'Kingston', name: 'Fury Beast 16GB (2x8GB) DDR4 3200MHz', price: 820, fontType: 'normal' },
        { brand: 'Corsair', name: 'SODIMM VENGEANCE 8GB 2400MHZ', price: 990, fontType: 'normal', note: 'Para laptop únicamente' },
        { brand: 'G.Skill', name: 'Trident Z5 Neo RGB 64GB (2x32GB) DDR5 6000MHz', price: 4490, fontType: 'pink1' },
      ],
    },
    {
      name: 'SSD M.2 NVME',
      items: [
        { brand: 'Kingston', name: 'NV2 NVMe PCIe 4.0 1TB M.2 2280', price: 1190, fontType: 'normal' },
        { brand: 'Kingston', name: 'KC3000 PCIe 4.0 NVMe M.2 2TB 7000MB/s', price: 2890, fontType: 'normal' },
        { brand: 'Samsung', name: '990 PRO NVMe M.2 SSD 2TB con Disipador', price: 3790, fontType: 'peach', note: 'Garantía extendida' },
        { brand: 'Western Digital', name: 'WD Black SN850X 1TB M.2 PCIe Gen4', price: 1750, fontType: 'normal' },
        { brand: 'ADATA', name: 'CASE EC680 M.2 NVME USB C 3.2 (10 Gbps)', price: 280, fontType: 'normal', note: 'Carcasa externa para disco' },
        { brand: 'Crucial', name: 'T500 PCIe Gen4 NVMe M.2 2TB', price: 3200, fontType: 'pink2' },
        { brand: 'Adata', name: 'Legend 800 2TB PCIe Gen4 x4 M.2', price: null, fontType: 'normal' },
      ],
    },
    {
      name: 'TARJETAS DE VIDEO',
      items: [
        { brand: 'ASUS', name: 'Dual GeForce RTX 4060 EVO OC 8GB GDDR6', price: 5890, fontType: 'normal' },
        { brand: 'MSI', name: 'GeForce RTX 4070 SUPER 12G VENTUS 2X OC', price: 11990, fontType: 'normal', note: 'Juego incluido por cupón' },
        { brand: 'Gigabyte', name: 'Radeon RX 7800 XT GAMING OC 16GB', price: 10450, fontType: 'peach' },
        { brand: 'ASUS', name: 'TUF Gaming GeForce RTX 4080 SUPER 16GB OC', price: 21900, fontType: 'pink1' },
        { brand: 'PNY', name: 'GeForce RTX 4060 Ti 8GB Verto Dual Fan', price: 6990, fontType: 'normal' },
      ],
    },
    {
      name: 'GABINETES',
      items: [
        { brand: 'NZXT', name: 'H5 Flow RGB Mid-Tower Negro Vidrio Templado', price: 1790, fontType: 'normal' },
        { brand: 'Acteck', name: 'Performance Micro III ATX 500W GI210M', price: 360, fontType: 'normal' },
        { brand: 'Lian Li', name: 'O11 Dynamic EVO RGB Blanco', price: 3450, fontType: 'normal' },
        { brand: 'DeepCool', name: 'CC560 V2 Con 4 Ventiladores LED', price: 990, fontType: 'normal' },
        { brand: 'Corsair', name: '4000D Airflow Tempered Glass Black', price: 1690, fontType: 'peach' },
      ],
    },
    {
      name: 'FUENTES DE PODER',
      items: [
        { brand: 'DeepCool', name: 'PK550D 550W 80 Plus Bronze', price: 920, fontType: 'normal' },
        { brand: 'Corsair', name: 'RM750e 750W 80 Plus Gold Modular ATX 3.0', price: 1990, fontType: 'normal' },
        { brand: 'MSI', name: 'MAG A850GL PCIE5 850W 80 Plus Gold', price: 2190, fontType: 'normal' },
        { brand: 'XPG', name: 'Core Reactor II 850W 80 Plus Gold Modular', price: 2050, fontType: 'pink1' },
      ],
    },
    {
      name: 'ENFRIAMIENTO Y ACCESORIOS',
      items: [
        { brand: 'Cooler Master', name: 'Enfriamiento Liquido 360 CORE II ARGB NEGRO promo', price: 1050, fontType: 'normal', note: 'Sistema líquido AIO para CPU' },
        { brand: 'DeepCool', name: 'AG400 Digital ARGB Disipador CPU', price: 540, fontType: 'normal' },
        { brand: 'XCASE', name: 'Convertidor de corriente Molex a Sata', price: 20, fontType: 'normal', note: 'Cable adaptador de corriente' },
      ],
    },
  ];

  for (const cat of sampleCategories) {
    // 1. Write Category Header row
    const catRow = wsProductos.getRow(currentRow);
    catRow.getCell(1).value = '';
    catRow.getCell(2).value = cat.name;
    catRow.getCell(3).value = null; // No price in C

    // Solid fill on A and B
    catRow.getCell(1).fill = categoryFill;
    catRow.getCell(2).fill = categoryFill;
    catRow.getCell(2).font = categoryFont;
    currentRow++;

    // 2. Write Product Rows
    for (const item of cat.items) {
      const prodRow = wsProductos.getRow(currentRow);
      prodRow.getCell(1).value = item.brand;
      prodRow.getCell(2).value = item.name;

      if (item.price !== null) {
        prodRow.getCell(3).value = item.price;
        // Formula in D: =C{row}*1.02
        prodRow.getCell(4).value = { formula: `C${currentRow}*1.02`, result: item.price * 1.02 };
      } else {
        prodRow.getCell(3).value = '';
        prodRow.getCell(4).value = '';
      }

      if (item.note) {
        prodRow.getCell(5).value = item.note;
      }

      // Apply font styling according to item type
      let font = normalFont;
      if (item.fontType === 'pink1') font = pinkFont1;
      else if (item.fontType === 'pink2') font = pinkFont2;
      else if (item.fontType === 'peach') font = peachFont;

      prodRow.getCell(1).font = normalFont;
      prodRow.getCell(2).font = normalFont;
      prodRow.getCell(3).font = font;
      prodRow.getCell(4).font = font;
      prodRow.getCell(5).font = normalFont;

      currentRow++;
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
