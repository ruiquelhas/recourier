# recourier
Immutable request properties for [hapi](https://github.com/hapijs/hapi).

[![NPM Version][fury-img]][fury-url] [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url] [![Dependencies][david-img]][david-url]

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

[coveralls-img]: https://coveralls.io/repos/ruiquelhas/recourier/badge.svg
[coveralls-url]: https://coveralls.io/github/ruiquelhas/recourier
[david-img]: https://david-dm.org/ruiquelhas/recourier.svg
[david-url]: https://david-dm.org/ruiquelhas/recourier
[fury-img]: https://badge.fury.io/js/recourier.svg
[fury-url]: https://badge.fury.io/js/recourier
[travis-img]: https://travis-ci.org/ruiquelhas/recourier.svg
[travis-url]: https://travis-ci.org/ruiquelhas/recourier
