
const formidable = require("formidable")
const _ = require("lodash");
const fs = require("fs");
const Product = require("../models/product");
const { errorHandler } = require("../helpers/dbErrorHandlers");
const product = require("../models/product");
const { listSearch } = require("../controllers/product");
const util = require('util');
exports.productById = async (req, res, next, id) => {
    try{
        const data = await Product.findById(id).populate("category");
        req.product = data;
        next();
    }catch(err){
        return res.status(400).json({
            error: "Product not found"
        });
    }
};



exports.read = (req, res) => {
    req.product.photo = undefined
    return res.json(req.product);
}

const parseForm = util.promisify(formidable.IncomingForm.prototype.parse);

exports.create = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();
        form.keepExtensions = true;
        const { fields, files } = await parseForm(form, req);

        // Check for all fields
        const { name, description, price, category, quantity, shipping } = fields;
        if (!name || !description || !price || !category || !quantity || !shipping) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        let product = new Product(fields);

        if (files.photo) {
            if (files.photo.size > 1000000) {
                return res.status(400).json({
                    error: "Image should be less than 1 mb"
                });
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }

        const result = await product.save();
        res.json(result);
    } catch (err) {
        return res.status(400).json({
            error: "Image could not be uploaded"
        });
    }
};

exports.remove = async (req, res) => {
    try {
        const product = req.product;
        await product.remove();
        res.json({
            "message": "Product Deleted successfully"
        });
    } catch (err) {
        return res.status(400).json({
            error: errorHandler(err)
        });
    }
};

exports.update = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();
        form.keepExtensions = true;
        const { fields, files } = await parseForm(form, req);

        // Check for all fields
        const { name, description, price, category, quantity, shipping } = fields;
        if (!name || !description || !price || !category || !quantity || !shipping) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        let product = req.product;
        product = _.extend(product, fields);

        if (files.photo) {
            if (files.photo.size > 1000000) {
                return res.status(400).json({
                    error: "Image should be less than 1 mb"
                });
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }

        const result = await product.save();
        res.json(result);
    } catch (err) {
        return res.status(400).json({
            error: "Image could not be uploaded"
        });
    }
};

//sell or arrival
// by sell = /products?sortBy=sold&order=desc&limit=4
// by arrival = /products?sortBy=created&order=desc&limit=4
//above two methods comes from front end
//if no params are sent,then all products are returned




exports.list = async (req, res) => {
    let order = req.query.order ? req.query.order : "asc"
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id"
    let limit = req.query.limit ? parseInt(req.query.limit) : 6

    try{
        const data = await Product.find()
        .select("-photo")
        .populate("category")
        .sort([[sortBy, order]])
        .limit(limit)
        res.json(data);
    }catch(err){
        return res.status(400).json({
            error: "Products not found"
        });
    }
}

//it will find the product based on the request category
//other products that has the same category wiill be returned


exports.listRelated = async  (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 6

    try{
        const data = await Product.find({ _id: { $ne: req.data }, category: req.data.category })
        .limit(limit)
        .populate("category", 'id_name')
        res.json(data);
    }catch(err){
        return res.status(400).json({
            error: "Product not found"
        });
    }
}


exports.listCategories = async (req, res) => {
    try{
        const data = await Product.distinct("category", {});
        res.json(data);
    }catch(err){
        return res.status(400).json({
            error: "Categories not found"
        });
    }
}



/**
 * list products by search
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 */

exports.listBySearch = async (req, res) => {
    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};

    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);

    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }
    try{
        const data = await Product.find(findArgs)
        .select("-photo")
        .populate("category")
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit).exec();
         res.json({size:data.length,data})
    }catch(err){
        return res.status(400).json({
            error: "Products not found"
        });
    }
};


exports.photo = async (req, res, next) => {
    if (req.product.photo.data) {
        res.set("Conten-Type", req.product.photo.contentType)
        return res.send(req.product.photo.data)
    }
    next();
}


exports.listSearch = async (req, res) => {
    const query = {}
    if (req.query.search) {
        query.name = { $regex: req.query.search, $options: "i" }
        if (req.query.category && req.query.category != "All") {
            query.category = req.query.category
        }
        try{
            const data = await Product.find(query).select("-photo").exec();
            res.json(data);
        }catch(err){
            return res.status(400).json({
                error: "Products not found"
            });
        }
    }
}