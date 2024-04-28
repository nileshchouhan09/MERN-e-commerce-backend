import mongoose from "mongoose"

const schema = new mongoose.Schema(
    {

        shippingInfo:{
            address:{
                type:String,
                required:[true,"Please enter address"]
            },
            city:{
                type:String,
                required:[true,"Enter your city"]
            },
            state:{
                type:String,
                required:[true,"Enter your state"]
            },
            country:{
                type:String,
                required:[true,"Enter your country"]
            },
            pinCode:{
                type:Number,
                required:[true,"Enter your pincode"]
            }
        },

        user:{
            type:String,
            ref:"User",
            required:true,
        },

        subtotal:{
            type:Number,
            required:true,
        },
        tax:{
            type:Number,
            required:true,
        },
        shippingCharges:{
            type:Number,
            required:true,
        },
        discount:{
            type:Number,
            required:true,
        },
       
        total:{
            type:Number,
            required:true,
        },
        status:{
            type:String,
            enum:["Processing","Shipped","Delivered"],
            default:"Processing"
        },

        orderItems:[{
            name:String,
            photo:String,
            price:Number,
            quantity:Number,
            productId:{
                type:mongoose.Types.ObjectId,
                ref:"Product"
            }
        }]
       
       
    },{
        timestamps:true,
    }

)

export const Order = mongoose.model("Order",schema)