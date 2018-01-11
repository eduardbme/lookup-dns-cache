'use strict';

const _ = require('lodash');
const async = require('async');

const IpV4AddressesTable = require('./IpV4AddressesTable');
const IpV6AddressesTable = require('./IpV6AddressesTable');

const ipv4AddressesTable = new IpV4AddressesTable();
const ipv6AddressesTable = new IpV6AddressesTable();

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
    const { family } = options;

    if (family === 4) {
        _ipv4lookup(hostname, options, callback);
    } else if (family === 6) {
        _ipv6lookup(hostname, options, callback);
    } else {
        async.parallel(
            [
                function(cb) {
                    _ipv4lookup(hostname, options, (error, ...records) => {
                        if (error) {
                            if (error.code === 'ENOTFOUND') {
                                return cb(null, []);
                            }

                            return cb(error);
                        }

                        cb(null, ...records);
                    });
                },
                function(cb) {
                    _ipv6lookup(hostname, options, (error, ...records) => {
                        if (error) {
                            if (error.code === 'ENOTFOUND') {
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
}

/**
 * @param {string} hostname
 * @param {Object} options
 * @param {number} options.family
 * @param {boolean} options.all
 * @param {Function} callback
 * @private
 */
function _ipv4lookup(hostname, options, callback) {
    ipv4AddressesTable.resolve(hostname, options, (error, records) => {
        if (error) {
            if (error.code === 'ENODATA') {
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
            return _ipv4lookup(hostname, options, callback);
        }

        if (Array.isArray(records)) {
            const result = records.map(record => {
                return {
                    address: record.address,
                    family: record.family
                };
            });

            return callback(null, result);
        }

        return callback(null, records.address, records.family);
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
function _ipv6lookup(hostname, options, callback) {
    ipv6AddressesTable.resolve(hostname, options, (error, records) => {
        if (error) {
            if (error.code === 'ENODATA') {
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
            return _ipv6lookup(hostname, options, callback);
        }

        if (Array.isArray(records)) {
            const result = records.map(record => {
                return {
                    address: record.address,
                    family: record.family
                };
            });

            return callback(null, result);
        }

        return callback(null, records.address, records.family);
    });
}

function makeNotFoundError(hostname, syscall) {
    const error = new Error(`${syscall} ENOTFOUND ${hostname}`);
    error.hostname = hostname;
    error.syscall = syscall;
    error.code = 'ENOTFOUND';
    error.errno = 'ENOTFOUND';

    return error;
}

module.exports = lookup;
