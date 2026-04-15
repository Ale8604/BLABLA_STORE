import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Importamos el proveedor del carrito
import { CartProvider } from './components/context/CartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolvemos App con CartProvider */}
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>,
)
