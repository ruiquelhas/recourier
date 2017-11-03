'use strict';

const Hoek = require('hoek');

const internals = {};

internals.onPostAuth = function (options) {

    return function (request, h) {

        Object.defineProperty(request.app, `${options.namespace}`, { value: {} });

        options.properties.forEach((property) => {

            const current = request.app[options.namespace].request || {};
            request.app[options.namespace].request = Object.assign(current, {
                [property]: request[property]
            });
        });

        Object.seal(request.app[options.namespace]);

        return h.continue;
    };
};

internals.onPreHandler = function (options) {

    return function (request, h) {

        options.properties.forEach((property) => {

            request[property] = Hoek.reach(request, `app.${options.namespace}.request.${property}`);
        });

        return h.continue;
    };
};

internals.register = function (server, options) {

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
};

module.exports = {
    pkg: require('../package.json'),
    register: internals.register
};
