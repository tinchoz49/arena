const _ = require('lodash');
const Bull = require('bull');
const Bee = require('bee-queue');
const path = require('path');

class Queues {
  constructor(config) {
    this._queues = {};

    this.setConfig(config);
  }

  list() {
    return this._config.queues;
  }

  setConfig(config) {
    this._config = config;
  }

  async get(queueName, queueHost) {
    const queueConfig = _.find(this._config.queues, {
      name: queueName,
      hostId: queueHost
    });
    if (!queueConfig) return null;

    if (this._queues[queueHost] && this._queues[queueHost][queueName]) {
      return this._queues[queueHost][queueName];
    }

    const { type, name, port, host, db, password, prefix, url, redis, bullOptions = {}, beeOptions = {} } = queueConfig;

    const redisHost = { host };
    if (password) redisHost.password = password;
    if (port) redisHost.port = port;
    if (db) redisHost.db = db;

    const isBee = type === 'bee';

    const options = {
      redis: redis || url || redisHost
    };
    if (prefix) options.prefix = prefix;

    let queue;
    if (isBee) {
      _.extend(options, {
        isWorker: false,
        getEvents: false,
        sendEvents: false,
        storeJobs: false
      }, beeOptions);

      queue = new Bee(name, options);
      queue.IS_BEE = true;
    } else {
      _.extend(options, bullOptions);
      queue = new Bull(name, options);
    }

    this._queues[queueHost] = this._queues[queueHost] || {};
    this._queues[queueHost][queueName] = queue;

    return queue;
  }
}

module.exports = Queues;
