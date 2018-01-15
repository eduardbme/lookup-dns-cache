'use strict';

const _ = require('lodash');

const {
  AddressCache,
  HostIpKey,
  ResolveTask,
  ResolveTasksList
} = require('./internals/');

/**
 * The main goal behind this class is to eliminate `getaddrinfo()` method call used by `dns.lookup()`.
 *
 * This is done by resolving hostname names to IPv4 and IPv4 addresses using DNS TTL cache.
 * Under the hood, class uses Round-Robin algorithm, so for each request it returns different IP address.
 */
class IpAddressesTable {
    constructor() {
        this._addressCache = new AddressCache();
        this._tasks = new ResolveTasksList();
    }

    /**
     * @param {string} hostname
     * @param {Object} options
     * @param {boolean} options.all
     * @param {number} options.family
     * @param {Function} callback
     * @public
     */
    resolve(hostname, options, callback) {
        const key = HostIpKey.generateKey(hostname, options.family);

        if (this._addressCache.has(key)) {
            const addresses = this._addressCache.get(key);

            setImmediate(() => {
              callback(
                null,
                addresses
              )
            });

            return;
        }

        let task;

        if (this._tasks.has(key)) {
            task = this._tasks.get(key);
        } else {
          task = new ResolveTask(hostname, options.family);

          task.on('done', () => {
            this._tasks.done(key);
          });

          task.on('addresses', addresses => {
            this._addressCache.add(key, addresses);
          });

          this._tasks.add(key, task);

          task.launch();
        }

        task.addAfterResovledCallback(callback);
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
