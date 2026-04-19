import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlus, FaTimes, FaMagic } from 'react-icons/fa';
import { removeBackground } from '@imgly/background-removal';
import { useProducts } from '../../../components/context/ProductsContext';
import styles from './CrearProducto.module.css';

const CATEGORIAS = ['Teléfonos', 'Accesorios', 'Repuestos'];
const MARCAS     = ['Iphone', 'Samsung', 'Redmi', 'Xiaomi', 'Motorola'];

const emptyForm = {
  name: '', price: '', code: '', stock: '',
  description: '', specs: '',
  category: 'Teléfonos', brand: 'Iphone',
  active: true, condition: 'Nuevo',
  images: [null, null, null],
};

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
  const [removing, setRemoving] = useState([false, false, false]);
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (editId) {
      const found = products.find(p => p.id === Number(editId));
      if (found) {
        setForm({
          name: found.name, price: found.price, code: found.code,
          stock: found.stock, description: found.description,
          specs: found.specs, category: found.category || 'Teléfonos',
          brand: found.brand, active: found.active,
          condition: found.condition, images: [found.image, null, null],
        });
      }
    }
  }, [editId, products]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageSlot = (index, file) => {
    const updated = [...form.images];
    updated[index] = file ? URL.createObjectURL(file) : null;
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
      const rawImage = form.images.find(Boolean) || '';
      const image    = await blobToBase64(rawImage);

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
        monthly: Number((Number(form.price) / 24).toFixed(2)),
      };

      if (editId) {
        await updateProduct(Number(editId), payload);
      } else {
        await addProduct(payload);
      }
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
      const blob   = await removeBackground(imgUrl);
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

  const handleClear = () => { setForm(emptyForm); setApiError(''); };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>{editId ? 'Editar Producto' : 'Crear Producto'}</h2>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h3>

        {/* Imágenes */}
        <div className={styles.imageRow}>
          {form.images.map((img, i) => (
            <label key={i} className={styles.imageSlot}>
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
                  {i < 2 ? (
                    <span className={styles.placeholderText}>Tu imagen aquí</span>
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

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Stock Disponible</label>
          <input className={styles.input} type="number" placeholder="Ingresa la Cantidad" value={form.stock} onChange={e => set('stock', e.target.value)} style={{ maxWidth: 220 }} />
        </div>

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
