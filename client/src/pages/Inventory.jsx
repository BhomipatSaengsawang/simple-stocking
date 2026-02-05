import React, { useState, useEffect, useContext } from "react";
import { data, Link } from "react-router-dom";
import axios from "axios";
import ProductTable from "../components/Table/ProductTable"

function Inventory() {
    return(
        <div>
            <ProductTable />
        </div>
    );
}

export default Inventory