'use strict';

const Hoek = require('hoek');

const internals = {};

internals.onPostAuth = function (options) {

    return function (request, reply) {

        Object.defineProperty(request.app, `${options.namespace}`, { value: {} });

        options.properties.forEach((property) => {

            const current = request.app[options.namespace].request || {};
            request.app[options.namespace].request = Object.assign(current, {
                [property]: request[property]
            });
        });

        Object.seal(request.app[options.namespace]);

        reply.continue();
    };
};

internals.onPreHandler = function (options) {

    return function (request, reply) {

        options.properties.forEach((property) => {

            request[property] = Hoek.reach(request, `app.${options.namespace}.request.${property}`);
        });

        reply.continue();
    };
};

exports.register = function (server, options, next) {

    options = Object.assign({ namespace: 'recourier', properties: [] }, options);

    const plugins = Object.assign({}, server.registrations);
    delete plugins.recourier;

    const pluginNames = Object.keys(plugins);

    server.ext({
        type: 'onPostAuth',
        method: internals.onPostAuth(options),
        options: {
            before: pluginNames
        }
    });

    server.ext({
        type: 'onPreHandler',
        method: internals.onPreHandler(options),
        options: {
            after: pluginNames
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
