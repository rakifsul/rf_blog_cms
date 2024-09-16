const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const settingSchema = new Schema({
    siteTitle: {
        type: String,
        required: true
    },
    siteSEOTitle: {
        type: String,
        required: true
    },
    siteDescription: {
        type: String,
        required: true
    },
    siteSEODescription: {
        type: String,
        required: true
    },
    adminArticlesPerPage: {
        type: Number,
        required: true,
        default: 4
    },
    blogArticlesPerPage: {
        type: Number,
        required: true,
        default: 6
    },
    blogSearchPerPage: {
        type: Number,
        required: true,
        default: 6
    }
});

module.exports = mongoose.model('Setting', settingSchema);