'use strict';

var Router =    require('../router'),
    path =      require('path');

describe('A Router', function() {
    

    it('should validate correct string route', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ]
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(0);

    });


    it('should validate correct string route with fix function', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ],
                fix: function(found) {
                    return found;
                }
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(0);

    });


    it('should validate correct regexp remote route with local rewrite function', function() {
        var routes = {
            test3: {
                rewrite: [
                    {
                        remote: /[a-z]+/,
                        local: function(remote) {
                            return remote;
                        }
                    }
                ]
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(0);

    });


    it('should validate route with correct skip', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ],
                skip: ['some', /stuff/]
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(0);

    });


    it('should invalidate route with missing remote', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        renote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ]
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(1);

    });


    it('should invalidate route with missing local', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        locale: path.join('some', 'dir')
                    }
                ]
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(1);

    });


    it('should invalidate route with incorrect remote type', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: function() {
                            return 'fail';
                        },
                        local: path.join('some', 'dir')
                    }
                ]
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(1);

    });


    it('should invalidate route with incorrect local type', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: /[a-z]+/
                    }
                ]
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(1);

    });


    it('should invalidate route with incorrect fix function', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ],
                fix: /[a-z]+/
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(1);

    });


    it('should invalidate route with incorrect skip', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ],
                skip: null
            }
        };

        var validationErrors = Router.validateRoutes(routes);

        expect(validationErrors.length).toBe(1);

    });


    it('should route file by string rule', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir/remap.js',
                        local: path.join('some', 'dir', 'remap.js')
                    }
                ]
            }
        };

        var router = new Router(routes);

        expect(router.remap('http://www.some.site/dir/remap.js')).toBe(path.join('some', 'dir', 'remap.js'));

    });


    it('should route multiple files by string rule', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ]
            }
        };

        var router = new Router(routes);

        expect(router.remap('http://www.some.site/dir/remap.js')).toBe(path.join('some', 'dir', 'remap.js'));
        expect(router.remap('http://www.some.site/dir/remap-also.js')).toBe(path.join('some', 'dir', 'remap-also.js'));
        expect(router.remap('http://www.some.site/dir/another-dir/stuff.js')).toBe(path.join('some', 'dir', 'another-dir', 'stuff.js'));

    });


    it('should route multiple files by regexp rule', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: /^http:\/\/www.([a-z]+)\.site\/dir\/([a-z]+)\.js$/,
                        local: path.join('some', 'dir', '$1', '$2.js')
                    }
                ]
            }
        };

        var router = new Router(routes);

        expect(router.remap('http://www.some.site/dir/remap.js')).toBe(path.join('some', 'dir', 'some', 'remap.js'));
        expect(router.remap('http://www.other.site/dir/remap.js')).toBe(path.join('some', 'dir', 'other', 'remap.js'));
        expect(router.remap('http://www.different.site/dir/stuff.js')).toBe(path.join('some', 'dir', 'different', 'stuff.js'));

    });


    it('should be able to modify filename with fix function', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ],
                fix: function(found) {
                    return found.replace('.js', '.php');
                }
            }
        };

        var router = new Router(routes);

        expect(router.remap('http://www.some.site/dir/remap.js')).toBe(path.join('some', 'dir', 'remap.php'));
        expect(router.remap('http://www.some.site/dir/remap-also.js')).toBe(path.join('some', 'dir', 'remap-also.php'));
        expect(router.remap('http://www.some.site/dir/another-dir/stuff.js')).toBe(path.join('some', 'dir', 'another-dir', 'stuff.php'));

    });


    it('should be able to skip files using skip array (strings)', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ],
                skip: ['http://www.some.site/dir/dont.js', 'http://www.some.site/dir/skip/']
            }
        };

        var router = new Router(routes);

        expect(router.remap('http://www.some.site/dir/remap.js')).toBe(path.join('some', 'dir', 'remap.js'));
        expect(router.remap('http://www.some.site/dir/dont.js')).toBe(false);
        expect(router.remap('http://www.some.site/dir/skip/dont2.js')).toBe(false);
        expect(router.remap('http://www.some.site/dir/another-dir/stuff.js')).toBe(path.join('some', 'dir', 'another-dir', 'stuff.js'));

    });


    it('should be able to skip files using skip array (regexp)', function() {
        var routes = {
            test: {
                rewrite: [
                    {
                        remote: 'http://www.some.site/dir',
                        local: path.join('some', 'dir')
                    }
                ],
                skip: [/http:\/\/www\.some\.site\/dir\/[a-z]+\/[a-z0-9]+\.js/]
            }
        };

        var router = new Router(routes);

        expect(router.remap('http://www.some.site/dir/remap.js')).toBe(path.join('some', 'dir', 'remap.js'));
        expect(router.remap('http://www.some.site/dir/another/dont.js')).toBe(false);
        expect(router.remap('http://www.some.site/dir/skip/dont2.js')).toBe(false);
        expect(router.remap('http://www.some.site/dir/stuff.js')).toBe(path.join('some', 'dir', 'stuff.js'));

    });
});
