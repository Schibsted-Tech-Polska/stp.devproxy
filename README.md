# Table of Contents
* [What is it?](#what-is-it)
* [Requirements](#requirements)
* [Installation guide](#installation-guide)
* [Configuration](#configuration)
* [Known limitations](#known-limitations)
* [Contributing](#contributing)

# What is it?

Devproxy is a tool allowing you to serve resources from your local machine as if they came from the external server. Suppose your browser is calling for ```http://www.some.site.com/resources/js/underscore.js``` but is actually getting file from ```C:\site-repo\resources\js\underscore.js```. That way you can have hybrid local/production development environment and essentially develop with production data but on local files.


# Requirements:

* Node.js
* Git client
* Browser capable of using proxy server

# Installation guide

### 1. Install Node
Go to [nodejs.org](http://nodejs.org/).
PC version comes as a self-installing executable, Mac users will have to unzip the package and execute following commands from terminal:
```
./configure
make
sudo make install
```

### 2. Clone stp.devproxy
In your Git client clone this repository to whatever directory you'd like the proxy to be:
```git clone https://github.com/Schibsted-Tech-Polska/stp.devproxy.git```

### 3. Install dependencies 
Use command line or terminal and run this command inside project directory: ```npm install```

### 4. Configure stuff
(See [Configuration](#configuration) section)

### 5. Run proxy server:
```node devproxy.js```

If everything went fine, you should see two messages:
```NOTICE: file server running on port 9000
NOTICE: proxy server running on port 8000```

### 6. Tell the browser to proxy all traffic

Using Google Chrome as an example, install [Foxy Proxy](http://getfoxyproxy.org/chrome/standard/install.html).

After installation, there should be a fox icon to the right of an address bar. Click it, choose Options and then Add New Proxy. In Host or IP Address field type 127.0.0.1 and in Port field type 8000 (assuming you haven't changed default configuration). Close the whole tab, click on fox icon again and choose option Use proxy "127.0.0.1:8000" for all URLs.
Foxy Proxy allows for fast and easy switching between proxied and unproxied mode, use Disable FoxyProxy in dropdown menu to, well, disable FoxyProxy.

Voila! From now on, each request will be checked against rules you've defined and if the URL matches, your browser will get local file instead of remote.

# Configuration

Open and edit config.js file to configure the tool. 

## Ports

This tools needs two unused ports for proxy server and file server, by default they are 8000 and 9000, respectively. To set up these ports, use proxyPort and httpPort properties.

## Logging

When running, devproxy will output some messages into console. These include:
* Notices - general information about what's going on
* Warnings - non-critical errors, for example: remote url matches rewrite rule, but file was not found on local machine and proxy is forced to serve remote file
* Errors - more serious stuff, for example errors that came up while calling user's custom functions

To set up which messages should be logged, use log property.

## Setting up routes

Routes are set up in routes property. They consist of unique route names (that are object properties), like this:
```javascript
routes: {
    exampleProject: { ... },
    anotherExample: { ... },
    ...
}
```

Each route consists of rewrite array, and - optionally - fix function.
Rewrite array is a set of rules that describe how remote url correspond to local file. 

### String-based remote rules

Simplest way to remap resources is to do it directory-based, let's say you have JavaScript resources located at ```http://www.example.com/resources/js``` and you have your local repository at ```C:\git\example\src\main\webapp\resources\js```. All you need to do now is to setup routes like this (Windows users, keep in mind that you need double slashes):

```javascript
routes: {
    example: [
        {
            remote: 'http://www.example.com/resources/js',
            local: 'c:\\git\\example\\src\\resources\\js\\'
        }
    ]
}
```

### Regexp-based remote rules

If you need more flexibility, you can also specify remote rules as regular expressions. Use regexp literal in order to do that:

```javascript
routes: {
    example: [
        {
            remote: /^http:\/\/www.(example|stuff).com\/resources\/js\//,
            local: 'c:\\git\\example\\src\\resources\\js\\'
        }
    ]
}
```

If you'd like to use [parenthesized substring matches](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Parenthesized_Substring_Matches), use $1, $2 ... $n in your local rule. They'll get replaced by matched parenthesized substrings.

```javascript
routes: {
    example: [
        {
            remote: /^http:\/\/www.(example|stuff).com\/resources\/js\//,
            local: 'c:\\git\\example\\src\\resources\\$1\\js\\'
        }
    ]
}
```
Now, if your browser requests ```http://www.stuff.com/resources/js/underscore.js``` it will get it from ```c:\git\example\src\resources\stuff\js\underscore.js```

### Custom local functions

If you'd like to handle URL rewriting yourself, here's the way to do that:

```javascript
routes: {
    example: [
        {
            remote: 'http://www.example.com/resources/js',
            local: function(remote) {
                return remote.replace('http://www.example.com', '/usr/local');
            }
        }
    ]
}
```
Function recieves one parameter which is full URL to remote resource and you can do whatever you want with it, just make sure your function returns a string.

### Custom fix functions

Aside from mapping, you sometimes want to further modify found resource path.
Consider example: you're using directory-based mapping and your server gives you a remote path: ```http://www.example.com/resources/js/underscore.js?revision=de957d```
When it gets remapped, it will point to ```c:\git\example\src\resources\js\underscore.js?revision=de957d```, which is wrong, we don't want that ```?revision=de957d part```. Way to handle it is to include fix function:

```javascript
routes: {
    example: [
        {
            remote: 'http://www.example.com/resources/js',
            local: 'c:\\git\\example\\src\\resources\\js\\'
        }
    ],
    fix: function(found) {
        // remove revision version from found file name
        if(found.indexOf('?revision=') > -1) {
            found = found.slice(0, found.indexOf('?revision='));
        }
        return found;
    }
}
```

# Known limitations

* No SSL/HTTPS support (yet), requests that require SSL will just timeout after a while. This also means that VPN clients may cause trouble.


# Contributing

Everybody is invited to contribute, if you have an idea on how to improve/simplify this tool - awesome! :)

Automated tests are written in Jasmine, using jasmine-node module, and can be found in spec directory. Before pushing any code, please write tests and make sure your changes did not break anything. If you're new to jasmine-node, [this short article](http://blog.codeship.io/2013/08/20/testing-tuesday-19-how-to-test-node-js-applications-with-jasmine.html) will get you on right track.
