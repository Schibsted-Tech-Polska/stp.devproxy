'use strict';

var path =  require('path'),
    log =   require('./log');

// exports is a Router constructor
module.exports = (function() {

    var Router = function(routes) {

		// check routes configuration during construction
        var validationErrors = Router.validateRoutes(routes);

        if(validationErrors.length === 0) {
            this._routes = routes;
        }
        else {
            this._routes = {};
            validationErrors.forEach(function(error) {
                log.error(error);
            });
        }
    };

	// helper method for iterating through routes
    Router.prototype.eachRoute = function(callback) {
        
        Object.keys(this._routes).forEach(function(route) {
            route = this._routes[route];
            callback.call(this, route);
        }.bind(this));

    };

    Router.validateRoutes = function(routes, errors) {

        errors = errors || [];

        Object.keys(routes).forEach(function(routeName) {
            var route = routes[routeName];

            errors = Router.validateRewrites(routeName, route, errors);
            errors = Router.validateFix(routeName, route, errors);
            errors = Router.validateSkip(routeName, route, errors);

        });

        return errors;

    };

	// route should conform to following rules:
	// - it's "remote" property representing path to resource on remote server should be either string or regular expression
	// - it's "local" property representing file system path to resource on local machine should be either string or function
    Router.validateRewrites = function(routeName, route, errors) {
    
        errors = errors || [];
        routeName = routeName || 'Unknown route';

        if(!Array.isArray(route.rewrite)) {
            errors.push(routeName + ' route has no rewrite rules');
        }
        else {
            route.rewrite.forEach(function(rewrite) {
                if(typeof rewrite.remote === 'undefined' || (typeof rewrite.remote !== 'string' && rewrite.remote.constructor !== RegExp)) {
                    errors.push(routeName + ' route has invalid rewrite.remote entry (expected string or regexp, but ' + typeof rewrite.remote + ' given)');
                }
                if(typeof rewrite.local === 'undefined' || (typeof rewrite.local !== 'string' && typeof rewrite.local !== 'function')) {
                    errors.push(routeName + ' route has invalid rewrite.local entry (expected string or function, but ' + typeof rewrite.local + ' given)');
                }
            });
        }

        return errors;

    };

	// custom fix function used for modifying file name before serving should be, um, function
    Router.validateFix = function(routeName, route, errors) {
        
        errors = errors || [];
        routeName = routeName || 'Unknown route';

        if(typeof route.fix !== 'undefined' && typeof route.fix !== 'function') {
            errors.push(routeName +  ' route has invalid fix function (' + typeof route.fix + ' given)');
        }

        return errors;
    };

	// skip should be array of strings or regular expressions pointing to remote resources that we want to exclude from rewriting
    Router.validateSkip = function(routeName, route, errors) {
        
        errors = errors || [];
        routeName = routeName || 'Unknown route';

        if(typeof route.skip !== 'undefined' && !Array.isArray(route.skip)) {
            errors.push(routeName +  ' route has invalid skip array (' + typeof route.skip + ' given)');
        }

        return errors;
    };

	// main method for mapping remote to local files
	// checks if url points to resource that should be mapped and shouldn't be skipped
    Router.prototype.remap = function(url) {

        var match,
            result = false;

        match = this.matchByRemote(url);
        if(match && !this.isSkipped(url, match.route.skip)) {
            result = this.rewriteByLocal(url, match.rewrite);
			if(result && match.route.fix) {
				try {
					result = match.route.fix(result);
				}
				catch(e) {
					log.error('in custom fix function, ' + e);
				}
			}
        }

        return result;

    };

    // method iterates over skip array and checks if given url matches a rule
    Router.prototype.isSkipped = function(url, skip) {

        var result = false;

        if(Array.isArray(skip)) {
            skip.forEach(function(s) {
                if(
                    (typeof s === 'string' && this.matchByString(url, s)) ||
                    (s.constructor === RegExp && this.matchByRegExp(url, s))
                ) {
                    result = true;
                }
            }.bind(this));
        }

        return result;

    };

    // method iterates over routes and checks if given url matches any route
    Router.prototype.matchByRemote = function(url) {

        var match = false;

        this.eachRoute(function(route) {
            if(Array.isArray(route.rewrite)) {
                route.rewrite.forEach(function(rewrite) {
                    if(
                        (typeof rewrite.remote === 'string' && this.matchByString(url, rewrite.remote)) ||
                        (rewrite.remote.constructor === RegExp && this.matchByRegExp(url, rewrite.remote))
                    ) {
                        match = {
                            route: route,
                            rewrite: rewrite
                        };
                    }
                }.bind(this));
            }
        });

        return match;

    };

    Router.prototype.matchByString = function(url, string) {

        return url.indexOf(string) === 0;

    };

    Router.prototype.matchByRegExp = function(url, regexp) {
        
        return regexp.exec(url);

    };

    // method takes url and matching rewrite route and calls approperiate rewrite method on url
    Router.prototype.rewriteByLocal = function(url, rewrite) {

        var result;

        if(typeof rewrite.local === 'string') {
            result = this.rewriteByLocalString(url, rewrite);
        }
        else if(typeof rewrite.local === 'function') {
            result = this.rewriteByLocalFunction(url, rewrite);
        }

        return result;
    };

    Router.prototype.rewriteByLocalString = function(url, rewrite) {
        
        var result,
            exec,
            local,
            i;

        if(typeof rewrite.remote === 'string') {
            result = rewrite.local + url.replace(rewrite.remote, '').split('/').join(path.sep);
        }
        else if(rewrite.remote.constructor === RegExp) {
            exec = rewrite.remote.exec(url);
            result = rewrite.local.slice(0);
            for(i = 1; i < exec.length; i++) {
                result = result.replace('$' + i, exec[i], 'g');
            }
        }

        return result;
    };

    Router.prototype.rewriteByLocalFunction = function(url, rewrite) {
        
        try {
            return rewrite.local.call(rewrite, url);
        }
        catch(e) {
            log.error('in custom local function, ' + e);
        }

    };

    return Router;

}());
