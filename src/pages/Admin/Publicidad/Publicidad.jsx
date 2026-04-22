import { useState, useMemo } from 'react';
import { FaPlus, FaTimes, FaToggleOn, FaToggleOff, FaTrash, FaTag, FaTimesCircle } from 'react-icons/fa';
import { useBanners } from '../../../components/context/BannersContext';
import { useProducts } from '../../../components/context/ProductsContext';
import { uploadImage } from '../../../lib/supabase';
import styles from './Publicidad.module.css';

const isOfferActive = (p) => {
  if (!p.discountPercent) return false;
  const now = new Date();
  if (p.offerStart && new Date(p.offerStart) > now) return false;
  if (p.offerEnd   && new Date(p.offerEnd)   < now) return false;
  return true;
};

const Publicidad = () => {
  const { banners, addBanner, updateBanner, deleteBanner } = useBanners();
  const { activeProducts, setProductOffer } = useProducts();

  // Banner state
  const [preview, setPreview] = useState(null);
  const [title, setTitle]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Offer state
  const [selectedId,   setSelectedId]   = useState('');
  const [discount,     setDiscount]     = useState('');
  const [offerStart,   setOfferStart]   = useState('');
  const [offerEnd,     setOfferEnd]     = useState('');
  const [offerSaving,  setOfferSaving]  = useState(false);
  const [offerError,   setOfferError]   = useState('');

  const currentOffers = useMemo(
    () => activeProducts.filter(p => p.discountPercent > 0),
    [activeProducts]
  );

  // ── Banner handlers ──
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleAdd = async () => {
    if (!preview) { setError('Seleccioná una imagen.'); return; }
    setSaving(true); setError('');
    try {
      const image = await uploadImage(preview);
      await addBanner({ image, title, active: true, order: banners.length });
      setPreview(null); setTitle('');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleActive = (banner) => updateBanner(banner.id, { active: !banner.active });

  // ── Offer handlers ──
  const handleSaveOffer = async () => {
    if (!selectedId) { setOfferError('Seleccioná un producto.'); return; }
    if (!discount || Number(discount) < 1 || Number(discount) > 90) {
      setOfferError('El descuento debe ser entre 1 y 90%.'); return;
    }
    if (!offerStart || !offerEnd) { setOfferError('Ingresá las fechas de la oferta.'); return; }
    if (new Date(offerEnd) <= new Date(offerStart)) {
      setOfferError('La fecha de fin debe ser posterior al inicio.'); return;
    }
    setOfferSaving(true); setOfferError('');
    try {
      await setProductOffer(Number(selectedId), {
        discountPercent: Number(discount),
        offerStart, offerEnd,
      });
      setSelectedId(''); setDiscount(''); setOfferStart(''); setOfferEnd('');
    } catch (err) { setOfferError(err.message); }
    finally { setOfferSaving(false); }
  };

  const handleRemoveOffer = async (id) => {
    await setProductOffer(id, { discountPercent: null, offerStart: null, offerEnd: null });
  };

  const selectedProduct = activeProducts.find(p => p.id === Number(selectedId));
  const previewPrice = selectedProduct && discount
    ? Math.round(selectedProduct.price * (1 - Number(discount) / 100))
    : null;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>PUBLICIDAD</h2>

      {/* ── Banners ── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Agregar Banner</h3>
        <label className={styles.uploadSlot}>
          <input type="file" accept="image/*" className={styles.fileInput} onChange={handleFile} />
          {preview ? (
            <>
              <img src={preview} alt="" className={styles.uploadPreview} />
              <button className={styles.removePreview} onClick={e => { e.preventDefault(); setPreview(null); }}>
                <FaTimes size={12} />
              </button>
            </>
          ) : (
            <div className={styles.uploadPlaceholder}>
              <FaPlus size={28} />
              <span>Subir imagen</span>
              <small>Recomendado: 1200×375px</small>
            </div>
          )}
        </label>
        <input className={styles.input} placeholder="Título del banner (opcional)" value={title} onChange={e => setTitle(e.target.value)} />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.addBtn} onClick={handleAdd} disabled={saving}>
          {saving ? 'Guardando…' : <><FaPlus size={13} /> Agregar Banner</>}
        </button>
      </div>

      {banners.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Banners actuales</h3>
          <div className={styles.bannerList}>
            {banners.map((banner, i) => (
              <div key={banner.id} className={`${styles.bannerItem} ${!banner.active ? styles.inactive : ''}`}>
                <img src={banner.image} alt="" className={styles.thumb} />
                <div className={styles.bannerInfo}>
                  <span className={styles.bannerTitle}>{banner.title || `Banner ${i + 1}`}</span>
                  <span className={styles.bannerStatus}>{banner.active ? 'Activo' : 'Inactivo'}</span>
                </div>
                <div className={styles.bannerActions}>
                  <button className={styles.toggleBtn} onClick={() => toggleActive(banner)}>
                    {banner.active ? <FaToggleOn size={22} color="#5b7cfa" /> : <FaToggleOff size={22} />}
                  </button>
                  <button className={styles.deleteBtn} onClick={() => deleteBanner(banner.id)}>
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ofertas ── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}><FaTag size={14} style={{ marginRight: 8, color: '#f59e0b' }} />Programar Oferta</h3>

        <div className={styles.offerForm}>
          {/* Selector de producto */}
          <div className={styles.offerField}>
            <label className={styles.offerLabel}>Producto</label>
            <select
              className={styles.select}
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              <option value="">— Seleccioná un producto —</option>
              {activeProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} · ${p.price.toLocaleString()}</option>
              ))}
            </select>
          </div>

          {/* Descuento + preview */}
          <div className={styles.offerRow}>
            <div className={styles.offerField}>
              <label className={styles.offerLabel}>Descuento (%)</label>
              <div className={styles.discountInput}>
                <input
                  type="number"
                  min="1"
                  max="90"
                  placeholder="Ej: 20"
                  className={styles.input}
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                />
                <span className={styles.discountSign}>%</span>
              </div>
            </div>

            {previewPrice !== null && (
              <div className={styles.pricePreview}>
                <span className={styles.priceOld}>${selectedProduct.price.toLocaleString()}</span>
                <span className={styles.priceNew}>${previewPrice.toLocaleString()}</span>
                <span className={styles.badgePreview}>-{discount}%</span>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className={styles.offerRow}>
            <div className={styles.offerField}>
              <label className={styles.offerLabel}>Desde</label>
              <input type="date" className={styles.input} value={offerStart} onChange={e => setOfferStart(e.target.value)} />
            </div>
            <div className={styles.offerField}>
              <label className={styles.offerLabel}>Hasta</label>
              <input type="date" className={styles.input} value={offerEnd} onChange={e => setOfferEnd(e.target.value)} />
            </div>
          </div>

          {offerError && <p className={styles.error}>{offerError}</p>}

          <button className={styles.addBtn} onClick={handleSaveOffer} disabled={offerSaving}>
            {offerSaving ? 'Guardando…' : <><FaTag size={13} /> Programar oferta</>}
          </button>
        </div>
      </div>

      {/* Lista de ofertas activas */}
      {currentOffers.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Ofertas programadas</h3>
          <div className={styles.offerList}>
            {currentOffers.map(p => {
              const active = isOfferActive(p);
              const discounted = Math.round(p.price * (1 - p.discountPercent / 100));
              return (
                <div key={p.id} className={styles.offerItem}>
                  <img src={p.image} alt={p.name} className={styles.offerThumb} />
                  <div className={styles.offerInfo}>
                    <span className={styles.offerName}>{p.name}</span>
                    <span className={styles.offerPrices}>
                      <s>${p.price.toLocaleString()}</s> → <strong>${discounted.toLocaleString()}</strong>
                    </span>
                    <span className={styles.offerDates}>
                      {p.offerStart ? new Date(p.offerStart).toLocaleDateString() : '—'}
                      {' → '}
                      {p.offerEnd ? new Date(p.offerEnd).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className={styles.offerBadgeWrap}>
                    <span className={`${styles.offerStatusDot} ${active ? styles.dotActive : styles.dotPending}`} />
                    <span className={styles.offerBadge}>-{p.discountPercent}%</span>
                  </div>
                  <button className={styles.deleteBtn} onClick={() => handleRemoveOffer(p.id)} title="Eliminar oferta">
                    <FaTimesCircle size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Publicidad;
