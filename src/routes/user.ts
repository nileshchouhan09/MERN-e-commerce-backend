import express from "express"
import { deleteUser, getAllUsers, getUser, newUser } from "../controllers/user.js";
import { adminOnly } from "../middlewares/Auth.js";
const app = express.Router();

app.post("/new",newUser)

//route /api/v1/user/getAllUser
app.get("/all",adminOnly,getAllUsers)


// dynamic routes for id 

app.route("/:id").get(getUser).delete(adminOnly,deleteUser)






export default app;