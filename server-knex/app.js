const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const flash = require("connect-flash");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const url = require("url");
require("dotenv").config();

// const Admin = require("./models/admin");
// const Setting = require("./models/setting");

const indexRouter = require("./routes/index");
const adminRouter = require("./routes/admin");
const authRouter = require("./routes/auth");

const app = express();

// let store = null;
// if (process.env.MONGODB_URI) {
//     store = new MongoDBStore({
//         uri: process.env.MONGODB_URI,
//         collection: "sessions"
//     });
// } else {
//     store = null;
//     throw new Error("Detail database tidak valid.")
// }

// store.on("error", function (error) {
//     console.log(error);
// });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(
    express.urlencoded({
        limit: "100mb",
        extended: true,
        parameterLimit: 100000,
    })
);
app.use(
    multer({
        storage: multer.diskStorage({
            destination: (req, file, callback) => {
                callback(null, "./uploads");
            },
            filename: (req, file, callback) => {
                callback(null, uuidv4() + "-" + file.originalname);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (
                file.mimetype == "image/png" ||
                file.mimetype == "image/jpg" ||
                file.mimetype == "image/jpeg" ||
                file.mimetype == "image/gif"
            ) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
    }).single("upload")
);
app.use(cookieParser());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        store: new FileStore(),
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 3600000, secure: false, httpOnly: true },
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
            stack: err.stack,
        },
    });
});

const port = url.parse(process.env.BASE_URL).port | 3000;
app.listen(port, function () {
    console.log(`server berjalan di port ${port}`);
});
