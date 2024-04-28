import { User } from "../models/user.js";
import ErrorHandler from "../utils/utiliy-class.js";
import { TryCatch } from "./error.js";

// middle ware to make sure only admin is allowed 
export const adminOnly = TryCatch(async(req,res,next)=>{
    const {id} = req.query;

    if(!id) return next(new ErrorHandler("You are logged out",401));

    const user = await  User.findById(id);

    if(!user) return next(new ErrorHandler("Invalid Id",401))

    if(user.role !== "admin"){ // code will run this is typescript error but the function work correctly
        
        return next(new ErrorHandler("Only Admin is allowed to access",403))
    }
    next();

})

