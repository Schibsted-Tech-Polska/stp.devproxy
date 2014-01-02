/*
 * DevProxy v0.5.0
 *
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Schibsted Tech Polska
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
	Q =             require('q'),
	Router =        require('./router'),
	config =        require('./config'),
	log =           require('./log'),

	router = new Router(config.routes);


// resources server
http.createServer(function(req, res) {
	var remapped = router.remap(req.url);
    fs.readFile(remapped, {
        encoding: 'utf8'
    }, function(err, data) {

		if(err) {
			log.error(err);
		}

		res.writeHead(200, {
			'Content-Type': mime.lookup(remapped),
			'Content-Length': Buffer.byteLength(data)
		});

		res.end(data);
	});

}).listen(config.httpPort);
log.notice('file server running on port ' + config.httpPort);


// proxy server
httpProxy.createServer(function(req, res, proxy) {

	var remapped = router.remap(req.url),
		deferred = Q.defer(),
		buffer = httpProxy.buffer(req);

	if(remapped) {
		fs.exists(remapped, function(exists) {
			if(exists) {
				// file remapped and found in filesystem
				deferred.resolve();
			}
			else {
				// file remapped, but not found on local machine
				deferred.reject('file not found: ' + remapped);
			}
		});
	}
	else {
		// file not remapped, no need to notify
		deferred.reject();
	}

	// remapped and found - serve from local machine
	deferred.promise.then(function() {
		proxy.proxyRequest(req, res, {
			host: '127.0.0.1',
			port: config.httpPort,
			buffer: buffer
		});
	});

	// not remapped or not found - serve from original host
	deferred.promise.catch(function(reason) {
		log.warning(reason);
		proxy.proxyRequest(req, res, {
			host: req.headers.host,
			port: 80,
			buffer: buffer
		});
	});

}).listen(config.proxyPort);
log.notice('proxy server running on port ' + config.proxyPort);

