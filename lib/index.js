'use strict';

const _ = {
    get: require('lodash.get'),
    keys: require('lodash.keys'),
    omit: require('lodash.omit'),
    set: require('lodash.set')
};

const internals = {};

internals.onPostAuth = function (options) {

    return function (request, reply) {

        Object.defineProperty(request.app, `${options.namespace}`, { value: {} });

        options.properties.forEach((property) => {

            const path = `${options.namespace}.request.${property}`;
            _.set(request.app, path, request[property]);
        });

        Object.seal(request.app[options.namespace]);

        reply.continue();
    };
};

internals.onPreHandler = function (options) {

    return function (request, reply) {

        options.properties.forEach((property) => {

            const path = `${options.namespace}.request.${property}`;
            _.set(request, `${property}`, _.get(request.app, path));
        });

        reply.continue();
    };
};

exports.register = function (server, options, next) {

    options = Object.assign({ namespace: 'recourier', properties: [] }, options);

    const plugins = _.keys(_.omit(server.registrations, 'recourier'));

    server.ext({
        type: 'onPostAuth',
        method: internals.onPostAuth(options),
        options: {
            before: plugins
        }
    });

    server.ext({
        type: 'onPreHandler',
        method: internals.onPreHandler(options),
        options: {
            after: plugins
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
