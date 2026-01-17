import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ProductsTable from './components/ProductsTable.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
    <ProductsTable />
    </>
  </StrictMode>,
)
