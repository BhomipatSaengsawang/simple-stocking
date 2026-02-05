import React, { useState, useEffect, useContext } from "react";
import { data, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Table.module.css"

function ProductTable() {
    const navigate = useNavigate();

    const handleRowClick = (id) => {
        navigate(`/inventory/update/${id}`);
    };

    const [ products, setAllProducts ] = useState(null);
    const [ price, setPrice ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8080/api/products'); // Making the GET request
                console.log("API Res:", response.data.data);
                setAllProducts(response.data.data);
                setPrice(response.data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []); // Empty dependency array

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (   
        <div className={styles.tableContainer}>
            <div className={styles.headerSection}>
                <Link to={"/inventory/create"} className={styles.btnNew}>New</Link>
            </div>
            <table className={styles.customTable}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {products && products.map((p) => (
                        <tr key={p.products_id}
                            onClick={() => handleRowClick(p.products_id)}
                            className={styles.clickableRow}>
                            <td>{p.products_name}</td>
                            <td className={`${styles.price}`}>
                                {p.products_price ? Number(p.products_price).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) : '0.00'}
                            </td>
                        </tr>
                    ))}
                </tbody>
                </table>
        </div>
       
    );
}

export default ProductTable;