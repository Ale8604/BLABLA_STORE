import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlus, FaTimes, FaMagic } from 'react-icons/fa';
import { useProducts } from '../../../components/context/ProductsContext';
import styles from './CrearProducto.module.css';

const CATEGORIAS  = ['Teléfonos', 'Accesorios', 'Repuestos'];
const MARCAS = [
  'Apple (iPhone)', 'Samsung', 'Xiaomi', 'Redmi', 'Motorola',
  'Huawei', 'OPPO', 'OnePlus', 'Realme', 'Vivo',
  'Google Pixel', 'Sony', 'Nokia', 'LG', 'Tecno',
  'Infinix', 'ZTE', 'Asus', 'BlackBerry', 'Otra',
];
const CONDICIONES = ['Nuevo', 'Reacondicionado'];

const SLOTS = 6;

const emptyForm = {
  name: '', price: '', code: '', stock: '',
  description: '', specs: '',
  category: 'Teléfonos', brand: 'Iphone',
  active: true, condition: 'Nuevo',
  entrada: 30, meses: 24,
  ram: [], storage: [],
  ramInput: '', storageInput: '',
  images: Array(SLOTS).fill(null),
  colors: Array(SLOTS).fill('#000000'),
};

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

const blobToBase64 = (url) => {
  if (!url || !url.startsWith('blob:')) return Promise.resolve(url);
  return fetch(url)
    .then(r => r.blob())
    .then(blob => new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    }));
};

