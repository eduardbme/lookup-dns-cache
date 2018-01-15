'use strict';

const dns = require('dns');
const {EventEmitter} = require('events');

class ResolveTask extends EventEmitter {
  constructor(hostname, ipFamily) {
    super();

    this._hostname = hostname;
    this._ipFamily = ipFamily;
    this._callbacks = [];
  }

  addAfterResovledCallback(callback) {
    this._callbacks.push(callback);
  }

  launch() {
    const resolve = this._ipFamily === 6 ? dns.resolve6 : dns.resolve4;

    resolve(this._hostname, {ttl: true}, (err, addresses) => {
      if (!err) {
        addresses.forEach(address => address.family = this._ipFamily);

        this.emit('addresses', addresses);
      }

      this._callbacks.forEach(callback => {
        setImmediate(() => callback(err, addresses));
      });

      this._callbacks = [];

      this.emit('done');
    });
  }
}

module.exports = ResolveTask;
