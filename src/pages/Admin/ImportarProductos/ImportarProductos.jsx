import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FaFileExcel, FaDownload, FaUpload, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useProducts } from '../../../components/context/ProductsContext';
import styles from './ImportarProductos.module.css';

const MAX_COLORS  = 4;
const NOTIFY_DURATION = 20000;

const COLUMNS = [
  'nombre', 'precio', 'stock_global', 'codigo', 'categoria', 'marca', 'descripcion',
  ...Array.from({ length: MAX_COLORS }, (_, i) => [`color${i + 1}`, `imagen${i + 1}`, `stock${i + 1}`]).flat(),
];

const FIELD_ALIASES = {
  nombre:       ['nombre', 'name', 'producto', 'product', 'titulo', 'title', 'equipo', 'articulo'],
  precio:       ['precio', 'price', 'costo', 'valor', 'cost', 'importe'],
  stock_global: ['stock_global', 'stock', 'cantidad', 'qty', 'quantity', 'inventario', 'existencia'],
  codigo:       ['codigo', 'code', 'sku', 'ref', 'referencia', 'id', 'cod'],
  categoria:    ['categoria', 'category', 'tipo', 'cat', 'type'],
  marca:        ['marca', 'brand', 'fabricante', 'manufacturer'],
  descripcion:  ['descripcion', 'description', 'detalle', 'detail', 'desc', 'nota'],
  color1:       ['color1', 'color_1', 'color 1', 'colour1', 'variante1'],
  imagen1:      ['imagen1', 'image1', 'img1', 'foto1', 'link1', 'url1', 'photo1'],
  stock1:       ['stock1', 'stock_1', 'stock 1', 'cantidad1', 'qty1'],
  color2:       ['color2', 'color_2', 'color 2', 'colour2', 'variante2'],
  imagen2:      ['imagen2', 'image2', 'img2', 'foto2', 'link2', 'url2', 'photo2'],
  stock2:       ['stock2', 'stock_2', 'stock 2', 'cantidad2', 'qty2'],
  color3:       ['color3', 'color_3', 'color 3', 'colour3', 'variante3'],
  imagen3:      ['imagen3', 'image3', 'img3', 'foto3', 'link3', 'url3', 'photo3'],
  stock3:       ['stock3', 'stock_3', 'stock 3', 'cantidad3', 'qty3'],
  color4:       ['color4', 'color_4', 'color 4', 'colour4', 'variante4'],
  imagen4:      ['imagen4', 'image4', 'img4', 'foto4', 'link4', 'url4', 'photo4'],
  stock4:       ['stock4', 'stock_4', 'stock 4', 'cantidad4', 'qty4'],
};

const BASIC_FIELDS = [
  { key: 'nombre',       label: 'Nombre',       required: true  },
  { key: 'precio',       label: 'Precio',        required: true  },
  { key: 'stock_global', label: 'Stock global',  required: false },
  { key: 'codigo',       label: 'Código / SKU',  required: false },
  { key: 'categoria',    label: 'Categoría',     required: false },
  { key: 'marca',        label: 'Marca',         required: false },
  { key: 'descripcion',  label: 'Descripción',   required: false },
];

const autoSuggestMapping = (headers) => {
  const norm = (s) => s.toLowerCase().replace(/[\s_-]/g, '');
  const result = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const match = headers.find(h => aliases.some(alias => norm(h) === norm(alias)));
    result[field] = match || '';
  }
  return result;
};

const buildTemplateWorkbook = () => {
  const header = COLUMNS;
  const example = [
    'iPhone 15 Pro', 1200, 0, 'IPH15P-001', 'Teléfonos', 'Apple (iPhone)',
    'Descripción del producto',
    'Negro',   'https://postimages.org/...', 10,
    'Blanco',  'https://postimages.org/...', 8,
    '', '', 0,
    '', '', 0,
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, example]);
  ws['!cols'] = header.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  return wb;
};

