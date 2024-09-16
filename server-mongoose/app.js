const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const flash = require("connect-flash");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const url = require("url");
require("dotenv").config();

const Admin = require("./models/admin");
const Setting = require("./models/setting");

const indexRouter = require("./routes/index");
const adminRouter = require("./routes/admin");
const authRouter = require("./routes/auth");

const app = express();
let store = null;
if (process.env.MONGODB_URI) {
    store = new MongoDBStore({
        uri: process.env.MONGODB_URI,
        collection: "sessions"
    });
} else {
    store = null;
    throw new Error("Detail database tidak valid.")
}

store.on("error", function (error) {
    console.log(error);
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true, parameterLimit: 100000 }));
app.use(multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, "./uploads");
        },
        filename: (req, file, callback) => {
            callback(null, uuidv4() + "-" + file.originalname);
        }
    }),
    fileFilter: (req, file, callback) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/gif") {
            callback(null, true);
        } else {
            callback(null, false);
        }
    }
}).single("upload"));
app.use(cookieParser());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        store: store,
        resave: false,
        saveUninitialized: false
    })
);
app.use(flash());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(__dirname + "/uploads"));

app.use("/admin", adminRouter);
app.use("/auth", authRouter);
app.use("/", indexRouter);


app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        error: {
            message: err.message,
            status: err.status,
            stack: err.stack
        }
    });
});

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).catch((error) => {
        console.log(error);
    });
} else {
    throw new Error("Detail database tidak valid.")
}

mongoose.connection.on("error", err => {
    console.log(err);
});

mongoose.connection.on("connected", async function () {
    const admin = await Admin.find({});
    if (admin.length == 0) {
        console.log("Admin belum ada, membuat admin pertama...");
        let newAdmin = new Admin({
            email: "admin@example.com",
            name: "admin",
            password: bcrypt.hashSync("admin", 12)
        });
        await newAdmin.save();
    }

    const setting = await Setting.find({});
    if (setting.length == 0) {
        console.log("Config belum ada, membuat config default...")
        let newSetting = new Setting({
            siteTitle: "SHBNDBlogCMS",
            siteSEOTitle: "SHBNDBlogCMS - Blog CMS, Dibuat Menggunakan Node.js",
            siteDescription: "SHBNDBlogCMS adalah aplikasi web untuk membuat blog...",
            siteSEODescription: "SHBNDBlogCMS adalah aplikasi web untuk membuat blog...",
            adminArticlesPerPage: 4,
            blogArticlesPerPage: 6,
            blogSearchPerPage: 6
        });
        await newSetting.save();
    }

    const port = url.parse(process.env.BASE_URL).port | 3000;
    app.listen(port, function () {
        console.log(`server berjalan di port ${port}`);
    });
});
