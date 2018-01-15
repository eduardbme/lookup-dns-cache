'use strict';

const dns = require('dns');
const net = require('net');

const async = require('async');
const { assert } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const mockedData = require('./mockedData');

const addresses = require('./addresses');

describe("must correct process 'hostname' param", () => {
    const invalidData = [true, 1, [], {}, () => {}, Buffer.alloc(0)];

    invalidData.forEach(invalidHostname => {
        it(`must throw an exception, cuz 'hostname' param has type ${Object.prototype.toString.call(
            invalidHostname
        )}`, () => {
            const { lookup } = require('../../');

            assert.throws(
                () => {
                    lookup(invalidHostname, {}, () => {});
                },
                Error,
                'hostname must be a string'
            );
        });
    });

    it('must work just fine for correct hostname param', done => {
        const { lookup } = require('../../');

        const expectedIpFamily = 4;

        lookup(
            addresses.INET_HOST,
            expectedIpFamily,
            (error, address, family) => {
                assert.ifError(error);
                assert.isTrue(net.isIPv4(address));
                assert.strictEqual(family, expectedIpFamily);

                done();
            }
        );
    });

    const falsyValues = [false, null, undefined, 0, NaN, ''];

    const optionsValues = [
        {
            options: {},
            expectedError: null,
            expectedAddress: null,
            expectedFamily: 4
        },
        {
            options: { all: false },
            expectedError: null,
            expectedAddress: null,
            expectedFamily: 4
        },
        {
            options: { all: false, family: 6 },
            expectedError: null,
            expectedAddress: null,
            expectedFamily: 6
        },
        {
            options: { all: true },
            expectedError: null,
            expectedAddress: [],
            expectedFamily: undefined
        },
        {
            options: { all: true, family: 6 },
            expectedError: null,
            expectedAddress: [],
            expectedFamily: undefined
        }
    ];

    falsyValues.forEach(hostname => {
        optionsValues.forEach(optionsValue => {
            const options = optionsValue.options;

            it(`must return correct value for hostname === ${hostname}, and options === ${JSON.stringify(
                options
            )}`, done => {
                const { lookup } = require('../../');

                lookup(hostname, options, (error, address, family) => {
                    assert.strictEqual(error, optionsValue.expectedError);
                    assert.deepEqual(address, optionsValue.expectedAddress);
                    assert.strictEqual(family, optionsValue.expectedFamily);

                    done();
                });
            });
        });
    });
});

describe('must correct process `options` param', () => {
    const invalidOptions = [undefined, null, false, '1', [], Buffer.alloc(0)];

    const validOptions = [4, 6];

    invalidOptions.forEach(invalidOption => {
        it(`must throw an exception if 'options' param has type ${Object.prototype.toString.call(
            invalidOption
        )}`, () => {
            const { lookup } = require('../../');

            assert.throws(
                () => {
                    lookup(addresses.INET_HOST, invalidOption, () => {});
                },
                Error,
                'options must be an object or an ip version number'
            );
        });
    });

    validOptions.forEach(ipFamily => {
        it(`must correct call lookup method if 'options' param has value - ${ipFamily}`, () => {
            const { lookup } = require('../../');

            lookup(addresses.INET_HOST, ipFamily, (error, address, family) => {
              assert.ifError(error);

              ipFamily === 4 && assert.isTrue(net.isIPv4(address));
              ipFamily === 6 && assert.isTrue(net.isIPv6(address));

              assert.strictEqual(family, ipFamily);
            });
        });
    });

    it('must correct call lookup method if `options` param is ommited', () => {
        const { lookup } = require('../../');

        lookup(null, (error, address, family) => {
            assert.strictEqual(error, null);
            assert.deepEqual(address, null);
            assert.strictEqual(family, 4);

            done();
        });
    });
});

describe('must correct lookup for all IPv4 and IPv6 addresses', () => {
    const testCases = [
        {
            title: 'must correct lookup all IPv4 addresses',
            family: 4,
            expectedAddressIps: [net.isIPv4],
            expectedIpFamilies: [4]
        },
        {
            title: 'must correct lookup all IPv6 addresses',
            family: 6,
            expectedAddressIps: [net.isIPv6],
            expectedIpFamilies: [6]
        },
        {
            title: 'must correct lookup all IPv4 and IPv6 addresses',
            family: undefined,
            expectedAddressIps: [net.isIPv4, net.isIPv6],
            expectedIpFamilies: [4, 6]
        }
    ];

    testCases.forEach(testCase => {
        it(testCase.title, function(done) {
            this.timeout(15 * 1000);

            const { lookup } = require('../../');

            lookup(
                addresses.INET_HOST,
                { all: true, family: testCase.family },
                (err, ips) => {
                    assert.ifError(err);

                    assert.isTrue(Array.isArray(ips));

                    assert.isTrue(
                        ips.every(ip => {
                            return (
                                testCase.expectedAddressIps.some(func =>
                                    func(ip.address)
                                ) &&
                                testCase.expectedIpFamilies.includes(ip.family)
                            );
                        })
                    );

                    done();
                }
            );
        });
    });
});