const CrearProducto = () => {
  const { addProduct, updateProduct, products } = useProducts();
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const editId     = params.get('edit');

  const [form, setForm]         = useState(emptyForm);
  const [removing, setRemoving] = useState(Array(SLOTS).fill(false));
  const dragIndex = useRef(null);
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');

  // Restaurar draft al montar (solo si no estamos editando un producto existente)
  useEffect(() => {
    if (!editId) {
      const draft = localStorage.getItem('crearProducto_draft');
      if (draft) {
        try { setForm(prev => ({ ...prev, ...JSON.parse(draft) })); } catch {}
      }
    }
  }, []);

  // Guardar draft en cada cambio (sin imágenes — los blob URLs no sobreviven el refresh)
  useEffect(() => {
    if (!editId) {
      const { images, ...textFields } = form;
      localStorage.setItem('crearProducto_draft', JSON.stringify(textFields));
    }
  }, [form, editId]);

  useEffect(() => {
    if (editId) {
      const found = products.find(p => p.id === Number(editId));
      if (found) {
        setForm({
          name: found.name, price: found.price, code: found.code,
          stock: found.stock, description: found.description,
          specs: found.specs, category: found.category || 'Teléfonos',
          brand: found.brand, active: found.active,
          condition: found.condition,
          entrada: found.entrada ?? 30, meses: found.meses ?? 24,
          ram: found.ram || [], storage: found.storage || [],
          ramInput: '', storageInput: '',
          images: (found.colorVariants?.length
            ? found.colorVariants.map(v => v.image)
            : [found.image]).concat(Array(SLOTS).fill(null)).slice(0, SLOTS),
          colors: (found.colorVariants?.length
            ? found.colorVariants.map(v => v.color)
            : ['#000000']).concat(Array(SLOTS).fill('#000000')).slice(0, SLOTS),
        });
      }
    }
  }, [editId, products]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageSlot = async (index, file) => {
    const updated = [...form.images];
    updated[index] = file ? await compressImage(file) : null;
    const compacted = updated.filter(Boolean);
    while (compacted.length < 3) compacted.push(null);
    setForm(prev => ({ ...prev, images: compacted }));
  };

  const handleConfirm = async () => {
    if (!form.name || !form.price || !form.code) {
      setApiError('Nombre, precio y código son obligatorios.');
      return;
    }
    setSaving(true);
    setApiError('');
    try {
      const colorVariants = await Promise.all(
        form.images
          .map((img, i) => img ? { color: form.colors[i], image: img } : null)
          .filter(Boolean)
          .map(async v => ({ color: v.color, image: await blobToBase64(v.image) }))
      );
      const image = colorVariants[0]?.image || '';

      const payload = {
        name:      form.name,
        price:     Number(form.price),
        stock:     Number(form.stock),
        code:      form.code,
        description: form.description,
        specs:     form.specs,
        category:  form.category,
        brand:     form.brand,
        active:    form.active,
        condition: form.condition,
        image,
        colorVariants,
        ram:     form.ram,
        storage: form.storage,
        entrada: Number(form.entrada),
        meses:   Number(form.meses),
        monthly: Number(((Number(form.price) * (1 - Number(form.entrada) / 100)) / Number(form.meses)).toFixed(2)),
      };

      if (editId) {
        await updateProduct(Number(editId), payload);
      } else {
        await addProduct(payload);
      }
      localStorage.removeItem('crearProducto_draft');
      navigate('/admin/inventario');
    } catch (err) {
      setApiError(err.message || 'Error al guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBg = async (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const imgUrl = form.images[index];
    if (!imgUrl) return;
    setRemoving(prev => { const u = [...prev]; u[index] = true; return u; });
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob   = await removeBackground(imgUrl, { model: 'small', debug: false });
      const newUrl = URL.createObjectURL(blob);
      setForm(prev => {
        const imgs = [...prev.images];
        imgs[index] = newUrl;
        return { ...prev, images: imgs };
      });
    } catch (err) {
      console.error('Error removing background:', err);
    } finally {
      setRemoving(prev => { const u = [...prev]; u[index] = false; return u; });
    }
  };

  const handleColorChange = (index, value) => {
    const updated = [...form.colors];
    updated[index] = value;
    setForm(prev => ({ ...prev, colors: updated }));
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
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(field, inputField, form[inputField]);
    }
    if (e.key === 'Backspace' && !form[inputField] && form[field].length)
      removeTag(field, form[field].at(-1));
  };

  const handleDragStart = (i) => { dragIndex.current = i; };

  const handleDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    setForm(prev => {
      const imgs   = [...prev.images];
      const cols   = [...prev.colors];
      [imgs[from],   imgs[i]]   = [imgs[i],   imgs[from]];
      [cols[from],   cols[i]]   = [cols[i],   cols[from]];
      return { ...prev, images: imgs, colors: cols };
    });
    dragIndex.current = null;
  };

  const handleClear = () => {
    setForm(emptyForm);
    setApiError('');
    localStorage.removeItem('crearProducto_draft');
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>{editId ? 'Editar Producto' : 'Crear Producto'}</h2>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h3>

        {/* Imágenes */}
        <div className={styles.imageRow}>
          {form.images.slice(0, Math.min(SLOTS, Math.max(3, form.images.filter(Boolean).length + 1))).map((img, i) => (
            <div
              key={i}
              className={styles.imageSlotWrapper}
              draggable={!!form.images[i]}
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(i)}
            >
              <label className={`${styles.imageSlot} ${form.images[i] ? styles.imageSlotDraggable : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={e => handleImageSlot(i, e.target.files[0])}
                />
                {img ? (
                  <>
                    <img src={img} alt="" className={styles.preview} />
                    <button
                      className={styles.removeImg}
                      onClick={e => { e.preventDefault(); handleImageSlot(i, null); }}
                    >
                      <FaTimes size={10} />
                    </button>
                    <button
                      className={styles.removeBgBtn}
                      onClick={e => handleRemoveBg(i, e)}
                      disabled={removing[i]}
                    >
                      <FaMagic size={10} />
                      Quitar fondo
                    </button>
                    {removing[i] && (
                      <div className={styles.removingOverlay}>
                        <div className={styles.spinner} />
                        Procesando…
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.imagePlaceholder}>
                    {i < Math.min(SLOTS, Math.max(3, form.images.filter(Boolean).length + 1)) - 1 ? (
                      <span className={styles.placeholderText}>Foto del producto</span>
                    ) : (
                      <>
                        <div className={styles.placeholderCircle}>
                          <FaPlus size={20} />
                        </div>
                        <span className={styles.placeholderText}>Agregar Imagen</span>
                      </>
                    )}
                  </div>
                )}
              </label>
              {img && (
                <div className={styles.colorPickerRow}>
                  <label className={styles.colorSwatch} style={{ backgroundColor: form.colors[i] }}>
                    <input
                      type="color"
                      value={form.colors[i]}
                      onChange={e => handleColorChange(i, e.target.value)}
                      className={styles.colorInputHidden}
                    />
                  </label>
                  <span className={styles.colorLabel}>Color variante</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Campos principales */}
        <div className={styles.fieldsGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nombre Del Producto</label>
            <input className={styles.input} placeholder="Ingresar Nombre" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Precio ($)</label>
            <input className={styles.input} type="number" placeholder="0.00$" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Codigo</label>
            <input className={styles.input} placeholder="Ingresar Código" value={form.code} onChange={e => set('code', e.target.value)} />
          </div>
        </div>

        <div className={styles.fieldsGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Stock Disponible</label>
            <input className={styles.input} type="number" placeholder="Ingresa la Cantidad" value={form.stock} onChange={e => set('stock', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Entrada (%)</label>
            <input className={styles.input} type="number" min="0" max="100" placeholder="30" value={form.entrada} onChange={e => set('entrada', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Meses de Cuota</label>
            <input className={styles.input} type="number" min="1" placeholder="24" value={form.meses} onChange={e => set('meses', e.target.value)} />
          </div>
        </div>

        {form.price && form.entrada !== '' && form.meses && (
          <p className={styles.monthlyPreview}>
            Cuota mensual: <strong>
              ${((Number(form.price) * (1 - Number(form.entrada) / 100)) / Number(form.meses)).toFixed(2)}
            </strong> × {form.meses} meses
            {Number(form.entrada) > 0 && ` (entrada del ${form.entrada}%: $${(Number(form.price) * Number(form.entrada) / 100).toFixed(2)})`}
          </p>
        )}

        <div className={styles.textareaRow}>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.label}>Descripción Breve</label>
            <textarea className={styles.textarea} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.label}>Detalles y Especificaciones</label>
            <textarea className={styles.textarea} value={form.specs} onChange={e => set('specs', e.target.value)} />
          </div>
        </div>

        {/* RAM + Storage tags */}
        <div className={styles.fieldsGrid}>
          {[
            { label: 'RAM disponible', field: 'ram', inputField: 'ramInput', placeholder: 'Ej: 8GB  →  Enter' },
            { label: 'Almacenamiento', field: 'storage', inputField: 'storageInput', placeholder: 'Ej: 256GB  →  Enter' },
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
                  className={styles.tagInput}
                  placeholder={form[field].length === 0 ? placeholder : ''}
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
            <label className={styles.label}>Categoria</label>
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
              <button
                className={`${styles.toggle} ${form.active ? styles.toggleOn : ''}`}
                onClick={() => set('active', !form.active)}
              >
                <span className={styles.toggleThumb} />
              </button>
              <span className={styles.toggleLabel}>{form.active ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
        </div>

        {apiError && <p className={styles.errorMsg}>{apiError}</p>}

        {/* Acciones */}
        <div className={styles.actions}>
          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={saving}>
            {saving ? 'Guardando…' : 'Confirmar'}
          </button>
          <button className={styles.clearBtn} onClick={handleClear} disabled={saving}>Limpiar Todo</button>
        </div>
      </div>
    </div>
  );
};

export default CrearProducto;
