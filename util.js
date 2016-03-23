var createResponse = function(status, data, res, indent) {
    res.writeHead(status, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(data, null, indent));
};

module.exports = {
    createResponse: createResponse
};