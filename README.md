# recourier
Immutable request properties for [hapi](https://github.com/hapijs/hapi).

[![NPM Version][version-img]][version-url] [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url] [![Dependencies][david-img]][david-url] [![Dev Dependencies][david-dev-img]][david-dev-url]

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Example 1](#example1)
  - [Example 2](#example2)

## Installation
Install via [NPM](https://www.npmjs.org).

```sh
$ npm install recourier
```

## Usage
Register the package as a server plugin, providing an optional namespace where the properties will be available during the request lifecycle (in case you want to access them during that period) and the list of the `hapi` request properties you effectively want to make immutable.

The initial values of those properties (i.e. when they are parsed by the `onPostAuth` extension point) will be saved in that immutable application namespace, which will then be again available in the request handler itself.

### Example 1

Avoid plugin registration ordering issues by registering `Recourier` in the last place.

```js
const Hapi = require('hapi');
const Recourier = require('recourier');
const MyPlugin = require('my-plugin');

const plugins = [{
    plugin: MyPlugin
}, {
    // any additional plugins
}, {
    plugin: Recourier,
    options: {
        namespace: 'foo', // defaults to 'recourier'
        properties: ['payload'] // immutable request properties
    }
}];

try {
    const server = new Hapi.Server();

    await server.register(plugins);
    await server.start();
}
catch (err) {
    throw err;
}
```

### Example 2

Avoid plugin registration ordering issues by using `server.dependency()`.

```js
const Hapi = require('hapi');
const Recourier = require('recourier');

const MyPlugin = {
    name: 'my-plugin',
    register: (server, options) => {

        server.dependency(Recourier.pkg.name, (app) => {
            // go nuts
        });
    }
};

const plugins = [{
    plugin: Recourier,
    options: {
        namespace: 'foo', // defaults to 'recourier'
        properties: ['payload'] // immutable request properties
    }
}, {
    plugin: MyPlugin
}, {
    // any additional plugins
}];

try {
    const server = new Hapi.Server();

    await server.register(plugins);
    await server.start();
}
catch (err) {
    throw err;
}
```

[coveralls-img]: https://img.shields.io/coveralls/ruiquelhas/recourier.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/ruiquelhas/recourier
[david-img]: https://img.shields.io/david/ruiquelhas/recourier.svg?style=flat-square
[david-url]: https://david-dm.org/ruiquelhas/recourier
[david-dev-img]: https://img.shields.io/david/dev/ruiquelhas/recourier.svg?style=flat-square
[david-dev-url]: https://david-dm.org/ruiquelhas/recourier?type=dev
[version-img]: https://img.shields.io/npm/v/recourier.svg?style=flat-square
[version-url]: https://www.npmjs.com/package/recourier
[travis-img]: https://img.shields.io/travis/ruiquelhas/recourier.svg?style=flat-square
[travis-url]: https://travis-ci.org/ruiquelhas/recourier
