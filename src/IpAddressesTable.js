'use strict';

const _ = require('lodash');

const { HostIpKey, ResolveTask } = require('./internals/');

/**
 * The main goal behind this class is to eliminate `getaddrinfo()` method call used by `dns.lookup()`.
 *
 * This is done by resolving hostname names to IPv4 and IPv4 addresses using DNS TTL cache.
 * Under the hood, class uses Round-Robin algorithm, so for each request it returns different IP address.
 */
class IpAddressesTable {
    constructor() {
        this._resolveTasks = {};
    }

    /**
     * @param {string} hostname
     * @param {number} ipVersion
     * @param {Object} options
     * @param {boolean} options.all
     * @param {Function} callback
     * @public
     */
    resolve(hostname, ipVersion, options, callback) {
        const key = new HostIpKey(hostname, ipVersion);

        let resolveTask = this._resolveTasks[key];

        if (resolveTask) {
            if (options.all) {
                const addresses = resolveTask.getAddresses();

                if (!_.isEmpty(addresses)) {
                    setImmediate(() => callback(null, addresses));

                    return;
                }
            } else {
                const address = resolveTask.getNextAddress();

                if (address) {
                    setImmediate(() => callback(null, address));

                    return;
                }
            }

            if (resolveTask.getStatus() === ResolveTask.STATUS_RESOLVED) {
                resolveTask.setStatus(ResolveTask.STATUS_UNRESOLVED);
            }
        } else {
            resolveTask = new ResolveTask(ipVersion);

            this._resolveTasks[key] = resolveTask;
        }

        resolveTask.addAfterResolvedCallback(callback);

        if (resolveTask.getStatus() === ResolveTask.STATUS_UNRESOLVED) {
            resolveTask.setStatus(ResolveTask.STATUS_RESOLVING);

            this._resolve(hostname, (error, addresses) => {
                if (error) {
                    resolveTask.setStatus(ResolveTask.STATUS_UNRESOLVED);

                    resolveTask
                        .getAfterResolvedCallbacks()
                        .forEach(callback =>
                            setImmediate(() => callback(error))
                        );

                    resolveTask.clearAfterResolvedCallbacks();

                    return;
                }

                resolveTask.setStatus(ResolveTask.STATUS_RESOLVED);

                resolveTask.setAddresses(addresses);

                resolveTask.getAfterResolvedCallbacks().forEach(callback => {
                    if (options.all) {
                        setImmediate(() =>
                            callback(null, resolveTask.getAddresses())
                        );
                    } else {
                        setImmediate(() =>
                            callback(null, resolveTask.getNextAddress())
                        );
                    }
                });

                resolveTask.clearAfterResolvedCallbacks();
            });
        }
    }

    /**
     * @param {string} hostname
     * @param {Function} callback
     * @protected
     */
    _resolve(hostname, callback) {
        throw new Error(
            'Not implemented exception. Should be specified in subclass.'
        );
    }
}

module.exports = IpAddressesTable;
