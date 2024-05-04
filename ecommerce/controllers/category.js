
const Category = require("../models/category");
const { errorHandler } = require("../helpers/dbErrorHandlers");


exports.categoryById = async (req, res, next, id) => {
    try {
        const data = await Category.findById(id).exec();
        req.category = data;
        next();
    } catch (err) {
        return res.status(400).json({
            error: errorHandler(err)
        });
    }
}
exports.create = async (req, res) => {
    const category = new Category(req.body)
    try{
       await category.save();
        res.json({category});
    }catch(err){
        res.status(400).json({
            error: errorHandler(err)
        });
    }
};


exports.read =async (req, res) => {
    return res.json(req.category)
}

exports.update = async(req, res) => {
    const category = req.category
    category.name = req.body.name
    try{
        await category.save();
        res.json(category);
    }catch(err){
        res.status(400).json({
            error: errorHandler(err)
        });
    }
}

exports.remove = async (req, res) => {
    const category = req.category
    try{
        await category.remove();
        res.json({
            message: "Category Deleted"
        });
    }catch(err){
        return res.status(400).json({
            error: errorHandler(err)
        });
    }
}

exports.list = async (req, res) => {
    try {
        const data = await Category.find().exec();
        res.json(data);
    } catch (err) {
        return res.status(400).json({
            error: errorHandler(err)
        });
    }
}




