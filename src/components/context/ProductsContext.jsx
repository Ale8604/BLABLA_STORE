import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

const CACHE_KEY = 'blabla_products_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
};

const writeCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
};

const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const cached = readCache();
  const [products, setProducts] = useState(cached || []);
  const [loading, setLoading]   = useState(!cached);
  const [error, setError]       = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      const [active, archived] = await Promise.all([
        api.get('/products'),
        api.get('/products?archived=true'),
      ]);
      const all = [...active, ...archived];
      setProducts(all);
      writeCache(all);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Si hay caché, carga en background sin bloquear la UI
    if (cached) {
      loadProducts();
    } else {
      setLoading(true);
      loadProducts();
    }
  }, [loadProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  const addProduct = async (product) => {
    const created = await api.post('/products', product);
    setProducts(prev => { const next = [created, ...prev]; writeCache(next); return next; });
    return created;
  };

  const updateProduct = async (id, changes) => {
    const updated = await api.put(`/products/${id}`, changes);
    setProducts(prev => { const next = prev.map(p => p.id === id ? updated : p); writeCache(next); return next; });
    return updated;
  };

  const setProductOffer = async (id, offerData) => {
    const updated = await api.patch(`/products/${id}/offer`, offerData);
    setProducts(prev => { const next = prev.map(p => p.id === id ? updated : p); writeCache(next); return next; });
    return updated;
  };

  const archiveProduct = async (id) => {
    const updated = await api.patch(`/products/${id}/archive`);
    setProducts(prev => { const next = prev.map(p => p.id === id ? updated : p); writeCache(next); return next; });
    return updated;
  };

  const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`);
    setProducts(prev => { const next = prev.filter(p => p.id !== id); writeCache(next); return next; });
  };

  const activeProducts   = products.filter(p => !p.archived && !p.draft);
  const archivedProducts = products.filter(p =>  p.archived);

  return (
    <ProductsContext.Provider value={{
      products, activeProducts, archivedProducts,
      loading, error,
      addProduct, updateProduct, archiveProduct, deleteProduct, loadProducts, setProductOffer,
    }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => useContext(ProductsContext);
