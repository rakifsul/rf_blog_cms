const bcrypt = require("bcryptjs");
const fs = require("fs");
const createError = require('http-errors');
const Joi = require('joi');
const osu = require('node-os-utils');
const helper = require('../lib/helper');
const Setting = require('../models/setting');
const Admin = require('../models/admin');
const Article = require('../models/article');
const Menu = require('../models/menu');
const File = require('../models/file')
const sessionChecker = require('../middlewares/sessionchecker');

module.exports.getIndex = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        const articles = await Article.find({
            adminId: req.session.admin._id
        },
            null, {
            limit: 3,
            sort: {
                createdAt: -1
            }
        }).populate("adminId", "name");

        res.render("admin/layout.ejs", {
            child: "admin/index.ejs",
            clientScript: "admin/index.js.ejs",
            data: {
                results: articles,
                setting: setting
            }
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getCPUUsage = async function (req, res, next) {
    osu.cpu.usage()
        .then(cpuPercentage => {
            res.status(200).json({
                name: "CPU Usage",
                value: cpuPercentage
            });
        });
}

module.exports.getMemoryUsage = function (req, res) {
    osu.mem.used()
        .then(memUsed => {
            res.status(200).json({
                name: "Memory Usage",
                value: (memUsed.usedMemMb / memUsed.totalMemMb) * 100
            });
        });
}

module.exports.getArticles = async function (req, res, next) {
    try {
        res.redirect("/admin/articles/0");
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getAddArticle = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        res.render("admin/layout.ejs", {
            child: "admin/articles_add.ejs",
            clientScript: "admin/articles_add.js.ejs",
            data: {
                results: null,
                setting: setting
            }
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.postAddArticle = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        const { title, slug, seoTitle, seoDescription, content, tags, thumbnail } = req.body;

        let article = new Article({
            title: title ? title : "Untitled",
            content: content,
            slug: slug ? slug : helper.generateSlug(title ? title : "Untitled"),
            seoTitle: seoTitle ? seoTitle : title ? title : "Untitled",
            seoDescription: seoDescription,
            tags: tags.split(",").filter((item) => {
                return item;
            }),
            thumbnail: thumbnail,
            isDraft: false,
            isUnlisted: false,
            adminId: req.session.admin
        });

        await article.save();

        // res.redirect("/admin/articles");
        res.redirect("/admin/articles/edit/" + article._id);
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getArticle = async function (req, res, next) {
    try {
        let query = req.query.q;

        const setting = await Setting.findOne({});

        const count = await Article.count({
        });

        let perPage = Number(setting.adminArticlesPerPage);
        let page = Math.max(0, Number(req.params.id));
        let toFind;
        if (query) {
            toFind = {
                adminId: req.session.admin._id,
                title: {
                    $regex: query,
                    $options: 'i'
                }
            }
        } else {
            toFind = {
                adminId: req.session.admin._id
            }
        }

        const rows = await Article.find(
            toFind,
            null, {
            limit: perPage,
            skip: perPage * page
        }).populate("adminId", "name");

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
                    pageCount: Math.ceil(count / perPage)
                },
                setting: setting
            }
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getEditArticle = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        let article = await Article.findOne({
            _id: req.params.id
        });

        res.render("admin/layout.ejs", {
            child: "admin/articles_edit.ejs",
            clientScript: "admin/articles_edit.js.ejs",
            data: {
                result: article,
                setting: setting
            }
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.postEditArticle = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        const { id, title, slug, seoTitle, seoDescription, content, tags, thumbnail } = req.body;

        if (thumbnail) {
            let article = await Article.updateOne({
                _id: id
            }, {
                $set: {
                    title: title ? title : "Untitled",
                    content: content,
                    slug: slug ? slug : helper.generateSlug(title ? title : "Untitled"),
                    seoTitle: seoTitle ? seoTitle : title ? title : "Untitled",
                    seoDescription: seoDescription,
                    tags: tags.split(",").filter((item) => {
                        return item;
                    }),
                    thumbnail: thumbnail,
                    isDraft: false,
                    isUnlisted: false,
                    adminId: req.session.admin
                }
            });
        } else {
            let article = await Article.updateOne({
                _id: id
            }, {
                $set: {
                    title: title ? title : "Untitled",
                    content: content,
                    slug: slug ? slug : helper.generateSlug(title ? title : "Untitled"),
                    seoTitle: seoTitle ? seoTitle : title ? title : "Untitled",
                    seoDescription: seoDescription,
                    tags: tags.split(",").filter((item) => {
                        return item;
                    }),
                    isDraft: false,
                    isUnlisted: false,
                    adminId: req.session.admin
                }
            });
        }

        // res.redirect("/admin/articles");
        res.redirect(req.get('referer'));
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getDeleteArticle = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        await Article.deleteOne({
            _id: req.params.id
        });

        res.redirect("/admin/articles");
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getMenus = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        const menu = await Menu.findOne({});

        res.render("admin/layout.ejs", {
            child: "admin/menus.ejs",
            clientScript: "admin/menus.js.ejs",
            data: {
                results: menu,
                setting: setting
            }
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.postAddMenu = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        if (req.body) {
            let menu = await Menu.findOne({});
            if (menu) {
                menu.structure = req.body;
                await menu.save();
            } else {
                menu = new Menu({
                    structure: req.body
                });
                await menu.save();
            }
        }
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getDeleteMenu = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        await Menu.deleteOne({});
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getSettings = async function (req, res) {
    try {
        const setting = await Setting.findOne({});

        res.render("admin/layout", {
            child: "admin/settings.ejs",
            clientScript: "admin/settings.js.ejs",
            data: {
                adminEmail: req.session.admin.email,
                setting: setting,
                errors: req.flash('errors')
            }
        });
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.postEditAccountSetting = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});

        const { email, password } = req.body;
        if (password && email) {
            await Admin.updateOne({
                email: req.session.admin.email
            }, {
                $set: {
                    email: email,
                    password: bcrypt.hashSync(password, 12)
                }
            });
        } else if (email) {
            await Admin.updateOne({
                email: req.session.admin.email
            }, {
                $set: {
                    email: email
                }
            });
        }

        res.redirect("/admin/settings");
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.postEditFrontendSetting = async function (req, res, next) {
    try {
        const setting = await Setting.findOne({});
        setting.siteTitle = req.body.siteTitle;
        setting.siteSEOTitle = req.body.siteSEOTitle;
        setting.siteDescription = req.body.siteDescription;
        setting.siteSEODescription = req.body.siteSEODescription;

        setting.adminArticlesPerPage = Number(req.body.adminArticlesPerPage);
        setting.blogArticlesPerPage = Number(req.body.blogArticlesPerPage);
        setting.blogSearchPerPage = Number(req.body.blogSearchPerPage);

        await setting.save();

        res.redirect("/admin/settings");
    } catch (err) {
        console.log(err);
        next(createError(500));
    }
}

module.exports.getFileIndex = async function (req, res, next) {
    //
    const setting = await Setting.findOne({});
    const allFiles = await File.find({});

    let resultTags = [];
    allFiles.forEach((item, index) => {
        item.tags.forEach((item1, index1) => {
            resultTags.push(item1)
        });
    });

    let uniqueTags = [...new Set(resultTags)];

    //
    const resultFiles = await File.find({
        tags: req.query.tag
    });

    res.render('admin/layout.ejs', {
        child: 'admin/file.ejs',
        clientScript: 'admin/file.js.ejs',
        data: {
            results: req.query.tag ? resultFiles : allFiles,
            resultTags: uniqueTags,
            setting: setting
        }
    });
}

module.exports.getFileAjaxList = async function (req, res, next) {
    const allFiles = await File.find({});
    res.json(allFiles)
}

module.exports.postFileUpload = async function (req, res, next) {
    if (req.file) {
        const { title, tags } = req.body;
        const newFile = new File({
            title: title,
            tags: tags.split(",").filter((item) => {
                return item;
            }),
            path: req.file.path.replace("\\", "/")
        });

        await newFile.save();
    }
    res.redirect('/admin/files');
}

module.exports.getFileDelete = async function (req, res, next) {
    const deleted = await File.findOneAndDelete({
        _id: req.params.id
    });

    fs.unlinkSync('./' + deleted.path);

    res.redirect('/admin/files')
}

module.exports.getFileDownload = async function (req, res, next) {
    const found = await File.findOne({
        _id: req.params.id
    });

    res.download(found.path);
}

module.exports.getUniqueTagAjaxList = async function (req, res, next) {
    const articles = await Article.find({
    });

    let allTags = [];
    articles.forEach((item, index) => {
        allTags = [...allTags, ...item.tags];
    });

    let allUniqueTags = [...new Set(allTags)];
    res.json(allUniqueTags)
}

module.exports.getArticleAjaxList = async function (req, res, next) {
    const allArticles = await Article.find({
    });

    res.json(allArticles)
}