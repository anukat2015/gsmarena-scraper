var Promise = require('bluebird');
var request = require('request');
var cheerio = require('cheerio');
var config = require('./config');
var fs = require('fs');

var scrapCategories = function(callback) {
    request(config.category.url, function(error, response, html) {
        if (!error) {
            var data = [];
            var $ = cheerio.load(html);

            $(config.category.domString).map(function(i) {
                var $self = $(this);
                data[i] = {
                    name: $self.text().replace(/\s+phone(.*)/g, ''),
                    url: config.category.url + '/' + $self.attr('href'),
                };
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
        pageStart: (params.pageStart) ? params.pageStart : 0,
        silent: !!params.silent,
    };

    request(req.url, function(error, response, html) {
        if (!req.silent) console.log('Processing: ' + req.name);
        if (!error) {
            var data = [];
            var $ = cheerio.load(html);

            var $domObj = $(config.item.domString);
            if ($domObj.length > 0) {
                $domObj.map(function(i) {
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
            }

            var res = {
                brand: req.text,
                brandUrl: req.url,
                items: data,
            };
            callback(null, res);
        } else {
            callback(error);
        }
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
};