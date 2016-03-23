var Promise = require('bluebird');
var request = require('request');
var cheerio = require('cheerio');
var config = require('./config');
var fs = require('fs');

var scrapCategories = function(params, callback) {
    var req = {
        start: (params.start) ? params.start : 0,
        limit: (params.limit) ? params.limit : Infinity,
        verbose: !!params.verbose,
    };

    request(config.category.url, function(error, response, html) {
        if (!error) {
            var data = [];
            var $ = cheerio.load(html);

            $(config.category.domString).map(function(i) {
                if (i >= req.limit) return false;
                
                var $self = $(this);
                data[i] = {
                    name: $self.text().replace(/\s+phone(.*)/g, ''),
                    url: config.baseUrl + '/' + $self.attr('href'),
                };

                if (req.verbose) console.log('Found: ' + data[i].name);
            });
            callback(null, data);
        } else {
            callback(error);
        }
    });
};

var scrapItemsFromACategory = function(params, callback) {
    var req = {
        name: params.name,
        url: params.url,
        data: params.data ? params.data : [],
        start: params.start ? params.start : 0,
        limit: params.limit ? params.limit : Infinity,
        verbose: !!params.verbose,
    };

    request(req.url, function(error, response, html) {
        if (req.verbose) console.log('Processing ' + req.name + ' (' + req.url + ')');
        if (!error) {
            var data = req.data;
            var $ = cheerio.load(html);

            var $domObj = $(config.item.domString);
            $domObj.map(function(i) {
                if (i >= req.limit) return false;

                var $self = $(this);
                var $img = $self.children('img');
                var $name = $self.children('strong');

                data[i] = {
                    name: $name.text(),
                    description: $img.attr('title'),
                    url: config.baseUrl + '/' + $self.attr('href'),
                    imageUrl: $img.attr('src'),
                };
            });

            var res = {
                brand: req.name,
                brandUrl: req.url,
                quantity: data.length,
                items: data,
            };
            if (req.data.length === 0) {
                callback(null, res);
            } else {
                res.items = res.items.concat(req.data);
                callback(null, res);
            }
        } else {
            callback(error);
        }
    });
};

var promiseFor = Promise.method(function(condition, action, value) {
    if (!condition(value)) return value;
    return action(value).then(promiseFor.bind(null, condition, action));
});

var getNextPage = function(params, callback) {
    var req = {
        url: params.url,
    };

    request(req.url, function(error, response, html) {
        if (!error) {
            var nextUrl = null;
            var $ = cheerio.load(html);

            var $linkNext = $('a.pages-next:not(".disabled")');
            if ($linkNext.length > 0) {
                nextUrl = config.baseUrl + '/' + $linkNext.attr('href');
            }

            callback(null, nextUrl);
        } else {
            callback(error);
        }
    });
};

var getPages = function(params, callback) {
    var req = {
        url: params.url,
        start: params.start ? params.start : 0,
        limit: params.limit ? params.limit : Infinity,
        verbose: !!params.verbose,
    };

    var getNextPageAsync = Promise.promisify(getNextPage);
    var urls = [req.url];
    promiseFor(
        function(count) {
            return count < req.limit;
        },
        function(count) {
            return getNextPageAsync({ url: urls[urls.length - 1] }).then(function(nextUrl) { 
                if (nextUrl === null) {
                    return count = req.limit;
                }

                urls.push(nextUrl);
                return ++count;
            });
        }, req.start)
    .then(function() {
        callback(null, urls);
    }).catch(function(error) {
        callback(error);
    });
};

var scrapContent = function(params, callback) {
    var req = {

    };
};

module.exports = {
    scrapCategories: scrapCategories,
    scrapItemsFromACategory: scrapItemsFromACategory,
    scrapContent: scrapContent,
    getPages: getPages,
};