const express = require("express");
const indexController = require("../controllers/index");
const router = express.Router();

router.get("/", indexController.getIndex);

router.get("/:slug", indexController.getIndexSlug);

router.get("/tags/:tag", indexController.getTag);

module.exports = router;
