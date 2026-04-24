import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FaFileExcel, FaDownload, FaUpload, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useProducts } from '../../../components/context/ProductsContext';
import { api } from '../../../lib/api';
import styles from './ImportarProductos.module.css';

const CATEGORIAS  = ['Teléfonos', 'Accesorios', 'Repuestos'];
const MAX_COLORS  = 4;
const NOTIFY_DURATION = 20000;

const COLUMNS = [
  'nombre', 'precio', 'stock_global', 'codigo', 'categoria', 'marca', 'descripcion',
  ...Array.from({ length: MAX_COLORS }, (_, i) => [`color${i + 1}`, `imagen${i + 1}`, `stock${i + 1}`]).flat(),
];

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
  const get = (key) => row[key] ?? row[key.toLowerCase()] ?? '';
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

const ImportarProductos = () => {
  const { activeProducts, addProduct, updateProduct } = useProducts();
  const [rows, setRows]         = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult]     = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef  = useRef(null);
  const inputRef  = useRef(null);

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

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb   = XLSX.read(evt.target.result, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setRows(data.map(parseRow).filter(r => r.name));
      setResult(null);
    };
    reader.readAsArrayBuffer(file);
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
        // Nuevo producto
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

      // Producto existente — verificar colores
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

      // Agregar solo los colores nuevos
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
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>IMPORTAR PRODUCTOS</h2>

      {/* Instrucciones + plantilla */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>¿Cómo funciona?</h3>
        <ol className={styles.steps}>
          <li>Descargá la plantilla Excel y completá los datos.</li>
          <li>Para las imágenes subí cada foto a <strong>postimages.org</strong> y copiá el link directo.</li>
          <li>Cada producto puede tener hasta 4 colores con su imagen y stock individual.</li>
          <li>Si el producto ya existe, solo se agregan los colores nuevos que no estén en la tienda.</li>
        </ol>
        <button className={styles.templateBtn} onClick={handleDownloadTemplate}>
          <FaDownload size={14} /> Descargar plantilla
        </button>
      </div>

      {/* Upload */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Subir archivo Excel</h3>
        <label className={styles.uploadZone}>
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
