'use strict';

const dns = require('dns');

const IpAddressesTable = require('./IpAddressesTable');

class IpV4AddressesTable extends IpAddressesTable {
    /**
     * @returns {number}
     */
    static get family() {
        return 4;
    }

    /**
     * @param {string} hostname
     * @param {Object} options
     * @param {Function} callback
     */
    resolve(hostname, options, callback) {
        super.resolve(hostname, IpV4AddressesTable.family, options, callback);
    }

    /**
     * @param {string} hostname
     * @param {Function} callback
     * @protected
     */
    _resolve(hostname, callback) {
        dns.resolve4(hostname, { ttl: true }, (error, addresses) => {
            if (error) {
                return callback(error);
            }

            return callback(null, addresses);
        });
    }
}

module.exports = IpV4AddressesTable;
