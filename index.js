/*
    Primary file for API
*/

//Dependencies
var http = require('http');
var url = require('url')
var stringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var https = require('https');
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers')
// var _data=require('./lib/data');
/*testing
//@TODO
_data.delete('tests','newFile',(err)=>{
    console.log("error is: ",err);
});
*/
//The server should respond to all requests with a a string
//Instantiating the http server
var httpServer = http.createServer((req, res) => {

    unifiedServer(req, res)

});
//Start the server and have it listen to port in config
httpServer.listen(config.httpPort, () => {
    console.log("The server is dead!.", config.httpPort)
    console.log("The environment running is: ", config.envName);
});
//Instantiate https Server
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions, (req, res) => {

    unifiedServer(req, res)

});
//Start https server
httpsServer.listen(config.httpsPort, () => {
    console.log("The server is dead!.", config.httpsPort)
    console.log("The environment running is: ", config.envName);
});
//Server logic for both http and https

var unifiedServer = (req, res) => {
    //Get the url and parse it
    var parsedUrl = url.parse(req.url, true);

    //Get the path from url
    var path = parsedUrl.pathname;//untrimed path
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as an object
    var queryStringObject = parsedUrl.query;

    //Get HTTP method

    var method = req.method.toLowerCase();

    //get headers as an object
    var headers = req.headers;


    //get the payload
    var decoder = new stringDecoder('utf-8');
    var buffer = '';
    req.on('data', (data) => {
        // console.log(data);
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();
        // res.end("hello worlds\n");
        //Log the request path
        // console.log(`The request is recieved on path: ${trimmedPath} with method: ${method} and the query string parameters are:` ,queryStringObject);

        //choose the handler this request should go to
        var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound
            ;
        //construct data obj to be sent to handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseTsonToObject(buffer),
        }
        //route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            //defaults
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            payload = typeof (payload) == 'object' ? payload : {};
            //convert payload obj to string
            var payloadString = JSON.stringify(payload);
            //return response
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log('returning this response: ', statusCode, payloadString);
        });


    });
    //Send the response
};

//Define a request router

var router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks,
}