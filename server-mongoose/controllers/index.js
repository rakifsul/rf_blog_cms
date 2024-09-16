const createError = require('http-errors');
const moment = require('moment')
const helper = require('../lib/helper')
const Setting = require('../models/setting')
const Article = require('../models/article')
const Menu = require('../models/menu');

module.exports.getIndex = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        const articles = await Article.find({
        }).populate("adminId", "name");

        let allTags = [];
        articles.forEach((item, index) => {
            allTags = [...allTags, ...item.tags];
        });

        let allUniqueTags = [...new Set(allTags)];

        const menu = await Menu.findOne({});

        res.render("index/layout.ejs", {
            child: "index/index.ejs",
            clientScript: "index/index.js.ejs",
            data: {
                results: articles,
                allUniqueTags: allUniqueTags,
                menus: menu,
                currentURL: process.env.BASE_URL + req.originalUrl,
                setting: setting,
                moment: moment
            }
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getIndexSlug = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        let article = await Article.findOne({
            slug: req.params.slug
        }).populate("adminId");

        const menu = await Menu.findOne({});

        if (article) {
            res.render("index/layout.ejs", {
                child: "index/view.ejs",
                clientScript: "index/view.js.ejs",
                data: {
                    result: article,
                    menus: menu,
                    currentURL: process.env.BASE_URL + req.originalUrl,
                    setting: setting,
                    moment: moment
                }
            });
            return;
        }
        next();
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getTag = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        let article = await Article.find({
            tags: req.params.tag
        }).populate("adminId", "name");

        let allTags = [];
        article.forEach((item, index) => {
            allTags = [...allTags, ...item.tags];
        });

        let allUniqueTags = [...new Set(allTags)];

        const menu = await Menu.findOne({});

        res.render("index/layout.ejs", {
            child: "index/tag.ejs",
            clientScript: "index/tag.js.ejs",
            data: {
                results: article,
                tag: req.params.tag,
                allUniqueTags: allUniqueTags,
                menus: menu,
                currentURL: process.env.BASE_URL + req.originalUrl,
                setting: setting,
                moment: moment
            }
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}