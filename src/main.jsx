import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import { CartProvider } from './components/context/CartContext'
import { ProductsProvider } from './components/context/ProductsContext'
import { AuthProvider } from './components/context/AuthContext'
import { BannersProvider } from './components/context/BannersContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProductsProvider>
            <BannersProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </BannersProvider>
          </ProductsProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
