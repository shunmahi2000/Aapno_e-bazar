const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const expressValidator = require("express-validator");

// require("dotenv").config();
const dotenv = require("dotenv");
dotenv.config();

//import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const braintreeRoutes = require("./routes/braintree");

//app
const app = express();

//db
const db = "mongodb + srv://root:3030@ecommerce.yhm8e.mongodb.net/ecommerce?retryWrites=true&w=majority";
mongoose
  .connect(process.env.DATABASE || db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connected"));

mongoose.connection.on("error", (err) => {
  console.log(`DB connection error: ${err.message}`);
});

//middlewares
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());

//routes middleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", braintreeRoutes);

const port = process.env.PORT || 8000;

//step 3
if (process.env.NODE_ENV === "production") {
  app.use(express.static('ecommerce-front/build'))
}
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
