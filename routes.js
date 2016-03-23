var Promise = require('bluebird');
var express = require('express');
var scraper = Promise.promisifyAll(require('./scraper'));
var util = require('./util');
var config = require('./config');
var url = require('url');

var router = express.Router();


router.get('/items', function(req, res, next) {
    var query = url.parse(req.url, true).query;
    var params = {
        start: Number(query.start),
        limit: Number(query.limit),
        pageLimit: Number(query.pageLimit),
        verbose: !!query.verbose,
    };

    var promiseCache = [];
    var globalIndex = 0;
    scraper.scrapCategoriesAsync(params).map(function(data) {
        promiseCache.push(data);
        var p = {
            url: data.url,
            limit: params.pageLimit,
            verbose: params.verbose,
        };
        return scraper.getPagesAsync(p);
    })
    .map(function(pageUrls) {
        var promises = [];
        for (var i = 0; i < pageUrls.length; i++) {
            var p = {
                name: promiseCache[globalIndex].name,
                url: pageUrls[i],
                data: promiseCache[globalIndex].data,
                verbose: params.verbose,
            };
            promises.push(scraper.scrapItemsFromACategoryAsync(p));
        }
        globalIndex++;
        return Promise.all(promises);
    })
    .then(function(result) {
        for (var i = 0; i < result.length; i++) {
            var cache = {
                brand: '',
                brandUrls: [],
                quantity: 0,
                items: []
            };
            result[i].forEach(function(d2) {
                cache.brand = d2.brand;
                cache.brandUrls.push(d2.brandUrl);
                cache.quantity += d2.quantity;
                cache.items = cache.items.concat(d2.items)
            });
            result[i] = cache;
        };

        return Promise.resolve(result);
    })
    .then(function(data) {
        console.log('Done.');

        util.createResponse(200, data, res, 1);
    })
    .catch(function(error) {
        util.createResponse(500, error, res, 1);
        throw error;
    });
});

router.get('/categories' , function(req, res, next) {
    var query = url.parse(req.url, true).query;
    var params = {
        start: Number(query.start),
        limit: Number(query.limit),
        verbose: !!query.verbose,
    };

    scraper.scrapCategoriesAsync(params).then(function(data) {
        util.createResponse(200, data, res, 1);
    }).catch(function(error) {
        util.createResponse(500, error, res, 1);
    });
});

module.exports = router;