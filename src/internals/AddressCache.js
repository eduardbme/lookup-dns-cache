'use strict';

const _ = require('lodash');

class AddressCache {
  constructor() {
    this._cache = new Map();
  }

  has(key) {
    if (!this._cache.has(key)) {
      return false;
    }

    const addresses = this._cache.get(key);

    if (AddressCache._isExpired(addresses)) {
      return false;
    }

    return this._cache.has(key);
  }

  get(key) {
    if (!this._cache.has(key)) {
      return;
    }

    const addresses = this._cache.get(key);

    if (AddressCache._isExpired(addresses)) {
      return;
    }

    return this._cache.get(addresses);
  }

  add(key, addresses) {
    const extendedAddresses = _.cloneDeep(addresses);

    extendedAddresses.forEach(address => {
      address.expiredTime = Date.now() + address.ttl * 1000;
    });

    this._cache.set(key, extendedAddresses);
  }

  static _isExpired(addresses) {
    return addresses.some(address => {
      return address.expiredTime < Date.now();
    });
  }
}

module.exports = AddressCache;
