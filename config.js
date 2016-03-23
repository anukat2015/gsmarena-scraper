module.exports = {
    baseUrl: 'http://www.gsmarena.com',
    category: {
        url: 'http://www.gsmarena.com/makers.php3',
        domString: '.main.main-makers tr > td:nth-child(2n) > a',
    },
    item: {
        domString: '.makers > ul > li > a',
    },
};