import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaEdit, FaTimes, FaMagic, FaPlus,
  FaCheckCircle, FaExclamationCircle,
} from 'react-icons/fa';
import { useProducts } from '../../../components/context/ProductsContext';
import { uploadImage } from '../../../lib/supabase';
import styles from './EditarProducto.module.css';

const CATEGORIAS  = ['Teléfonos', 'Accesorios', 'Repuestos'];
const MARCAS = [
  'Apple (iPhone)', 'Samsung', 'Xiaomi', 'Redmi', 'Motorola',
  'Huawei', 'OPPO', 'OnePlus', 'Realme', 'Vivo',
  'Google Pixel', 'Sony', 'Nokia', 'LG', 'Tecno',
  'Infinix', 'ZTE', 'Asus', 'BlackBerry', 'Otra',
];
const CONDICIONES = ['Nuevo', 'Reacondicionado'];
const SLOTS = 6;

const compressImage = (file, maxPx = 1200, quality = 0.8) =>
  new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/jpeg', quality);
    };
    img.src = url;
  });

const productToForm = (p) => ({
  name:         p.name        || '',
  price:        p.price       || '',
  code:         p.code?.startsWith('_draft_') ? '' : (p.code || ''),
  description:  p.description || '',
  specs:        p.specs       || '',
  category:     p.category    || 'Teléfonos',
  brand:        p.brand       || 'Apple (iPhone)',
  active:       p.active      ?? true,
  condition:    p.condition   || 'Nuevo',
  entrada:      p.entrada     ?? 30,
  meses:        p.meses       ?? 24,
  ram:          p.ram         || [],
  storage:      p.storage     || [],
  ramInput:     '',
  storageInput: '',
  images: (p.colorVariants?.length
    ? p.colorVariants.map(v => v.image)
    : [p.image]).concat(Array(SLOTS).fill(null)).slice(0, SLOTS),
  colors: (p.colorVariants?.length
    ? p.colorVariants.map(v => v.color)
    : ['#000000']).concat(Array(SLOTS).fill('#000000')).slice(0, SLOTS),
  stocks: (p.colorVariants?.length
    ? p.colorVariants.map(v => v.stock ?? 0)
    : [p.stock ?? 0]).concat(Array(SLOTS).fill(0)).slice(0, SLOTS),
  globalStock: p.colorVariants?.length ? '' : (p.stock ?? ''),
});

