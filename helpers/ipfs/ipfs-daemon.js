'use strict';

const defaultOptions = require('./default-options');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const Logger = require('logplease');
const logger = Logger.create('ipfs-daemon', { useColors: false });
Logger.setLogLevel('ERROR');
const Buffer = require('buffer/').Buffer;

class IpfsDaemon extends EventEmitter {
    constructor(options) {
        super();

        let opts = Object.assign({}, defaultOptions);
        Object.assign(opts, options)

        // quick fix to expose Buffer
        this.types = { Buffer: Buffer };

        this._options = opts;
        this._daemon = null;
        this._peerId = null;

        Logger.setLogfile(path.join(this._options.LogDirectory, '/ipfs-daemon.log'))
    }

    get Options() {
        return this._options
    }

    get PeerId() {
        return this._peerId
    }

    get Addresses() {
        return {
            Gateway: (this.gatewayHost && this.gatewayPort) ? this.gatewayHost + ':' + this.gatewayPort + '/ipfs/' : null,
            API: (this.apiHost && this.apiPort) ? this.apiHost + ':' + this.apiPort : null
        }
    }

    get GatewayAddress() {
        return (this.gatewayHost && this.gatewayPort) ? this.gatewayHost + ':' + this.gatewayPort + '/ipfs/' : null
    }

    get APIAddress() {
        return (this.apiHost && this.apiPort) ? this.apiHost + ':' + this.apiPort : null
    }

    stop() {
        this._handleShutdown()
    }

    _handleShutdown() {
        logger.debug('Shutting down...');

        this._options = null;
        this._daemon = null;
        this._peerId = null;

        logger.debug('IPFS daemon finished')
    }
}

IpfsDaemon.Name = 'ipfs-daemon';
module.exports = IpfsDaemon;