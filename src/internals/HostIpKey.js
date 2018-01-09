'use strict';

class HostIpKey {
    /**
     * @param {string} hostname
     * @param {number} ipVersion
     * @constructor
     */
    constructor(hostname, ipVersion) {
        this._hostname = hostname;
        this._ipVersion = ipVersion;
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this._hostname}_${this._ipVersion}`;
    }
}

module.exports = HostIpKey;
