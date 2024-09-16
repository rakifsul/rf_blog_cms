const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const articleSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    seoTitle: {
        type: String,
        required: true
    },
    seoDescription: {
        type: String,
        required: false
    },
    thumbnail: {
        type: String,
        required: false
    },
    tags: [{
        type: String,
        required: false
    }],
    isDraft: {
        type: Boolean,
        required: true
    },
    isUnlisted: {
        type: Boolean,
        required: true
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Article", articleSchema);