describe('must correct lookup for one IPv4/IPv6 address', () => {
    const testCases = [
        {
            title: 'must correct lookup IPv4 address',
            family: 4,
            expectedAddressIp: net.isIPv4,
            expectedIpFamily: 4
        },
        {
            title: 'must correct lookup IPv6 address',
            family: 6,
            expectedAddressIp: net.isIPv6,
            expectedIpFamily: 6
        }
    ];

    testCases.forEach(testCase => {
        it(testCase.title, function(done) {
            this.timeout(15 * 1000);
            const { lookup } = require('../../');

            lookup(
                addresses.INET_HOST,
                { family: testCase.family },
                (err, address, family) => {
                    assert.ifError(err);

                    assert.isTrue(testCase.expectedAddressIp(address));
                    assert.strictEqual(testCase.expectedIpFamily, family);

                    done();
                }
            );
        });
    });
});

describe('', () => {
    it('test 2', done => {
        const { lookup } = require('../../');
        const expectedIpFamily = 4;

        lookup(addresses.INET4_HOST, (error, address, family) => {
            assert.ifError(error);

            assert.isTrue(net.isIPv4(address));
            assert.strictEqual(family, expectedIpFamily);

            done();
        });
    });

    it('test 3', done => {
        const { lookup } = require('../../');

        lookup(null, { all: true }, function(err, ips, family) {
            assert.ifError(err);

            assert.ok(Array.isArray(ips));

            assert.strictEqual(ips.length, 0);

            done();
        });
    });

    it('must correct resolve one IPv4 address', done => {
        const expectedAddress = mockedData.ipv4.addresses[0];
        const expectedFamily = mockedData.ipv4.family;

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, [{ address: expectedAddress, ttl: 1 }]);
                });
            },
            resolve6: () => {},
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup(
            'dummy-url',
            { all: false, family: 4 },
            (error, address, family) => {
                assert.ifError(error);

                assert.strictEqual(address, expectedAddress);
                assert.strictEqual(family, expectedFamily);

                assert.isTrue(resolve4Spy.calledOnce);

                assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve4Spy.getCall(0).args[2]);

                assert.isTrue(resolve6Spy.notCalled);

                done();
            }
        );
    });

    it('must correct resolve all IPv4 addresses', done => {
        const resolve4Output = [
            { address: mockedData.ipv4.addresses[0], ttl: 1 },
            { address: mockedData.ipv4.addresses[1], ttl: 1 }
        ];

        const expectedResult = [
            {
                address: mockedData.ipv4.addresses[0],
                family: mockedData.ipv4.family
            },
            {
                address: mockedData.ipv4.addresses[1],
                family: mockedData.ipv4.family
            }
        ];

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve4Output);
                });
            },
            resolve6: () => {},
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: true, family: 4 }, (error, ips) => {
            assert.ifError(error);

            assert.deepEqual(ips, expectedResult);

            assert.isTrue(resolve4Spy.calledOnce);

            assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve4Spy.getCall(0).args[2]);

            assert.isTrue(resolve6Spy.notCalled);

            done();
        });
    });

    it('must correct resolve one IPv6 address', done => {
        const expectedAddress = mockedData.ipv6.addresses[0];
        const expectedFamily = mockedData.ipv6.family;

        const dnsProxyquire = {
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, [{ address: expectedAddress, ttl: 1 }]);
                });
            },
            resolve4: () => {},
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup(
            'dummy-url',
            { all: false, family: 6 },
            (error, address, family) => {
                assert.ifError(error);

                assert.strictEqual(address, expectedAddress);
                assert.strictEqual(family, expectedFamily);

                assert.isTrue(resolve4Spy.notCalled);

                assert.isTrue(resolve6Spy.calledOnce);

                assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve6Spy.getCall(0).args[2]);

                done();
            }
        );
    });

    it('must correct resolve all IPv6 addresses', done => {
        const resolve6Output = [
            { address: mockedData.ipv6.addresses[0], ttl: 1 },
            { address: mockedData.ipv6.addresses[1], ttl: 1 }
        ];

        const expectedResult = [
            {
                address: mockedData.ipv6.addresses[0],
                family: mockedData.ipv6.family
            },
            {
                address: mockedData.ipv6.addresses[1],
                family: mockedData.ipv6.family
            }
        ];

        const dnsProxyquire = {
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve6Output);
                });
            },
            resolve4: () => {},
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: true, family: 6 }, (error, ips) => {
            assert.ifError(error);

            assert.deepEqual(ips, expectedResult);

            assert.isTrue(resolve4Spy.notCalled);

            assert.isTrue(resolve6Spy.calledOnce);

            assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve6Spy.getCall(0).args[2]);

            done();
        });
    });

    it('must correct resolve one available IPv4 address', done => {
        const expectedAddress = mockedData.ipv4.addresses[0];
        const expectedFamily = mockedData.ipv4.family;

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, [{ address: expectedAddress, ttl: 1 }]);
                });
            },
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: false }, (error, address, family) => {
            assert.ifError(error);

            assert.strictEqual(address, expectedAddress);
            assert.strictEqual(family, expectedFamily);

            assert.isTrue(resolve4Spy.calledOnce);

            assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve4Spy.getCall(0).args[2]);

            assert.isTrue(resolve6Spy.calledOnce);

            assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve6Spy.getCall(0).args[2]);

            done();
        });
    });

    it('must correct resolve one available IPv6 address', done => {
        const expectedAddress = mockedData.ipv6.addresses[0];
        const expectedFamily = mockedData.ipv6.family;

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, [{ address: expectedAddress, ttl: 1 }]);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: false }, (error, address, family) => {
            assert.ifError(error);

            assert.strictEqual(address, expectedAddress);
            assert.strictEqual(family, expectedFamily);

            assert.isTrue(resolve4Spy.calledOnce);

            assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve4Spy.getCall(0).args[2]);

            assert.isTrue(resolve6Spy.calledOnce);

            assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve6Spy.getCall(0).args[2]);

            done();
        });
    });

    it('must correct resolve all available IPv4 addresses', done => {
        const resolve4Output = [
            { address: mockedData.ipv4.addresses[0], ttl: 1 },
            { address: mockedData.ipv4.addresses[1], ttl: 1 }
        ];

        const expectedResult = [
            {
                address: mockedData.ipv4.addresses[0],
                family: mockedData.ipv4.family
            },
            {
                address: mockedData.ipv4.addresses[1],
                family: mockedData.ipv4.family
            }
        ];

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve4Output);
                });
            },
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: true }, (error, ips) => {
            assert.ifError(error);

            assert.deepEqual(ips, expectedResult);

            assert.isTrue(resolve4Spy.calledOnce);

            assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve4Spy.getCall(0).args[2]);

            assert.isTrue(resolve6Spy.calledOnce);

            assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve6Spy.getCall(0).args[2]);

            done();
        });
    });

    it('must correct resolve all available IPv6 addresses', done => {
        const resolve6Output = [
            { address: mockedData.ipv6.addresses[0], ttl: 1 },
            { address: mockedData.ipv6.addresses[1], ttl: 1 }
        ];

        const expectedResult = [
            {
                address: mockedData.ipv6.addresses[0],
                family: mockedData.ipv6.family
            },
            {
                address: mockedData.ipv6.addresses[1],
                family: mockedData.ipv6.family
            }
        ];

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve6Output);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: true }, (error, ips) => {
            assert.ifError(error);

            assert.deepEqual(ips, expectedResult);

            assert.isTrue(resolve4Spy.calledOnce);

            assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve4Spy.getCall(0).args[2]);

            assert.isTrue(resolve6Spy.calledOnce);

            assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve6Spy.getCall(0).args[2]);

            done();
        });
    });

    it('must correct throw an error if there is no available IPv4 address', done => {
        const expectedError = mockedData.noDataError;

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            resolve6: (...args) => {},
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: false, family: 4 }, error => {
            assert.deepEqual(error, expectedError);

            assert.isTrue(resolve4Spy.calledOnce);

            assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve4Spy.getCall(0).args[2]);

            assert.isTrue(resolve6Spy.notCalled);

            done();
        });
    });

    it('must correct throw an error if there are no available IPv4 addresses', done => {
        const expectedError = mockedData.noDataError;

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            resolve6: (...args) => {},
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: true, family: 4 }, error => {
            assert.deepEqual(error, expectedError);

            assert.isTrue(resolve4Spy.calledOnce);

            assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve4Spy.getCall(0).args[2]);

            assert.isTrue(resolve6Spy.notCalled);

            done();
        });
    });

    it('must correct throw an error if there is no available IPv6 address', done => {
        const expectedError = mockedData.noDataError;

        const dnsProxyquire = {
            resolve4: (...args) => {},
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: false, family: 6 }, error => {
            assert.deepEqual(error, expectedError);

            assert.isTrue(resolve4Spy.notCalled);

            assert.isTrue(resolve6Spy.calledOnce);

            assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve6Spy.getCall(0).args[2]);

            done();
        });
    });

    it('must correct throw an error if there are no available IPv6 addresses', done => {
        const expectedError = mockedData.noDataError;

        const dnsProxyquire = {
            resolve4: (...args) => {},
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: true, family: 6 }, error => {
            assert.deepEqual(error, expectedError);

            assert.isTrue(resolve4Spy.notCalled);

            assert.isTrue(resolve6Spy.calledOnce);

            assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve6Spy.getCall(0).args[2]);

            done();
        });
    });

    it('must correct throw an error, if there is no IPv4 and IPv6 addresses available', done => {
        const expectedError = mockedData.noDataError;

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(mockedData.noDataError);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        lookup('dummy-url', { all: false }, error => {
            assert.instanceOf(error, Error);
            assert.deepEqual(error.code, expectedError.code);

            assert.isTrue(resolve4Spy.calledOnce);

            assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve4Spy.getCall(0).args[2]);

            assert.isTrue(resolve6Spy.calledOnce);

            assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

            assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
            assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
            assert.isFunction(resolve6Spy.getCall(0).args[2]);

            done();
        });
    });

    it('must use cache in order to lookup IPv4 address several times', done => {
        const resolve4Output = [
            { address: mockedData.ipv4.addresses[0], ttl: 1 },
            { address: mockedData.ipv4.addresses[1], ttl: 1 }
        ];

        const expectedResult = [
            [mockedData.ipv4.addresses[0], mockedData.ipv4.family],
            [mockedData.ipv4.addresses[1], mockedData.ipv4.family]
        ];

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve4Output);
                });
            },
            resolve6: (...args) => {},
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        async.parallel(
            [
                cb => {
                    lookup('dummy-url', { all: false, family: 4 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 4 }, cb);
                }
            ],
            (error, result) => {
                assert.ifError(error);

                assert.isTrue(resolve4Spy.calledOnce);

                assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve4Spy.getCall(0).args[2]);

                assert.isTrue(resolve6Spy.notCalled);

                assert.deepEqual(result, expectedResult);

                done();
            }
        );
    });

    it('must use cache in order to lookup IPv6 address several times', done => {
        const resolve6Output = [
            { address: mockedData.ipv6.addresses[0], ttl: 1 },
            { address: mockedData.ipv6.addresses[1], ttl: 1 }
        ];

        const expectedResult = [
            [mockedData.ipv6.addresses[0], mockedData.ipv6.family],
            [mockedData.ipv6.addresses[1], mockedData.ipv6.family]
        ];

        const dnsProxyquire = {
            resolve4: (...args) => {},
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve6Output);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        async.parallel(
            [
                cb => {
                    lookup('dummy-url', { all: false, family: 6 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 6 }, cb);
                }
            ],
            (error, result) => {
                assert.ifError(error);

                assert.isTrue(resolve4Spy.notCalled);

                assert.isTrue(resolve6Spy.calledOnce);

                assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve6Spy.getCall(0).args[2]);

                assert.deepEqual(result, expectedResult);

                done();
            }
        );
    });

    it('must use cache in order to lookup IPv4 and IPv6 addresses several times', done => {
        const resolve4Output = [
            { address: mockedData.ipv4.addresses[0], ttl: 1 },
            { address: mockedData.ipv4.addresses[1], ttl: 1 }
        ];

        const resolve6Output = [
            { address: mockedData.ipv6.addresses[0], ttl: 1 },
            { address: mockedData.ipv6.addresses[1], ttl: 1 }
        ];

        const expectedResult = [
            [mockedData.ipv4.addresses[0], mockedData.ipv4.family],
            [mockedData.ipv4.addresses[1], mockedData.ipv4.family],
            [mockedData.ipv6.addresses[0], mockedData.ipv6.family],
            [mockedData.ipv6.addresses[1], mockedData.ipv6.family]
        ];

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve4Output);
                });
            },
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve6Output);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        async.parallel(
            [
                cb => {
                    lookup('dummy-url', { all: false, family: 4 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 4 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 6 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 6 }, cb);
                }
            ],
            (error, result) => {
                assert.ifError(error);

                assert.isTrue(resolve4Spy.calledOnce);

                assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve6Spy.getCall(0).args[2]);

                assert.isTrue(resolve6Spy.calledOnce);

                assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve6Spy.getCall(0).args[2]);

                assert.deepEqual(result, expectedResult);

                done();
            }
        );
    });

    it('must return an error, if there was some problem to resolve IPv4', done => {
        const expectedError = new Error('some error');

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(expectedError);
                });
            },
            resolve6: (...args) => {},
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        async.parallel(
            [
                cb => {
                    lookup('dummy-url', { all: false, family: 4 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 4 }, cb);
                }
            ],
            error => {
                assert.instanceOf(error, Error);
                assert.strictEqual(error.message, expectedError.message);

                assert.isTrue(resolve4Spy.calledOnce);

                assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve4Spy.getCall(0).args[2]);

                assert.isTrue(resolve6Spy.notCalled);

                done();
            }
        );
    });

    it('must return an error, if there was some problem to resolve IPv6', done => {
        const expectedError = new Error('some error');

        const dnsProxyquire = {
            resolve4: (...args) => {},
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(expectedError);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        async.parallel(
            [
                cb => {
                    lookup('dummy-url', { all: false, family: 6 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 6 }, cb);
                }
            ],
            error => {
                assert.instanceOf(error, Error);
                assert.strictEqual(error.message, expectedError.message);

                assert.isTrue(resolve4Spy.notCalled);

                assert.isTrue(resolve6Spy.calledOnce);

                assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve6Spy.getCall(0).args[2]);

                done();
            }
        );
    });

    it('must return an error, if there was some problem to resolve IPv4 and IPv6', done => {
        const expectedError = new Error('some error');

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(expectedError);
                });
            },
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(expectedError);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        async.parallel(
            [
                cb => {
                    lookup('dummy-url', { all: false, family: 4 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 6 }, cb);
                }
            ],
            error => {
                assert.instanceOf(error, Error);
                assert.strictEqual(error.message, expectedError.message);

                assert.isTrue(resolve4Spy.calledOnce);

                assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve4Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve4Spy.getCall(0).args[2]);

                assert.isTrue(resolve6Spy.calledOnce);

                assert.strictEqual(resolve6Spy.getCall(0).args.length, 3);

                assert.strictEqual(resolve6Spy.getCall(0).args[0], 'dummy-url');
                assert.deepEqual(resolve6Spy.getCall(0).args[1], { ttl: true });
                assert.isFunction(resolve6Spy.getCall(0).args[2]);

                done();
            }
        );
    });

    it.skip('must update cache for address if TTL was exhausted', done => {
        const resolve4Output = [
            { address: mockedData.ipv4.addresses[0], ttl: 0 },
            { address: mockedData.ipv4.addresses[1], ttl: 0 }
        ];

        const resolve6Output = [
            { address: mockedData.ipv6.addresses[0], ttl: 0 },
            { address: mockedData.ipv6.addresses[1], ttl: 0 }
        ];

        const dnsProxyquire = {
            resolve4: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve4Output);
                });
            },
            resolve6: (...args) => {
                const cb = args[args.length - 1];

                setImmediate(() => {
                    cb(null, resolve6Output);
                });
            },
            '@global': true
        };

        const { lookup } = proxyquire('../../', {
            dns: dnsProxyquire
        });

        const resolve4Spy = sinon.spy(dnsProxyquire, 'resolve4');
        const resolve6Spy = sinon.spy(dnsProxyquire, 'resolve6');

        async.parallel(
            [
                cb => {
                    lookup('dummy-url', { all: false, family: 4 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 4 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 6 }, cb);
                },
                cb => {
                    lookup('dummy-url', { all: false, family: 6 }, cb);
                }
            ],
            error => {
                assert.ifError(error);

                // assert.isTrue(resolve4Spy.calledTwice);

                // assert.strictEqual(resolve4Spy.getCall(0).args.length, 3);
                //
                // assert.strictEqual(resolve4Spy.getCall(0).args[0], 'dummy-url');
                // assert.deepEqual(resolve4Spy.getCall(0).args[1], {ttl: true});
                // assert.isFunction(resolve4Spy.getCall(0).args[2]);

                // assert.isTrue(resolve6Spy.calledTwice);

                done();
            }
        );
    });
});
