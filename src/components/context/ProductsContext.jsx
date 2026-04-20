import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const [active, archived] = await Promise.all([
        api.get('/products'),
        api.get('/products?archived=true'),
      ]);
      setProducts([...active, ...archived]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const addProduct = async (product) => {
    const created = await api.post('/products', product);
    setProducts(prev => [created, ...prev]);
    return created;
  };

  const updateProduct = async (id, changes) => {
    const updated = await api.put(`/products/${id}`, changes);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const setProductOffer = async (id, offerData) => {
    const updated = await api.patch(`/products/${id}/offer`, offerData);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const archiveProduct = async (id) => {
    const updated = await api.patch(`/products/${id}/archive`);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const activeProducts   = products.filter(p => !p.archived);
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
