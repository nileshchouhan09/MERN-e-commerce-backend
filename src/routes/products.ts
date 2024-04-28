import express from "express";
import {
  deleteProduct,
  getAdminProduct,
  getAllCategories,
  getAllProduct,
  getLatestProduct,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/products.js";
import { singleUpload } from "../middlewares/Multer.js";
import { adminOnly } from "../middlewares/Auth.js";

const app = express.Router();

app.post("/new", adminOnly, singleUpload, newProduct);
// app.post("/new",singleUpload,newProduct);

// get all the latest product 
app.get("/latest", getLatestProduct);

// get all product with filter 
app.get("/all", getAllProduct);

// get the categories of the products listed 
app.get("/categories", getAllCategories);

// admin can access all the product in the db 
app.get("/admin-products",adminOnly, getAdminProduct);

app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
