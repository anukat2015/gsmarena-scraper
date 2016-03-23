var http = require('http');
var Promise = require('bluebird');
var util = require('./util');
var scraper = Promise.promisifyAll(require('./scraper'));


var server = http.createServer(function(req, res) {
    if (req.url === '/items') {
        scraper.scrapCategoriesAsync().map(function(data) {
            return scraper.scrapItemsFromACategoryAsync({ url: data.url, name: data.name, silent: false });
        })
        .then(function(data) {
            console.log('Done.');
            util.createResponse(200, data, res, 1);
        })
        .catch(function(error) {
            util.createResponse(500, error, res, 1);
            throw error;
        });
    } else if (req.url === '/categories') {
        scraper.scrapCategoriesAsync().then(function(data) {
            util.createResponse(200, data, res, 1);
        }).catch(function(error) {
            util.createResponse(500, error, res, 1);
        });
    } else {
        scraper.scrapAllData().then(function(data) {
            util.createResponse(200, data, res, 1);
        });
    }
});

server.listen(5555);