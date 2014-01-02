'use strict';

module.exports = {

	proxyPort: 8000, // port on which proxy server will run
	httpPort: 9000, // port on which local file server will run

    /*
     * logging options
     * include/exclude array keys to control what should be logged in console
     * possible values: ['error', 'warning', 'notice']
     */
	log: ['error', 'warning', 'notice'],

    /*
     * routes describe rules used to map remote files into local
     *
     * structure:
     * routes: {
     *      (route name): {
     *          (array of rewrite rules as objects) rewrite: [
     *              {
     *                  remote: (rule pointing at remote resources, can be either string or regular expression)
     *                  local: (path to local resources, can be either string or function that will return a string)
     *              },
     *              ...
     *
     *          ],
     *          (function that will be called upon every match with found local path as an argument) fix: function(found) {
     *              ...
     *              return found;
     *          }
     *      },
     *      ...
     * }
     *
     */
	routes: {
		exampleRoute: {
			rewrite: [
				{
					remote: 'http://www.example.com/resources/js',
					local: 'c:\\git\\example\\src\\main\\webapp\\resources\\js\\'
				}
			],
			fix: function(found) {
                // remove revision version from found file name
				if(found.indexOf('?r=') > -1) {
					found = found.slice(0, found.indexOf('?r='));
				}
				return found;
			}
		}
	}
};
