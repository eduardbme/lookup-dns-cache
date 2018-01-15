'use strict';

const dns = require('dns');

const _ = require('lodash');
const async = require('async');
const rr = require('rr');

const IpAddressesTable = require('./IpAddressesTable');

// const IpV4AddressesTable = require('./IpV4AddressesTable');
// const IpV6AddressesTable = require('./IpV6AddressesTable');
//
// const ipv4AddressesTable = new IpV4AddressesTable();
// const ipv6AddressesTable = new IpV6AddressesTable();

const ipAddressesTable = new IpAddressesTable();

/**
 * Lookup method that uses IP cache(and DNS TTL) to resolve hostname avoiding system call via thread pool.
 *
 * @param {string} hostname
 * @param {Object} options
 * @param {number} options.family
 * @param {boolean} options.all
 * @param {Function} callback
 */
function lookup(hostname, options, callback) {
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    } else if (_.isNumber(options)) {
        options = { family: options };
    } else if (!_.isPlainObject(options)) {
        throw new Error('options must be an object or an ip version number');
    }

    if (!_.isFunction(callback)) {
        throw new Error('callback param must be a function');
    }

    if (!hostname) {
        if (options.all) {
            process.nextTick(callback, null, []);
        } else {
            process.nextTick(
                callback,
                null,
                null,
                options.family === 6 ? 6 : 4
            );
        }

        return {};
    }

    if (!_.isString(hostname)) {
        throw new Error('hostname must be a string');
    }

    switch (options.family) {
        case 4:
        case 6:
            return _iplookup(hostname, options, callback);
        case undefined:
            return _bothlookups(hostname, options, callback);
        default:
            throw new Error(
                'invalid family number, must be one of the {4, 6} or undefined'
            );
    }
}

/**
 * @param {string} hostname
 * @param {Object} options
 * @param {number} options.family
 * @param {boolean} options.all
 * @param {Function} callback
 * @private
 */
function _iplookup(hostname, options, callback) {
    ipAddressesTable.resolve(hostname, options, (error, records) => {
        if (error) {
            if (error.code === dns.NODATA) {
                const noDataError = makeNotFoundError(hostname, error.syscall);

                return callback(noDataError);
            }

            return callback(error);
        }

        if (!records) {
            // Corner case branch.
            //
            // Intensively calling `lookup` method in parallel can produce situations
            // when DNS TTL for particular IP has been exhausted,
            // but task queue within NodeJS is full of `resolved` callbacks.
            // No way to skip them or update DNS cache before them.
            //
            // So the work around is return undefined for that callbacks and client code should repeat `lookup` call.
            return _iplookup(hostname, options, callback);
        }

        if (options.all) {
            const result = records.map(record => {
                return {
                    address: record.address,
                    family: options.family
                };
            });

            return callback(null, result);
        }

        const nextRecord = rr(records)

        return callback(null, nextRecord.address, options.family);
    });
}

/**
 * @param {string} hostname
 * @param {Object} options
 * @param {number} options.family
 * @param {boolean} options.all
 * @param {Function} callback
 * @private
 */
function _bothlookups(hostname, options, callback) {
    async.parallel(
        [
            function(cb) {
                _iplookup(hostname, Object.assign({}, options, {family: 4}), (error, ...records) => {
                    if (error) {
                        if (error.code === dns.NOTFOUND) {
                            return cb(null, []);
                        }

                        return cb(error);
                    }

                    cb(null, ...records);
                });
            },
            function(cb) {
                _iplookup(hostname, Object.assign({}, options, {family: 6}), (error, ...records) => {
                    if (error) {
                        if (error.code === dns.NOTFOUND) {
                            return cb(null, []);
                        }

                        return cb(error);
                    }

                    cb(null, ...records);
                });
            }
        ],
        (error, records) => {
            if (error) {
                return callback(error);
            }

            const [ipv4records, ipv6records] = records;

            if (options.all) {
                const result = ipv4records.concat(ipv6records);

                if (_.isEmpty(result)) {
                    const noDataError = makeNotFoundError(hostname);

                    return callback(noDataError);
                }

                return callback(null, result);
            } else if (!_.isEmpty(ipv4records)) {
                return callback(null, ...ipv4records);
            } else if (!_.isEmpty(ipv6records)) {
                return callback(null, ...ipv6records);
            }

            const noDataError = makeNotFoundError(hostname);

            return callback(noDataError);
        }
    );
}

/**
 * @param {string} hostname
 * @param {string|undefined} syscall
 * @returns {Error}
 */
function makeNotFoundError(hostname, syscall) {
    let errorMessage = `${dns.NOTFOUND} ${hostname}`;

    if (syscall) {
        errorMessage = `${syscall} ${errorMessage}`;
    }

    const error = new Error(errorMessage);

    error.hostname = hostname;
    error.code = dns.NOTFOUND;
    error.errno = dns.NOTFOUND;

    if (syscall) {
        error.syscall = syscall;
    }

    return error;
}

module.exports = lookup;
