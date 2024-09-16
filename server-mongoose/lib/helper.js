const slugify = require('slugify');
const url = require('url');

module.exports.generateSlug = (title) => {
    return slugify(title, { lower: true }) + "-" + (new Date()).getTime().toString();
}