import React from "react";
// import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PageTest from "./pages/PageTest";
import ProductCreate from "./pages/ProductCreate";
import NoPageFound from "./pages/NoPageFound";
import Inventory from "./Pages/Inventory";


const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/create" element={<ProductCreate />} />
                <Route path="/test" element={<PageTest />} />
                <Route path="*" element={<NoPageFound />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App;
 