const EditarProducto = () => {
  const { activeProducts, archivedProducts, updateProduct } = useProducts();
  const allProducts = [...activeProducts, ...archivedProducts];
  const [params] = useSearchParams();

  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [removing, setRemoving] = useState(Array(SLOTS).fill(false));
  const [toast,    setToast]    = useState(null);
  const workerRef  = useRef(null);
  const formRef    = useRef(null);

  // Auto-select product from URL param ?id=X
  useEffect(() => {
    const id = params.get('id');
    if (!id || allProducts.length === 0) return;
    const found = allProducts.find(p => p.id === Number(id));
    if (found) {
      setSelected(found);
      setForm(productToForm(found));
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [params, allProducts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../../workers/removeBg.worker.js', import.meta.url),
      { type: 'module' }
    );
    return () => workerRef.current?.terminate();
  }, []);

  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  const selectProduct = (p) => {
    setSelected(p);
    setForm(productToForm(p));
    setToast(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const deselect = () => { setSelected(null); setForm(null); };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const hasVariants = form?.images?.some(Boolean);

  const buildColorVariants = async () =>
    await Promise.all(
      form.images
        .map((img, i) => img ? { color: form.colors[i], image: img, stock: Number(form.stocks[i]) || 0 } : null)
        .filter(Boolean)
        .map(async v => ({ color: v.color, image: await uploadImage(v.image), stock: v.stock }))
    );

  const handleImageSlot = async (index, file) => {
    const updated = [...form.images];
    updated[index] = file ? await compressImage(file) : null;
    const compacted = updated.filter(Boolean);
    while (compacted.length < 1) compacted.push(null);
    setForm(prev => ({ ...prev, images: compacted.concat(Array(SLOTS).fill(null)).slice(0, SLOTS) }));
  };

  const handleRemoveBg = async (index, e) => {
    e.preventDefault(); e.stopPropagation();
    const imgUrl = form.images[index];
    if (!imgUrl || !workerRef.current) return;
    setRemoving(prev => { const u = [...prev]; u[index] = true; return u; });
    try {
      const res    = await fetch(imgUrl);
      const blob   = await res.blob();
      const buffer = await blob.arrayBuffer();
      const result = await new Promise((resolve, reject) => {
        const handler = ({ data }) => {
          workerRef.current.removeEventListener('message', handler);
          data.ok ? resolve(data) : reject(new Error(data.error));
        };
        workerRef.current.addEventListener('message', handler);
        workerRef.current.postMessage({ buffer, mimeType: blob.type }, [buffer]);
      });
      const newUrl = URL.createObjectURL(new Blob([result.buffer], { type: result.type }));
      setForm(prev => { const imgs = [...prev.images]; imgs[index] = newUrl; return { ...prev, images: imgs }; });
    } catch (err) { console.error(err); }
    finally { setRemoving(prev => { const u = [...prev]; u[index] = false; return u; }); }
  };

  const handleColorChange = (index, value) => {
    const updated = [...form.colors]; updated[index] = value;
    setForm(prev => ({ ...prev, colors: updated }));
  };

  const handleStockChange = (index, value) => {
    const updated = [...form.stocks]; updated[index] = value;
    setForm(prev => ({ ...prev, stocks: updated }));
  };

  const addTag = (field, inputField, value) => {
    let val = value.trim();
    if (!val) return;
    if (/^\d+$/.test(val)) val = val + 'GB';
    if (form[field].includes(val)) return;
    setForm(prev => ({ ...prev, [field]: [...prev[field], val], [inputField]: '' }));
  };

  const removeTag = (field, value) =>
    setForm(prev => ({ ...prev, [field]: prev[field].filter(v => v !== value) }));

  const handleTagKey = (e, field, inputField) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(field, inputField, form[inputField]); }
    if (e.key === 'Backspace' && !form[inputField] && form[field].length) removeTag(field, form[field].at(-1));
  };

  const handleSave = async () => {
    if (!form.name?.trim() || !Number(form.price) > 0) return;
    setSaving(true);
    try {
      const colorVariants = await buildColorVariants();
      const image         = colorVariants[0]?.image || selected.image || '';
      const totalStock    = colorVariants.length > 0
        ? colorVariants.reduce((s, v) => s + v.stock, 0)
        : Number(form.globalStock) || 0;

      const payload = {
        name:        form.name,
        price:       Number(form.price),
        stock:       totalStock,
        code:        form.code,
        description: form.description,
        specs:       form.specs,
        category:    form.category,
        brand:       form.brand,
        active:      form.active,
        condition:   form.condition,
        image,
        colorVariants,
        ram:         form.ram,
        storage:     form.storage,
        entrada:     Number(form.entrada),
        meses:       Number(form.meses),
        monthly:     Number(((Number(form.price) * (1 - Number(form.entrada) / 100)) / Number(form.meses)).toFixed(2)),
      };

      await updateProduct(selected.id, payload);
      setToast({ ok: true, msg: `"${form.name}" guardado correctamente` });
      setSelected(prev => ({ ...prev, ...payload }));
    } catch (err) {
      setToast({ ok: false, msg: err.message || 'Error al guardar' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const visibleSlots = form
    ? Math.min(SLOTS, Math.max(2, (form.images || []).filter(Boolean).length + 1))
    : 0;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>EDITAR PRODUCTO</h2>

      {/* ── Selector ── */}
      <div className={styles.selectorCard}>
        <div className={styles.selectorTop}>
          <h3 className={styles.cardTitle}>Seleccioná un producto</h3>
          <div className={styles.searchBox}>
            <FaSearch size={13} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar por nombre o código…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.productGrid}>
          {filtered.length === 0 && (
            <p className={styles.emptyMsg}>No se encontraron productos.</p>
          )}
          {filtered.map(p => (
            <button
              key={p.id}
              className={`${styles.productCard} ${selected?.id === p.id ? styles.productCardActive : ''} ${p.archived ? styles.productCardArchived : ''}`}
              onClick={() => selectProduct(p)}
            >
              <img src={p.image || ''} alt={p.name} className={styles.productThumb} />
              <div className={styles.productInfo}>
                <span className={styles.productName}>{p.name}</span>
                <span className={styles.productPrice}>${p.price.toLocaleString()}</span>
                {p.archived && <span className={styles.archivedBadge}>Archivado</span>}
              </div>
              <FaEdit size={14} className={styles.editIcon} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Formulario de edición ── */}
      <AnimatePresence>
        {form && selected && (
          <motion.div
            ref={formRef}
            className={styles.formCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={styles.formHeader}>
              <h3 className={styles.cardTitle}>Editando: <span className={styles.editingName}>{selected.name}</span></h3>
              <button className={styles.closeBtn} onClick={deselect} title="Cerrar">
                <FaTimes size={16} />
              </button>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {toast.ok ? <FaCheckCircle size={14} /> : <FaExclamationCircle size={14} />}
                  {toast.msg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Imágenes + colores */}
            <div className={styles.imageRow}>
              {form.images.slice(0, visibleSlots).map((img, i) => (
                <div key={i} className={styles.imageSlotWrapper}>
                  <label className={styles.imageSlot}>
                    <input
                      type="file" accept="image/*" className={styles.fileInput}
                      onChange={e => handleImageSlot(i, e.target.files[0])}
                    />
                    {img ? (
                      <>
                        <img src={img} alt="" className={styles.preview} />
                        <button className={styles.removeImg} onClick={e => { e.preventDefault(); handleImageSlot(i, null); }}>
                          <FaTimes size={10} />
                        </button>
                        <button className={styles.removeBgBtn} onClick={e => handleRemoveBg(i, e)} disabled={removing[i]}>
                          <FaMagic size={10} /> Quitar fondo
                        </button>
                        {removing[i] && <div className={styles.removingOverlay}><div className={styles.spinner} />Procesando…</div>}
                      </>
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <FaPlus size={18} />
                        <span>Imagen</span>
                      </div>
                    )}
                  </label>
                  {img && (
                    <div className={styles.colorPickerRow}>
                      <label className={styles.colorSwatch} style={{ backgroundColor: form.colors[i] }}>
                        <input type="color" value={form.colors[i]} onChange={e => handleColorChange(i, e.target.value)} className={styles.colorInputHidden} />
                      </label>
                      <input
                        type="number" min="0" className={styles.variantStockInput}
                        placeholder="Stock" value={form.stocks[i]}
                        onChange={e => handleStockChange(i, e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Campos principales */}
            <div className={styles.fieldsGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Nombre</label>
                <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Precio ($)</label>
                <input className={styles.input} type="number" value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Código</label>
                <input className={styles.input} value={form.code} onChange={e => set('code', e.target.value)} />
              </div>
            </div>

            <div className={styles.fieldsGrid}>
              {!hasVariants ? (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Stock</label>
                  <input className={styles.input} type="number" value={form.globalStock} onChange={e => set('globalStock', e.target.value)} />
                </div>
              ) : (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Stock Total</label>
                  <input className={styles.input} type="number" readOnly
                    value={form.stocks.reduce((s, v, i) => s + (form.images[i] ? Number(v) || 0 : 0), 0)}
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  />
                </div>
              )}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Entrada (%)</label>
                <input className={styles.input} type="number" min="0" max="100" value={form.entrada} onChange={e => set('entrada', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Meses de Cuota</label>
                <input className={styles.input} type="number" min="1" value={form.meses} onChange={e => set('meses', e.target.value)} />
              </div>
            </div>

            {form.price && form.entrada !== '' && form.meses && (
              <p className={styles.monthlyPreview}>
                Cuota: <strong>${((Number(form.price) * (1 - Number(form.entrada) / 100)) / Number(form.meses)).toFixed(2)}</strong> × {form.meses} meses
              </p>
            )}

            <div className={styles.textareaRow}>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Descripción</label>
                <textarea className={styles.textarea} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Especificaciones</label>
                <textarea className={styles.textarea} value={form.specs} onChange={e => set('specs', e.target.value)} />
              </div>
            </div>

            {/* RAM + Storage */}
            <div className={styles.fieldsGrid}>
              {[
                { label: 'RAM', field: 'ram', inputField: 'ramInput', placeholder: 'Ej: 8GB → Enter' },
                { label: 'Almacenamiento', field: 'storage', inputField: 'storageInput', placeholder: 'Ej: 256GB → Enter' },
              ].map(({ label, field, inputField, placeholder }) => (
                <div key={field} className={`${styles.fieldGroup} ${styles.spanTwo}`}>
                  <label className={styles.label}>{label}</label>
                  <div className={styles.tagBox}>
                    {form[field].map(tag => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                        <button type="button" className={styles.tagRemove} onClick={() => removeTag(field, tag)}>×</button>
                      </span>
                    ))}
                    <input
                      className={styles.tagInput} placeholder={form[field].length === 0 ? placeholder : ''}
                      value={form[inputField]}
                      onChange={e => set(inputField, e.target.value)}
                      onKeyDown={e => handleTagKey(e, field, inputField)}
                      onBlur={() => addTag(field, inputField, form[inputField])}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Selects + toggle */}
            <div className={styles.bottomRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Categoría</label>
                <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Marca</label>
                <select className={styles.select} value={form.brand} onChange={e => set('brand', e.target.value)}>
                  {MARCAS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Condición</label>
                <select className={styles.select} value={form.condition} onChange={e => set('condition', e.target.value)}>
                  {CONDICIONES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Estado</label>
                <div className={styles.toggleRow}>
                  <button className={`${styles.toggle} ${form.active ? styles.toggleOn : ''}`} onClick={() => set('active', !form.active)}>
                    <span className={styles.toggleThumb} />
                  </button>
                  <span className={styles.toggleLabel}>{form.active ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button className={styles.cancelBtn} onClick={deselect} disabled={saving}>
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditarProducto;
