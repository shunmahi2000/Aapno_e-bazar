const User=require("../models/user");
const jwt =require("jsonwebtoken");//to generate signed token
const expressJwt = require("express-jwt");//for authorization check
const {errorHandler} = require("../helpers/dbErrorHandlers");
const { response } = require("express");
exports.signup = (req,res)=> {
    console.log("req.body",req.body);
    const user = new User(req.body);
    user.save((err,user)=>{
        if(err){
            return res.status(400).json({
                err: errorHandler(err)
            });
        }
        user.salt = undefined;
        user.hashed_password = undefined;
        res.json({
            user
        });
    });
};




exports.signin = (req,res)=>{
    //find the user based email
    const{email,password}=req.body;
    User.findOne({email},(err,user)=>{
        if(err|| !user){
            return res.status(400).json({
                err:"User with that email does not exists.Please signup"
            });
        }
        //authenticate user make sure email and password match
        //create authenticate method in user model
        if(!user.authenticate(password)){
            return res.status(401).json({
                error: "Email and Password not match"
            })
        }
        //generate a signed token with user id and secret
         const token = jwt.sign({_id:user._id},process.env.JWT_SECRET)
         //persist a token as t in cookie with expiry date
         res.cookie("t",token,{expire: new Date()+9999})
         //return response with user and token to front end client
         const {_id,name,email,role}=user
         return res.json({token, user:{_id,email,name,role}})
    });
};
exports.signout=(req,res)=>{
    res.clearCookie("t")
    res.json({message: "Signout successful"})
};


exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"], // added later
    userProperty: "auth"
  });

exports.isAuth=(req,res,next)=>{
    let user = req.profile && req.auth && req.profile._id == req.auth._id
    if(!user){
        return res.status(403).json({
            error: "Access Denied"
        })
    }
    next();
};
exports.isAdmin = (req,res,next)=>{
    if(req.profile.role===0){
        return res.status(403).json({
                error: "Admin resource1 Access denied"
        });
    }
    next();
}


