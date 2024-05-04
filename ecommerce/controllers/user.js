const User = require("../models/user")

exports.userById = async (req,res,next,id)=>{
    try{
        const user = await User.findById(id);
        req.profile=user;
        next();
    }catch(err){
        return res.status(400).json({
            error: "User not found"
        });
    }
};

exports.read = (req,res)=>{
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
};



exports.update = async (req,res)=>{
    try{
        const user = await User.findOneAndUpdate({_id: req.profile._id},{$set: req.body},{new: true});
        user.hashed_password = undefined;
        user.salt = undefined;
        res.json(user);
    }catch(err){
        return res.status(400).json({
            error:"You are not authorized to perform this action"
        });
    }
};