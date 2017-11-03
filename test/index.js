'use strict';

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');

const Recourier = require('../lib');

const lab = exports.lab = Lab.script();

lab.experiment('recourier', () => {

    let server;
    let modifier;

    const namespace = 'foo';
    const route = {
        path: '/{foo}',
        method: '*',
        handler: (request) => ({
            params: request.params,
            payload: request.payload,
            query: request.query
        })
    };

    lab.experiment('when the original request is modified during the lifecycle', () => {

        lab.beforeEach(async () => {

            modifier = (app, options) => {

                app.dependency('recourier', (instance) => {

                    instance.ext('onPreHandler', (request, h) => {

                        request.params = { baz: 'qux' };
                        request.payload = { baz: 'qux' };
                        request.query = { baz: 'qux' };

                        request.app.bar = {};

                        return h.continue;
                    });
                });
            };

            const plugins = [{
                plugin: Recourier,
                options: {
                    namespace,
                    properties: ['params', 'payload', 'query']
                }
            }, {
                plugin: {
                    name: 'baz-qux',
                    register: modifier
                }
            }];

            server = new Hapi.Server();
            await server.register(plugins);

            server.route(route);
        });

        lab.test('should keep integrity of the request parameters', async () => {

            const { result, statusCode } = await server.inject('/bar');

            Code.expect(statusCode).to.equal(200);
            Code.expect(result.params).to.equal({ foo: 'bar' });
            Code.expect(result.error).to.not.exist();
        });

        lab.test('should keep integrity of the request query', async () => {

            const { result, statusCode } = await server.inject('/foobar?foo=bar');

            Code.expect(statusCode).to.equal(200);
            Code.expect(result.query).to.equal({ foo: 'bar' });
            Code.expect(result.error).to.not.exist();
        });

        lab.test('should keep integrity of the request payload', async () => {

            const { result, statusCode } = await server.inject({
                url: '/foobar',
                method: 'POST',
                payload: {
                    foo: 'bar'
                }
            });

            Code.expect(statusCode).to.equal(200);
            Code.expect(result.payload).to.equal({ foo: 'bar' });
            Code.expect(result.error).to.not.exist();
        });
    });

    lab.experiment('when a plugin tries to change the immutable request namespace during the lifecycle', () => {

        lab.beforeEach(async () => {

            modifier = (app, options) => {

                app.ext('onPostAuth', (request, h) => {

                    try {
                        request.app[namespace] = {};
                    }
                    catch (error) {
                        return h.response({ error }).takeover();
                    }

                    return h.continue;
                });
            };

            const plugins = [{
                plugin: {
                    name: 'err',
                    register: modifier
                }
            }, {
                plugin: Recourier,
                options: { namespace }
            }];

            server = new Hapi.Server();
            await server.register(plugins);

            server.route(route);
        });

        lab.test('should throw an error about the occurence', async () => {

            const { result, statusCode } = await server.inject('/foobar');

            Code.expect(statusCode).to.equal(200);
            Code.expect(result.error).to.be.an.instanceof(TypeError);
            Code.expect(result.error.message).to.startWith('Cannot assign to read only property');
        });
    });

    lab.experiment('when a plugin tries to extend the imutable request namespace during the lifecycle', () => {

        lab.beforeEach(async () => {

            modifier = (app, options) => {

                app.ext('onPostAuth', (request, h) => {

                    try {
                        request.app[namespace].foo = 'bar';
                    }
                    catch (error) {
                        return h.response({ error }).takeover();
                    }

                    return h.continue;
                });
            };

            const plugins = [{
                plugin: {
                    name: 'err',
                    register: modifier
                }
            }, {
                plugin: Recourier,
                options: { namespace }
            }];

            server = new Hapi.Server();
            await server.register(plugins);

            server.route(route);
        });

        lab.test('should throw an error about the occurence', async () => {

            const { result, statusCode } = await server.inject('/foobar');

            Code.expect(statusCode).to.equal(200);
            Code.expect(result.error).to.be.an.instanceof(TypeError);
            Code.expect(result.error.message).to.endWith('object is not extensible');
        });
    });
});