const parseRow = (row) => {
  const get = (key) => (row[key] !== undefined && row[key] !== null) ? row[key] : '';
  const colors = Array.from({ length: MAX_COLORS }, (_, i) => {
    const color = String(get(`color${i + 1}`)).trim();
    const image = String(get(`imagen${i + 1}`)).trim();
    const stock = Number(get(`stock${i + 1}`)) || 0;
    if (!color && !image) return null;
    return { color, image, stock };
  }).filter(Boolean);

  return {
    name:        String(get('nombre')).trim(),
    price:       Number(get('precio')) || 0,
    stock:       colors.length > 0
      ? colors.reduce((s, c) => s + c.stock, 0)
      : Number(get('stock_global')) || 0,
    code:        String(get('codigo')).trim(),
    category:    String(get('categoria')).trim() || 'Teléfonos',
    brand:       String(get('marca')).trim()     || 'Otra',
    description: String(get('descripcion')).trim(),
    colorVariants: colors,
    image:       colors[0]?.image || '',
  };
};

const applyMappingToRow = (raw, mapping) => {
  const out = {};
  for (const [field, col] of Object.entries(mapping)) {
    out[field] = col ? (raw[col] ?? '') : '';
  }
  return out;
};

const ImportarProductos = () => {
  const { activeProducts, addProduct, updateProduct } = useProducts();
  const [rows, setRows]               = useState([]);
  const [fileName, setFileName]       = useState('');
  const [importing, setImporting]     = useState(false);
  const [result, setResult]           = useState(null);
  const [timeLeft, setTimeLeft]       = useState(0);
  const [dragging, setDragging]       = useState(false);
  // mapping step
  const [headers, setHeaders]         = useState([]);
  const [rawData, setRawData]         = useState([]);
  const [mapping, setMapping]         = useState({});
  const [mappingStep, setMappingStep] = useState(false);

  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!result) return;
    setTimeLeft(NOTIFY_DURATION / 1000);
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    timerRef.current = setTimeout(() => {
      setResult(null);
      clearInterval(interval);
    }, NOTIFY_DURATION);
    return () => { clearTimeout(timerRef.current); clearInterval(interval); };
  }, [result]);

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb  = XLSX.read(evt.target.result, { type: 'array' });
      const ws  = wb.Sheets[wb.SheetNames[0]];
      // Read as raw arrays to detect the real header row (skips title rows at top)
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // First row with 2+ non-empty cells is the header row
      let headerIdx = 0;
      for (let i = 0; i < raw.length; i++) {
        if (raw[i].filter(c => c !== '' && c !== null && c !== undefined).length >= 2) {
          headerIdx = i;
          break;
        }
      }

      const hdrs = raw[headerIdx].map((h, i) =>
        h !== '' && h !== null ? String(h).trim() : `Columna_${i + 1}`
      );
      const dataRows = raw.slice(headerIdx + 1).filter(row =>
        row.some(c => c !== '' && c !== null && c !== undefined)
      );
      const data = dataRows.map(row => {
        const obj = {};
        hdrs.forEach((h, i) => { obj[h] = row[i] ?? ''; });
        return obj;
      });

      if (!data.length) return;
      setHeaders(hdrs);
      setRawData(data);
      setMapping(autoSuggestMapping(hdrs));
      setMappingStep(true);
      setRows([]);
      setResult(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFile     = (e) => processFile(e.target.files[0]);
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleApplyMapping = () => {
    const mapped = rawData
      .map(raw => applyMappingToRow(raw, mapping))
      .map(parseRow)
      .filter(r => r.name);
    setRows(mapped);
    setMappingStep(false);
  };

  const handleDownloadTemplate = () => {
    const wb = buildTemplateWorkbook();
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    const created = [], updated = [], skipped = [];

    for (const row of rows) {
      const existing = activeProducts.find(
        p => p.name.toLowerCase() === row.name.toLowerCase()
      );

      if (!existing) {
        try {
          const payload = {
            ...row,
            monthly:   0,
            entrada:   30,
            meses:     24,
            ram:       [],
            storage:   [],
            active:    false,
            condition: 'Nuevo',
            specs:     '',
            draft:     false,
          };
          if (!payload.code) payload.code = `IMP_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          await addProduct(payload);
          created.push(row.name);
        } catch (err) {
          skipped.push({ name: row.name, reason: err.message });
        }
        continue;
      }

      const existingVariants = Array.isArray(existing.colorVariants) ? existing.colorVariants : [];
      const newColors = row.colorVariants.filter(
        v => !existingVariants.some(ev => ev.color.toLowerCase() === v.color.toLowerCase())
      );

      if (newColors.length === 0 && row.colorVariants.length > 0) {
        skipped.push({ name: row.name, reason: 'Todos los colores ya existen' });
        continue;
      }
      if (newColors.length === 0 && row.colorVariants.length === 0) {
        skipped.push({ name: row.name, reason: 'Ya existe sin variantes de color' });
        continue;
      }

      try {
        const mergedVariants = [...existingVariants, ...newColors];
        const newStock = mergedVariants.reduce((s, v) => s + (v.stock ?? 0), 0);
        await updateProduct(existing.id, {
          colorVariants: mergedVariants,
          stock: newStock,
          image: mergedVariants[0]?.image || existing.image,
        });
        updated.push({ name: row.name, added: newColors.map(c => c.color) });
      } catch (err) {
        skipped.push({ name: row.name, reason: err.message });
      }
    }

    setImporting(false);
    setResult({ created, updated, skipped });
    setRows([]);
    setRawData([]);
    setHeaders([]);
    setMapping({});
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const requiredMapped = BASIC_FIELDS.filter(f => f.required).every(f => mapping[f.key]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>IMPORTAR PRODUCTOS</h2>

      {/* Instrucciones + plantilla */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>¿Cómo funciona?</h3>
        <ol className={styles.steps}>
          <li>Subí cualquier Excel con tus productos — el sistema detecta las columnas automáticamente.</li>
          <li>Mapeá cada columna de tu archivo al campo correspondiente.</li>
          <li>Para las imágenes subí cada foto a <strong>postimages.org</strong> y copiá el link directo.</li>
          <li>Si el producto ya existe, solo se agregan los colores nuevos que no estén en la tienda.</li>
        </ol>
        <button className={styles.templateBtn} onClick={handleDownloadTemplate}>
          <FaDownload size={14} /> Descargar plantilla
        </button>
      </div>

      {/* Upload */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Subir archivo Excel</h3>
        <label
          className={`${styles.uploadZone} ${dragging ? styles.uploadZoneDragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className={styles.fileInput}
            onChange={handleFile}
          />
          <FaFileExcel size={36} className={styles.excelIcon} />
          {fileName
            ? <span className={styles.fileName}>{fileName}</span>
            : <><span className={styles.uploadText}>Clic para seleccionar o arrastrá el archivo</span>
               <span className={styles.uploadHint}>.xlsx · .xls · .csv</span></>
          }
        </label>
      </div>

      {/* Mapeo de columnas */}
      {mappingStep && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Mapear columnas — {rawData.length} fila{rawData.length !== 1 ? 's' : ''} detectada{rawData.length !== 1 ? 's' : ''}
          </h3>
          <p className={styles.mappingHint}>
            Asigná cada campo de la tienda a la columna correspondiente de tu Excel.
            Los campos con <span className={styles.required}>*</span> son obligatorios.
          </p>

          <div className={styles.mappingSection}>
            <p className={styles.mappingSectionTitle}>Campos básicos</p>
            <div className={styles.mappingGrid}>
              {BASIC_FIELDS.map(f => (
                <div key={f.key} className={styles.mappingRow}>
                  <label className={styles.mappingLabel}>
                    {f.label}{f.required && <span className={styles.required}> *</span>}
                  </label>
                  <select
                    className={`${styles.mappingSelect} ${f.required && !mapping[f.key] ? styles.mappingSelectError : ''}`}
                    value={mapping[f.key] || ''}
                    onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                  >
                    <option value="">— Sin asignar —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.mappingSection}>
            <p className={styles.mappingSectionTitle}>Colores y variantes (opcional)</p>
            <div className={styles.colorMappingGrid}>
              {Array.from({ length: MAX_COLORS }, (_, i) => (
                <div key={i} className={styles.colorMappingGroup}>
                  <p className={styles.colorGroupLabel}>Color {i + 1}</p>
                  {['color', 'imagen', 'stock'].map(sub => {
                    const key = `${sub}${i + 1}`;
                    const labels = { color: 'Color', imagen: 'Imagen URL', stock: 'Stock' };
                    return (
                      <div key={key} className={styles.mappingRow}>
                        <label className={styles.mappingLabel}>{labels[sub]}</label>
                        <select
                          className={styles.mappingSelect}
                          value={mapping[key] || ''}
                          onChange={e => setMapping(m => ({ ...m, [key]: e.target.value }))}
                        >
                          <option value="">— Sin asignar —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <button
            className={styles.importBtn}
            onClick={handleApplyMapping}
            disabled={!requiredMapped}
          >
            <FaCheck size={13} /> Ver vista previa
          </button>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Vista previa — {rows.length} producto{rows.length !== 1 ? 's' : ''}</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Código</th>
                  <th>Categoría</th>
                  <th>Colores</th>
                  <th>Stock total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const existing = activeProducts.find(
                    p => p.name.toLowerCase() === row.name.toLowerCase()
                  );
                  const existingVariants = Array.isArray(existing?.colorVariants) ? existing.colorVariants : [];
                  const newColors = row.colorVariants.filter(
                    v => !existingVariants.some(ev => ev.color.toLowerCase() === v.color.toLowerCase())
                  );
                  const willSkip = existing && newColors.length === 0;

                  return (
                    <tr key={i} className={willSkip ? styles.rowSkip : existing ? styles.rowUpdate : ''}>
                      <td>{row.name || <span className={styles.empty}>—</span>}</td>
                      <td>${row.price.toLocaleString()}</td>
                      <td className={styles.code}>{row.code || <span className={styles.empty}>auto</span>}</td>
                      <td>{row.category}</td>
                      <td>
                        {row.colorVariants.length > 0
                          ? <div className={styles.colorDots}>
                              {row.colorVariants.map((v, ci) => (
                                <span
                                  key={ci}
                                  className={styles.colorDot}
                                  style={{ backgroundColor: v.color }}
                                  title={`${v.color} · stock: ${v.stock}`}
                                />
                              ))}
                            </div>
                          : <span className={styles.empty}>Sin variantes</span>
                        }
                      </td>
                      <td>{row.stock}</td>
                      <td>
                        {willSkip
                          ? <span className={styles.badgeSkip}>Omitir</span>
                          : existing
                            ? <span className={styles.badgeUpdate}>Actualizar ({newColors.length} color{newColors.length !== 1 ? 'es' : ''})</span>
                            : <span className={styles.badgeNew}>Nuevo</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.previewActions}>
            <button className={styles.backBtn} onClick={() => { setRows([]); setMappingStep(true); }}>
              Volver a mapear
            </button>
            <button
              className={styles.importBtn}
              onClick={handleImport}
              disabled={importing}
            >
              {importing
                ? 'Importando…'
                : <><FaUpload size={14} /> Importar {rows.length} producto{rows.length !== 1 ? 's' : ''}</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <span className={styles.resultTitle}>Resultado de importación</span>
            <span className={styles.resultTimer}>{timeLeft}s</span>
            <button className={styles.resultClose} onClick={() => setResult(null)}>
              <FaTimes size={14} />
            </button>
          </div>

          {result.created.length > 0 && (
            <div className={styles.resultSection}>
              <p className={styles.resultLabel}><FaCheck size={12} /> {result.created.length} creados</p>
              {result.created.map((n, i) => <p key={i} className={styles.resultItem}>{n}</p>)}
            </div>
          )}

          {result.updated.length > 0 && (
            <div className={styles.resultSection}>
              <p className={styles.resultLabel}><FaCheck size={12} /> {result.updated.length} actualizados</p>
              {result.updated.map((u, i) => (
                <p key={i} className={styles.resultItem}>
                  {u.name} <span className={styles.resultSub}>+{u.added.join(', ')}</span>
                </p>
              ))}
            </div>
          )}

          {result.skipped.length > 0 && (
            <div className={styles.resultSection}>
              <p className={`${styles.resultLabel} ${styles.resultLabelWarn}`}>
                <FaExclamationTriangle size={12} /> {result.skipped.length} omitidos
              </p>
              {result.skipped.map((s, i) => (
                <p key={i} className={styles.resultItem}>
                  {s.name} <span className={styles.resultSub}>— {s.reason}</span>
                </p>
              ))}
            </div>
          )}

          <div className={styles.resultProgress}>
            <div
              className={styles.resultProgressBar}
              style={{ animationDuration: `${NOTIFY_DURATION}ms` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportarProductos;
