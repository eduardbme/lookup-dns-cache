'use strict';

class ResolveTasksList {
  constructor() {
    this._tasks = new Map();
  }

  has(key) {
    return this._tasks.has(key);
  }

  get(key) {
    return this._tasks.get(key);
  }

  add(key, task) {
    this._tasks.set(key, task);
  }

  done(key) {
    this._tasks.delete(key);
  }
}

module.exports = ResolveTasksList;
