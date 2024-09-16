const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const menuSchema = new Schema({
    structure: {
        type: Object,
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Menu", menuSchema);