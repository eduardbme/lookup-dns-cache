'use strict';

class HostIpKey {
    /**
     * @param {string} hostname
     * @param {number} ipFamily
     */
    static generateKey(hostname, ipFamily) {
      return `${hostname}_${ipFamily}`;
    }
}

module.exports = HostIpKey;
