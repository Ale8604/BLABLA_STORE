import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaSearch, FaCloudUploadAlt, FaCheckCircle, FaImage, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useProducts } from '../../../components/context/ProductsContext';
import { uploadImage } from '../../../lib/supabase';
import styles from './Fotos.module.css';

const PLACEHOLDER = 'placehold.co';

const isPlaceholder = (url) => !url || url.includes(PLACEHOLDER);

const resizeBlob = (url, maxPx = 1200, quality = 0.88) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => resolve(URL.createObjectURL(b)), 'image/jpeg', quality);
    };
    img.src = url;
  });

const getSlots = (product) => {
  if (product.colorVariants?.length) {
    return product.colorVariants.map((v, i) => ({
      index: i,
      label: v.color || `Variante ${i + 1}`,
      image: v.image,
      type:  'variant',
    }));
  }
  return [{ index: 0, label: 'Principal', image: product.image, type: 'main' }];
};

const needsPhoto = (p) => getSlots(p).some(s => isPlaceholder(s.image));

/* ── Slot individual ── */
const ImageSlot = ({ slot, productId, onUpload, uploading }) => {
  const inputRef   = useRef(null);
  const [drag, setDrag] = useState(false);
  const filled = !isPlaceholder(slot.image);

  const process = async (file) => {
    if (!file?.type.startsWith('image/')) return;
    const blobUrl  = URL.createObjectURL(file);
    const resized  = await resizeBlob(blobUrl);
    URL.revokeObjectURL(blobUrl);
    const publicUrl = await uploadImage(resized);
    URL.revokeObjectURL(resized);
    onUpload(slot.index, slot.type, publicUrl);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    process(e.dataTransfer.files[0]);
  };

  return (
    <div className={styles.slotWrapper}>
      {slot.label && <span className={styles.slotLabel}>{slot.label}</span>}

      <div
        className={`${styles.slot} ${filled ? styles.slotFilled : ''} ${drag ? styles.slotDragging : ''} ${uploading ? styles.slotUploading : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <FaSpinner className={styles.spinner} size={22} />
        ) : filled ? (
          <>
            <img src={slot.image} alt="" className={styles.slotImg} />
            <div className={styles.slotOverlay}>
              <FaCloudUploadAlt size={18} />
              <span>Cambiar</span>
            </div>
          </>
        ) : (
          <div className={styles.slotEmpty}>
            <FaCloudUploadAlt size={22} className={styles.uploadIcon} />
            <span>Subir foto</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={(e) => process(e.target.files[0])}
        />
      </div>
    </div>
  );
};

/* ── Card de producto ── */
const ProductCard = ({ product, uploading, onUpload, done }) => {
  const slots = getSlots(product);

  return (
    <motion.div
      layout
      className={`${styles.card} ${done ? styles.cardDone : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.cardHeader}>
        <p className={styles.cardName}>{product.name}</p>
        <div className={styles.cardMeta}>
          <span className={styles.cardCategory}>{product.category}</span>
          {product.archived && <span className={styles.cardArchived}>Archivado</span>}
          {done && <FaCheckCircle size={14} className={styles.doneIcon} />}
        </div>
      </div>

      <div className={styles.slotsRow}>
        {slots.map((slot) => {
          const key = `${product.id}-${slot.index}`;
          return (
            <ImageSlot
              key={key}
              slot={slot}
              productId={product.id}
              uploading={uploading.has(key)}
              onUpload={(idx, type, url) => onUpload(product, idx, type, url)}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

const PAGE_SIZE = 9;

/* ── Página principal ── */
const Fotos = () => {
  const { products, updateProduct } = useProducts();
  const [search,    setSearch]    = useState('');
  const [showAll,   setShowAll]   = useState(false);
  const [uploading, setUploading] = useState(new Set());
  const [toast,     setToast]     = useState(null);
  const [page,      setPage]      = useState(1);

  const allReal = products.filter(p => !p.draft);

  const filtered = allReal.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = showAll || needsPhoto(p);
    return matchSearch && matchFilter;
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pendingCount = allReal.filter(needsPhoto).length;

  // Reset to page 1 when search/filter changes
  useEffect(() => { setPage(1); }, [search, showAll]);

  const handleUpload = useCallback(async (product, slotIndex, slotType, publicUrl) => {
    const key = `${product.id}-${slotIndex}`;
    setUploading(prev => new Set([...prev, key]));

    try {
      let payload;
      if (slotType === 'variant') {
        const variants = (product.colorVariants || []).map((v, i) =>
          i === slotIndex ? { ...v, image: publicUrl } : v
        );
        payload = { colorVariants: variants, image: variants[0]?.image || publicUrl };
      } else {
        payload = { image: publicUrl };
      }
      await updateProduct(product.id, payload);

      setToast(product.name);
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error('upload error:', err);
    } finally {
      setUploading(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [updateProduct]);

  const isDone = (p) => !needsPhoto(p);

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.topBar}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>FOTOS</h2>
          <span className={styles.count}>
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} · {allReal.length} total
          </span>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <FaSearch size={13} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar producto…"
              className={styles.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button
            className={`${styles.toggleBtn} ${showAll ? styles.toggleBtnActive : ''}`}
            onClick={() => setShowAll(p => !p)}
          >
            {showAll ? 'Mostrar pendientes' : 'Mostrar todos'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <FaImage size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            {search ? `Sin resultados para "${search}"` : '¡Todos los productos tienen foto!'}
          </p>
        </div>
      ) : (
        <>
          <motion.div className={styles.grid} layout>
            <AnimatePresence mode="popLayout">
              {paginated.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  uploading={uploading}
                  onUpload={handleUpload}
                  done={isDone(p)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Paginación */}
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              <FaChevronLeft size={12} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`${styles.pageBtn} ${n === safePage ? styles.pageBtnActive : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}

            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22 }}
          >
            <FaCheckCircle size={14} />
            <span><strong>{toast}</strong> — foto guardada</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Fotos;
