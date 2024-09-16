const createError = require("http-errors");
const moment = require("moment");
const helper = require("../lib/helper");
const knex = require("../databases/connection");

//
module.exports.getIndex = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        const articles = await knex("articles").join(
            "admins",
            "admins._id",
            "=",
            "articles.adminId"
        );

        const allTagsAtId = await knex("articletags").select("name");

        let allUniqueTagsAtId = [
            ...new Set(
                allTagsAtId.map((item) => {
                    return item.name;
                })
            ),
        ];

        const menu = await knex("menus").first();
        let menuParsed = null;

        if (menu) {
            menuParsed = JSON.parse(menu.structure);
        }

        res.render("index/layout.ejs", {
            child: "index/index.ejs",
            clientScript: "index/index.js.ejs",
            data: {
                results: articles,
                allUniqueTags: allUniqueTagsAtId,
                menus: {
                    structure: menuParsed,
                },
                currentURL: process.env.BASE_URL + req.originalUrl,
                setting: setting,
                moment: moment,
            },
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getIndexSlug = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        const article = await knex("articles")
            .join("admins", "admins._id", "=", "articles.adminId")
            .where({
                slug: req.params.slug,
            })
            .first();

        const articleIds = await knex("articlearticletags")
            .where({
                articleId: article._id,
            })
            .select("articleTagId");

        let articleIdsUnique = [
            ...new Set(
                articleIds.map((item) => {
                    return item.articleTagId;
                })
            ),
        ];

        const allTagNamesUnique = await knex("articletags").whereIn(
            "_id",
            articleIdsUnique
        );

        let allTagNamesUnique1 = [
            ...new Set(
                allTagNamesUnique.map((item) => {
                    return item.name;
                })
            ),
        ];

        const menu = await knex("menus").first();
        let menuParsed = null;

        if (menu) {
            menuParsed = JSON.parse(menu.structure);
        }

        if (article) {
            res.render("index/layout.ejs", {
                child: "index/view.ejs",
                clientScript: "index/view.js.ejs",
                data: {
                    result: article,
                    resultTags: allTagNamesUnique1,
                    menus: {
                        structure: menuParsed,
                    },
                    currentURL: process.env.BASE_URL + req.originalUrl,
                    setting: setting,
                    moment: moment,
                },
            });
            return;
        }
        next();
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getTag = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        const allTagsAtId = await knex("articletags").select("name");

        let allUniqueTagsAtId = [
            ...new Set(
                allTagsAtId.map((item) => {
                    return item.name;
                })
            ),
        ];

        const singleTag = await knex("articletags")
            .where({ name: req.params.tag })
            .first();

        const allTagArticles = await knex("articlearticletags").where({
            articleTagId: singleTag._id,
        });

        const allArticles = await knex("articles")
            .join("admins", "admins._id", "=", "articles.adminId")
            .whereIn(
                "articles._id",
                allTagArticles.map((item) => item.articleId)
            );

        const menu = await knex("menus").first();
        let menuParsed = null;

        if (menu) {
            menuParsed = JSON.parse(menu.structure);
        }

        res.render("index/layout.ejs", {
            child: "index/tag.ejs",
            clientScript: "index/tag.js.ejs",
            data: {
                results: allArticles,
                tag: req.params.tag,
                allUniqueTags: allUniqueTagsAtId,
                menus: {
                    structure: menuParsed,
                },
                currentURL: process.env.BASE_URL + req.originalUrl,
                setting: setting,
                moment: moment,
            },
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};
