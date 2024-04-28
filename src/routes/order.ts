import express from "express"
import { allOrders, deleteOrder, getSingleOrders, myOrders, newOrder, processOrder } from "../controllers/order.js";
import { adminOnly } from "../middlewares/Auth.js";

const app = express.Router();

app.post("/new",newOrder)

app.get("/my",myOrders)

app.get("/all",adminOnly,allOrders)

app.route("/:id").get(getSingleOrders).put(adminOnly,processOrder).delete(adminOnly,deleteOrder)


export default app;