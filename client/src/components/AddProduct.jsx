import { useState } from "react";
import axios from "axios";


export default function AddProduct (){
    const [ product, setProduct ] = useState('');
    const [ price, setPrice ] = useState('');
    const [ loading, setLoading ] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await axios.post('http://localhost:8080/api/products/add', {
                name: product,
                price: Number(price)
            });

            alert("Product added");
            setProduct('');
            setPrice('');
        } catch (error) {
            console.error("Failed:", error);
            alert("Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Add new product</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Product Name: </label>
                    <input
                        type="text"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        required
                    />
                </div>
                <br />
                 <div>
                    <label>Price: </label>
                    <input
                        type="number" // Use type="number" for numeric inputs
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                </div>
                <br />
                <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Submit Product'}
                </button>
            </form>
        </div>

    )
}
