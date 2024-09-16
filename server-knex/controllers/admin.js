const bcrypt = require("bcryptjs");
const fs = require("fs");
const createError = require("http-errors");
const Joi = require("joi");
const osu = require("node-os-utils");
const helper = require("../lib/helper");
const knex = require("../databases/connection");
const sessionChecker = require("../middlewares/sessionchecker");

//
module.exports.getIndex = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        const articles = await knex("articles")
            .join("admins", "admins._id", "=", "articles.adminId")
            .where({
                adminId: req.session.admin._id,
            })
            .select("articles.*", "admins.name")
            .limit(3)
            .orderBy("articles.createdAt", "desc");

        console.log(articles);

        res.render("admin/layout.ejs", {
            child: "admin/index.ejs",
            clientScript: "admin/index.js.ejs",
            data: {
                results: articles,
                setting: setting,
            },
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getCPUUsage = async function (req, res, next) {
    osu.cpu.usage().then((cpuPercentage) => {
        res.status(200).json({
            name: "CPU Usage",
            value: cpuPercentage,
        });
    });
};

//
module.exports.getMemoryUsage = function (req, res) {
    osu.mem.used().then((memUsed) => {
        res.status(200).json({
            name: "Memory Usage",
            value: (memUsed.usedMemMb / memUsed.totalMemMb) * 100,
        });
    });
};

//
module.exports.getArticles = async function (req, res, next) {
    try {
        res.redirect("/admin/articles/0");
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getAddArticle = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        res.render("admin/layout.ejs", {
            child: "admin/articles_add.ejs",
            clientScript: "admin/articles_add.js.ejs",
            data: {
                results: null,
                setting: setting,
            },
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.postAddArticle = async function (req, res, next) {
    try {
        const {
            title,
            slug,
            seoTitle,
            seoDescription,
            content,
            tags,
            thumbnail,
        } = req.body;

        const articleId = await knex("articles").insert({
            title: title ? title : "Untitled",
            content: content,
            slug: slug ? slug : helper.generateSlug(title ? title : "Untitled"),
            seoTitle: seoTitle ? seoTitle : title ? title : "Untitled",
            seoDescription: seoDescription,
            thumbnail: thumbnail,
            isDraft: false,
            isUnlisted: false,
            adminId: req.session.admin._id,
        });

        const finalTags = tags.split(",").filter((item) => {
            return item;
        });

        console.log(finalTags);

        finalTags.forEach(async (finalTag) => {
            const tagsWhereName = await knex("articletags").where({
                name: finalTag,
            });

            const isUnique = tagsWhereName.length <= 0;

            let tagId;
            if (isUnique) {
                tagId = await knex("articletags").insert({
                    name: finalTag,
                });
            } else {
                tagId = tagsWhereName[0]._id;
            }

            await knex("articlearticletags").insert({
                articleId: articleId,
                articleTagId: tagId,
            });
        });

        // res.redirect("/admin/articles");
        res.redirect("/admin/articles/edit/" + articleId);
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getArticle = async function (req, res, next) {
    try {
        let query = req.query.q;

        const setting = await knex("settings").first();

        const t1 = await knex("articles").count("_id as TOTAL").first();
        const count = t1.TOTAL;

        let perPage = Number(setting.adminArticlesPerPage);
        let page = Math.max(0, Number(req.params.id));
        let rows;

        if (query) {
            rows = await knex("articles")
                .join("admins", "admins._id", "=", "articles.adminId")
                .where("adminId", "=", req.session.admin._id)
                .andWhere("title", "like", `%${query}%`)
                .select("articles.*", "admins.name")
                .offset(page * perPage)
                .limit(perPage);
        } else {
            rows = await knex("articles")
                .join("admins", "admins._id", "=", "articles.adminId")
                .where("adminId", "=", req.session.admin._id)
                .select("articles.*", "admins.name")
                .offset(page * perPage)
                .limit(perPage);
        }

        res.render("admin/layout.ejs", {
            child: "admin/articles.ejs",
            clientScript: "admin/articles.js.ejs",
            data: {
                results: rows,
                count: count,
                query: query,
                pagination: {
                    page: page,
                    perPage: perPage,
                    pageCount: Math.ceil(count / perPage),
                },
                setting: setting,
            },
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getEditArticle = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        const article = await knex("articles")
            .where({ _id: req.params.id })
            .first();

        const aat = await knex("articlearticletags").where({
            articleId: article._id,
        });

        const mapped = aat.map((item) => item.articleTagId);
        const uniqueIds = [...new Set(mapped)];

        const uniqueTags = await knex("articletags").whereIn("_id", uniqueIds);

        const resultTags = uniqueTags.map((item) => item.name);

        res.render("admin/layout.ejs", {
            child: "admin/articles_edit.ejs",
            clientScript: "admin/articles_edit.js.ejs",
            data: {
                result: article,
                tags: resultTags,
                setting: setting,
            },
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.postEditArticle = async function (req, res, next) {
    try {
        const {
            id,
            title,
            slug,
            seoTitle,
            seoDescription,
            content,
            tags,
            thumbnail,
        } = req.body;

        let articleId = id;
        if (thumbnail) {
            await knex("articles")
                .where({ _id: id })
                .update({
                    title: title ? title : "Untitled",
                    content: content,
                    slug: slug
                        ? slug
                        : helper.generateSlug(title ? title : "Untitled"),
                    seoTitle: seoTitle ? seoTitle : title ? title : "Untitled",
                    seoDescription: seoDescription,
                    thumbnail: thumbnail,
                    isDraft: false,
                    isUnlisted: false,
                    adminId: req.session.admin._id,
                });
        } else {
            await knex("articles")
                .where({ _id: id })
                .update({
                    title: title ? title : "Untitled",
                    content: content,
                    slug: slug
                        ? slug
                        : helper.generateSlug(title ? title : "Untitled"),
                    seoTitle: seoTitle ? seoTitle : title ? title : "Untitled",
                    seoDescription: seoDescription,
                    isDraft: false,
                    isUnlisted: false,
                    adminId: req.session.admin._id,
                });
        }

        const finalTags = tags.split(",").filter((item) => {
            return item;
        });

        finalTags.forEach(async (finalTag) => {
            const tagsWhereName = await knex("articletags").where({
                name: finalTag,
            });

            const isUnique = tagsWhereName.length <= 0;

            let tagId;
            if (isUnique) {
                tagId = await knex("articletags").insert({
                    name: finalTag,
                });
            } else {
                tagId = tagsWhereName[0]._id;
            }

            await knex("articlearticletags").insert({
                articleId: articleId,
                articleTagId: tagId,
            });
        });

        // res.redirect("/admin/articles");
        res.redirect(req.get("referer"));
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getDeleteArticle = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        await knex("articles")
            .where({
                _id: req.params.id,
            })
            .del();

        await knex("articlearticletags")
            .where({
                articleId: req.params.id,
            })
            .del();

        const allTags = await knex("articletags");

        for (let tag of allTags) {
            const filetagsWhereId = await knex("articlearticletags").where({
                articleTagId: tag._id,
            });

            if (filetagsWhereId.length <= 0) {
                console.log("1");
                await knex("articletags").where({ _id: tag._id }).del();
                console.log("2");
            }
        }

        res.redirect("/admin/articles");
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getMenus = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        const menu = await knex("menus").first();

        let menuParsed = null;

        if (menu) {
            menuParsed = JSON.parse(menu.structure);
        }

        res.render("admin/layout.ejs", {
            child: "admin/menus.ejs",
            clientScript: "admin/menus.js.ejs",
            data: {
                results: {
                    structure: menuParsed,
                },

                setting: setting,
            },
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.postAddMenu = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        if (req.body) {
            let menu = await knex("menus").first();
            if (menu) {
                const menuJSON = JSON.stringify(req.body);

                await knex("menus")
                    .where({ _id: menu._id })
                    .update({ structure: menuJSON });
            } else {
                const menuJSON = JSON.stringify(req.body);

                await knex("menus").insert({ structure: menuJSON });
            }
        }
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getDeleteMenu = async function (req, res, next) {
    try {
        const setting = await knex("settings").first();

        await knex("menus").where("_id", "!=", "null").del();
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

module.exports.getSettings = async function (req, res) {
    try {
        const setting = await knex("settings").first();

        res.render("admin/layout", {
            child: "admin/settings.ejs",
            clientScript: "admin/settings.js.ejs",
            data: {
                adminEmail: req.session.admin.email,
                setting: setting,
                errors: req.flash("errors"),
            },
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.postEditAccountSetting = async function (req, res, next) {
    try {
        const { email, password } = req.body;

        if (password && email) {
            const ret = await knex("admins")
                .where({ email: req.session.admin.email })
                .update({
                    email: email,
                    password: bcrypt.hashSync(password, 12),
                });
        } else if (email) {
            const ret = await knex("admins")
                .where({ email: req.session.admin.email })
                .update({
                    email: email,
                });
        }

        res.redirect("/admin/settings");
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.postEditFrontendSetting = async function (req, res, next) {
    try {
        const target = await knex("settings").first();

        const ret = await knex("settings")
            .where({ _id: target._id })
            .update({
                siteTitle: req.body.siteTitle,
                siteSEOTitle: req.body.siteSEOTitle,
                siteDescription: req.body.siteDescription,
                siteSEODescription: req.body.siteSEODescription,
                adminArticlesPerPage: Number(req.body.adminArticlesPerPage),
                blogArticlesPerPage: Number(req.body.blogArticlesPerPage),
                blogSearchPerPage: Number(req.body.blogSearchPerPage),
            });

        res.redirect("/admin/settings");
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
};

//
module.exports.getFileIndex = async function (req, res, next) {
    console.log(req.query.tag);

    const setting = await knex("settings").first();

    if (!req.query.tag) {
        const allFiles = await knex("files");

        const allTagsAtId = await knex("filetags").select("name");

        let allUniqueTagsAtId = [
            ...new Set(
                allTagsAtId.map((item) => {
                    return item.name;
                })
            ),
        ];

        res.render("admin/layout.ejs", {
            child: "admin/file.ejs",
            clientScript: "admin/file.js.ejs",
            data: {
                results: allFiles,
                resultTags: allUniqueTagsAtId,
                setting: setting,
            },
        });
    } else {
        const allTagsAtId = await knex("filetags").select("name");

        let allUniqueTagsAtId = [
            ...new Set(
                allTagsAtId.map((item) => {
                    return item.name;
                })
            ),
        ];

        const singleTag = await knex("filetags").where({ name: req.query.tag });

        const allTagFiles = await knex("filefiletags").where({
            fileTagId: singleTag[0]._id,
        });

        const allFiles = await knex("files").whereIn(
            "_id",
            allTagFiles.map((item) => item.fileId)
        );

        res.render("admin/layout.ejs", {
            child: "admin/file.ejs",
            clientScript: "admin/file.js.ejs",
            data: {
                results: allFiles,
                resultTags: allUniqueTagsAtId,
                setting: setting,
            },
        });
    }
};

//
module.exports.getFileAjaxList = async function (req, res, next) {
    const allFiles = await knex("files");
    res.json(allFiles);
};

//
module.exports.postFileUpload = async function (req, res, next) {
    // jika request file ada
    if (req.file) {
        const { title, tags } = req.body;

        const finalTags = tags.split(",").filter((item) => {
            return item;
        });

        const fileId = await knex("files").insert({
            title: title,
            path: req.file.path.replace("\\", "/"),
        });

        finalTags.forEach(async (finalTag) => {
            const tagsWhereName = await knex("filetags").where({
                name: finalTag,
            });

            const isUnique = tagsWhereName.length <= 0;

            let tagId;
            if (isUnique) {
                tagId = await knex("filetags").insert({
                    name: finalTag,
                });
            } else {
                tagId = tagsWhereName[0].id;
            }

            await knex("filefiletags").insert({
                fileId: fileId,
                fileTagId: tagId,
            });
        });
    }

    res.redirect("/admin/files");
};

//
module.exports.getFileDelete = async function (req, res, next) {
    // hapus data di db nya.
    const willBeDeleted = await knex("files").where({
        _id: req.params.id,
    });

    await knex("files")
        .where({
            _id: req.params.id,
        })
        .del();

    await knex("filefiletags")
        .where({
            fileId: req.params.id,
        })
        .del();

    const allTags = await knex("filetags");

    for (let tag of allTags) {
        const filetagsWhereId = await knex("filefiletags").where({
            fileTagId: tag._id,
        });
        if (filetagsWhereId.length <= 0) {
            await knex("filetags").where({ _id: tag._id }).del();
        }
    }

    // hapus file nya
    fs.unlinkSync("./" + willBeDeleted[0].path);

    // redirect ke /admin/files
    res.redirect("/admin/files");
};

//
module.exports.getFileDownload = async function (req, res, next) {
    // cari file yang _id nya adalah <id-nya>
    const found = await knex("files").where({
        _id: req.params.id,
    });

    // jika ditemukan, maka download
    res.download(found[0].path);
};

//
module.exports.getUniqueTagAjaxList = async function (req, res, next) {
    const articles = await knex("articles");

    const articlearticletags = await knex("articlearticletags").whereIn(
        "articleId",
        articles.map((item) => item._id)
    );

    const articlearticletagsMap = articlearticletags.map(
        (item) => item.articleTagId
    );

    let allUniqueArticleTagIds = [...new Set(articlearticletagsMap)];

    const allUniqueArticleTags = await knex("articletags").whereIn(
        "_id",
        allUniqueArticleTagIds
    );

    res.json(allUniqueArticleTags.map((item) => item.name));
};

//
module.exports.getArticleAjaxList = async function (req, res, next) {
    const allArticles = await knex("articles");
    res.json(allArticles);
};
