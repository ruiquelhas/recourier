'use strict';

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');

const Recourier = require('../lib');

const lab = exports.lab = Lab.script();

lab.experiment('recourier', () => {

    let server;

    const namespace = 'foo';
    const route = {
        path: '/{foo}',
        method: '*',
        handler: (request, reply) => {

            reply({
                params: request.params,
                payload: request.payload,
                query: request.query
            });
        }
    };

    lab.experiment('when the original request is modified in its lifecycle', () => {

        lab.beforeEach((done) => {

            server = new Hapi.Server();
            server.connection();

            const plugins = [{
                register: (function () {

                    const plugin = (app, options, next) => {

                        app.ext('onPostAuth', (request, reply) => {

                            request.params = { baz: 'qux' };
                            request.payload = { baz: 'qux' };
                            request.query = { baz: 'qux' };

                            request.app.bar = {};

                            reply.continue();
                        });

                        next();
                    };

                    plugin.attributes = { name: 'baz-qux' };

                    return plugin;
                }())
            }, {
                register: Recourier,
                options: {
                    namespace: namespace,
                    properties: ['params', 'payload', 'query']
                }
            }];

            server.register(plugins, (err) => {

                if (err) {
                    return done(err);
                }

                server.route(route);

                done();
            });
        });

        lab.test('should keep integrity of the request parameters', (done) => {

            server.inject('/bar', (response) => {

                Code.expect(response.statusCode).to.equal(200);
                Code.expect(response.result.params).to.equal({ foo: 'bar' });
                Code.expect(response.result.error).to.not.exist();
                done();
            });
        });

        lab.test('should keep integrity of the request query', (done) => {

            server.inject('/foobar?foo=bar', (response) => {

                Code.expect(response.statusCode).to.equal(200);
                Code.expect(response.result.query).to.equal({ foo: 'bar' });
                Code.expect(response.result.error).to.not.exist();
                done();
            });
        });

        lab.test('should keep integrity of the request payload', (done) => {

            server.inject({ url: '/foobar', method: 'POST', payload: { foo: 'bar' } }, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                Code.expect(response.result.payload).to.equal({ foo: 'bar' });
                Code.expect(response.result.error).to.not.exist();
                done();
            });
        });
    });

    lab.experiment('when something tries to change the sealed request copy in its lifecycle', () => {

        lab.beforeEach((done) => {

            server = new Hapi.Server();
            server.connection();

            const plugins = [{
                register: (function () {

                    const plugin = (app, options, next) => {

                        app.ext('onPostAuth', (request, reply) => {

                            try {
                                request.app[namespace] = {};
                            }
                            catch (err) {
                                return reply({ error: err });
                            }

                            reply.continue();
                        });

                        next();
                    };

                    plugin.attributes = { name: 'err' };

                    return plugin;
                }())
            }, {
                register: Recourier,
                options: {
                    namespace: namespace,
                    properties: ['params', 'payload', 'query']
                }
            }];

            server.register(plugins, (err) => {

                if (err) {
                    return done(err);
                }

                server.route(route);

                done();
            });
        });

        lab.test('should throw an error about the occurence', (done) => {

            server.inject('/foobar', (response) => {

                Code.expect(response.statusCode).to.equal(200);
                Code.expect(response.result.error).to.be.an.instanceof(TypeError);
                Code.expect(response.result.error.message).to.startWith('Cannot assign to read only property');
                done();
            });
        });
    });
});
