import { useState, useEffect } from "react";
import axios from "axios";

export default function ProductsTable() {
  const [products, setProducts] = useState([]);

  const money = (n) =>
    Number(n ?? 0).toLocaleString("en-US", { style: "currency", currency: "THB" });

  const fetchProducts = async () => {
    const response = await axios.get("http://localhost:8080/products");
    setProducts(response.data.data);
    console.log(response.data.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th className="col-check"><input type="checkbox" aria-label="Select all" /></th>
            <th>NAME</th>
            <th className="num">PRICE</th>
            <th>MODIFIED</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.products_id}>
              <td className="col-check">
                <input type="checkbox" aria-label={`Select ${p.products_id}`} />
              </td>
              <td className="name-call">
                <span className="dot" aria-hidden="true" />
                <span>{p.products_name}</span>
              </td>
              <td className="num">{money(p.products_price)}</td>
              <td>{p.products_updated_at}</td>
            </tr>  
          ))}
        </tbody>
      </table>

      <div className="table-footer">
        <div className="muted">Rows: {products.length}</div>
        <div className="pager">
          <button className="btn btn-light btn-sm" disabled>Prev</button>
          <button className="btn btn-light btn-sm is-current">1</button>
          <button className="btn btn-light btn-sm">2</button>
          <button className="btn btn-light btn-sm">3</button>
          <button className="btn btn-light btn-sm">Next</button>
        </div>
      </div>
    </div>
  );
}