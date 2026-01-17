import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from "axios";

function App() {
  const [count, setCount] = useState(0);
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const response = await axios.get("http://localhost:8080/products");
    setProducts(response.data.data);
    console.log(response.data.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ul>
      {products.map((p) => (
        <li key={p.products_id}>{p.products_name} - {p.products_price}</li>
      ))}
    </ul>
  );
}
export default App
