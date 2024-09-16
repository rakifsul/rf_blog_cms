const express = require("express");
const adminController = require("../controllers/admin");
const sessionChecker = require("../middlewares/sessionchecker");

const router = express.Router();

router.get("/", sessionChecker.notLoggedIn, adminController.getIndex);

router.get("/cpu-usage", sessionChecker.notLoggedIn, adminController.getCPUUsage);

router.get("/memory-usage", adminController.getMemoryUsage);

router.get("/articles", sessionChecker.notLoggedIn, adminController.getArticles);

router.get("/articles/add", sessionChecker.notLoggedIn, adminController.getAddArticle);

router.post("/articles/add", sessionChecker.notLoggedIn, adminController.postAddArticle);

router.get("/articles/:id", adminController.getArticle);

router.get("/articles/edit/:id", sessionChecker.notLoggedIn, adminController.getEditArticle);

router.post("/articles/edit", sessionChecker.notLoggedIn, adminController.postEditArticle);

router.get("/articles/delete/:id", sessionChecker.notLoggedIn, adminController.getDeleteArticle);

router.get("/menus", sessionChecker.notLoggedIn, adminController.getMenus);

router.post("/menus/add", sessionChecker.notLoggedIn, adminController.postAddMenu);

router.get("/menus/delete", sessionChecker.notLoggedIn, adminController.getDeleteMenu);

router.get("/menus/ajax-list-unique-tag", sessionChecker.notLoggedIn, adminController.getUniqueTagAjaxList);

router.get("/menus/ajax-list-article", sessionChecker.notLoggedIn, adminController.getArticleAjaxList);

router.get("/settings", sessionChecker.notLoggedIn, adminController.getSettings);

router.post("/account-setting/edit", sessionChecker.notLoggedIn, adminController.postEditAccountSetting);

router.post("/frontend-setting/edit", sessionChecker.notLoggedIn, adminController.postEditFrontendSetting);

router.get("/files", sessionChecker.notLoggedIn, adminController.getFileIndex);

router.get("/files/ajax-list-image", sessionChecker.notLoggedIn, adminController.getFileAjaxList);

router.post("/files/upload", sessionChecker.notLoggedIn, adminController.postFileUpload);

router.get("/files/delete/:id", sessionChecker.notLoggedIn, adminController.getFileDelete);

router.get("/files/download/:id", sessionChecker.notLoggedIn, adminController.getFileDownload);

module.exports = router;
