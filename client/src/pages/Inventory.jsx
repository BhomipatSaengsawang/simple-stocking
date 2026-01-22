import React, { useState, useEffect, useContext } from "react";
import { data, Link } from "react-router-dom";
import axios from "axios";

function Inventory() {
    const [ products, setAllProducts ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8080/api/products'); // Making the GET request
                console.log("API Res:", response.data.data);
                setAllProducts(response.data.data);
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
        <div>
            <Link to={"/inventory/create"}>+ Add</Link>
            <ul>
                {products.map(p => (
                    <li key={p.products_id}>{p.products_name}</li>
                ))}
            </ul>
        </div>
    )
}

export default Inventory