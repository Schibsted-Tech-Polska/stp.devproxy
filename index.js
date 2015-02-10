/*
 * DevProxy v0.6.5
 *
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2014 Schibsted Tech Polska
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software. 
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
 * 
 */

'use strict';

var httpProxy =     require('http-proxy'),
    http =          require('http'),
    fs =            require('fs'),
    mime =          require('mime'),
    Router =        require('./router'),
    config =        require('./config'),
    log =           require('./log'),

    router = new Router(config.routes),
    proxy = httpProxy.createServer({}),
    interceptor = httpProxy.createServer({
        target: 'http://127.0.0.1:' + config.proxyPort
    }),

    errorHandler = function(type) {
        return function(err, req, res) {
            log.error(type + ' ' + err);
            if(res) {
                res.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                res.end(type);
            }
        };
    },
    proxyError = errorHandler('Proxy'),
    interceptorError = errorHandler('Intercepting proxy'),
    processError = errorHandler('Process');


// error handling
proxy.on('error', proxyError);
interceptor.on('error', interceptorError);


// resources server
http.createServer(function(req, res) {

    var remapped = router.remap('http://' + req.headers.host + req.url),
        mimeType = mime.lookup(remapped);

    res.writeHead(200, {
        'Content-Type': mimeType
    });
    fs.createReadStream(remapped).pipe(res);

}).listen(config.httpPort);
log.notice('file server running on port ' + config.httpPort);


// proxy server
http.createServer(function(req, res) {

    var remapped = router.remap(req.url),
        promise = new Promise(function(resolve, reject) {
            if(remapped) {
                fs.exists(remapped, function(exists) {
                    if(exists) {
                        fs.stat(remapped, function(err, stats) {
                            
                            if(err) {
                                reject(err);
                            }

                            if(stats.isDirectory()) {
                                // this is a directory, reject silently
                                // there is no way to know upfront what directory index
                                // is server configured to handle
                                reject();
                            }
                            else {
                                resolve();
                            }
                        });
                    }
                    else {
                        // file remapped, but not found on local machine
                        reject('file not found: ' + remapped);
                    }
                });
            }
            else {
                // file not remapped, no need to notify
                reject();
            }
        });


    // remapped and found - serve from local machine
    promise.then(function() {
        proxy.proxyRequest(req, res, {
            target: 'http://127.0.0.1:' + config.httpPort
        });
    });

    // not remapped or not found - serve from original host
    promise.catch(function(reason) {

        var port = 80,
            host = req.headers.host;

        if(req.headers.host.indexOf(':') !== -1) {
            port = host.slice(host.indexOf(':') + 1);
            host = host.slice(0, host.indexOf(':'));
        }

        if(reason) {
            log.warning(reason);
        }

        proxy.proxyRequest(req, res, {
            target: 'http://' + host + ':' + port
        });
    });

}).listen(config.proxyPort);
log.notice('proxy server running on port ' + config.proxyPort);

process.on('uncaughtException', function(e) {
    var ignore = [
        'ECONNRESET' // sometimes servers close connections unexpectedly, do not kill the process because of that
    ];

    if(ignore.indexOf(e.code) === -1) {
        processError(e.code);
        process.exit(1);
    }
});
