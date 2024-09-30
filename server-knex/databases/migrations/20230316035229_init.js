const bcrypt = require("bcryptjs");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable("admins", function (table) {
            table.increments("_id");
            table.string("name", 1000).notNullable();
            table.string("email", 1000).notNullable();
            table.string("password", 1000).notNullable();
            table.timestamps(true, true, true);
        })
        .createTable("articles", function (table) {
            table.increments("_id");
            table.string("title", 1000).notNullable();
            table.text("content", "text");
            table.string("slug", 1000).notNullable();
            table.string("seoTitle", 1000).notNullable();
            table.text("seoDescription", "text");
            table.text("thumbnail", "longtext");
            table.boolean("isDraft").notNullable().defaultTo(false);
            table.boolean("isUnlisted").notNullable().defaultTo(false);
            table.integer("adminId").notNullable();
            table.timestamps(true, true, true);
        })
        .createTable("articletags", function (table) {
            table.increments("_id");
            table.string("name", 1000).notNullable();
            table.timestamps(true, true, true);
        })
        .createTable("articlearticletags", function (table) {
            table.increments("_id");
            table.integer("articleId").notNullable();
            table.integer("articleTagId").notNullable();
            table.timestamps(true, true, true);
        })
        .createTable("menus", function (table) {
            table.increments("_id");
            table.text("structure", "text");
            table.timestamps(true, true, true);
        })
        .createTable("settings", function (table) {
            table.increments("_id");
            table.string("siteTitle", 1000).notNullable();
            table.string("siteSEOTitle", 1000).notNullable();
            table.text("siteDescription", "text");
            table.text("siteSEODescription", "text");
            table.integer("adminArticlesPerPage").notNullable().defaultTo(4);
            table.integer("blogArticlesPerPage").notNullable().defaultTo(6);
            table.integer("blogSearchPerPage").notNullable().defaultTo(6);
            table.timestamps(true, true, true);
        })
        .createTable("files", function (table) {
            table.increments("_id");
            table.string("title", 1000).notNullable();
            table.string("path", 1000).notNullable();
            table.timestamps(true, true, true);
        })
        .createTable("filetags", function (table) {
            table.increments("_id");
            table.string("name", 1000).notNullable();
            table.timestamps(true, true, true);
        })
        .createTable("filefiletags", function (table) {
            table.increments("_id");
            table.integer("fileId").notNullable();
            table.integer("fileTagId").notNullable();
            table.timestamps(true, true, true);
        })
        .then(() => {
            return knex("admins").insert([
                {
                    name: "admin",
                    email: "admin@example.com",
                    password: bcrypt.hashSync("admin", 12),
                },
            ]);
        })
        .then(() => {
            return knex("settings").insert([
                {
                    siteTitle: "RF Blog CMS",
                    siteSEOTitle:
                        "RF Blog CMS - Blog CMS, Dibuat Menggunakan Node.js",
                    siteDescription:
                        "RF Blog CMS adalah aplikasi web untuk membuat blog...",
                    siteSEODescription:
                        "RF Blog CMS adalah aplikasi web untuk membuat blog...",
                    adminArticlesPerPage: 4,
                    blogArticlesPerPage: 6,
                    blogSearchPerPage: 6,
                },
            ]);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTable("filefiletags")
        .dropTable("filetags")
        .dropTable("files")
        .dropTable("settings")
        .dropTable("menus")
        .dropTable("articlearticletags")
        .dropTable("articletags")
        .dropTable("articles")
        .dropTable("admins");
};
