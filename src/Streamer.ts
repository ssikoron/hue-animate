import axios from 'axios';
import { dtls } from 'node-dtls-client';
import Options = dtls.Options;
import { Bridge, HueStreamConfig, Light } from './types';

export default class Streamer {
  lights: Light[];
  isActive: boolean;
  bridge: Bridge;
  config: HueStreamConfig;
  dtlsConn: dtls.Socket;
  debug: boolean;

  constructor(config: HueStreamConfig, debug = false) {
    this.lights = [];
    this.isActive = false;
    this.bridge = null;
    this.config = null;
    this.dtlsConn = null;
    this.debug = debug;
    this.init(config);
  }

  private init(config: HueStreamConfig) {
    this.config = config;
    this.isActive = false;
    this.dtlsConn = null;
    this.bridge = {
      config: config
    };
  }

  private getApi = () =>
    `http://${this.config.bridge.ipAddress}/api/${this.config.bridge.username}`;

  async start() {
    await this.loadInitialData();
    await this.requestStreamStart();
    this.connectDtlsStream();
  }

  stop() {
    this.dtlsConn.close(() => {
      this.isActive = false;
      this.requestStreamStop();
    });
  }

  private requestStreamStart() {
    return new Promise((resolve, reject) => {
      axios({
        method: 'PUT',
        url: this.getApi() + '/groups/' + this.config.target.groupId,
        data: {
          stream: {
            active: true
          }
        }
      })
        .then((res) => {
          if (res && res.status === 200) {
            resolve(true);
          } else {
            reject();
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private requestStreamStop() {
    return new Promise((resolve, reject) => {
      axios({
        method: 'PUT',
        url: this.getApi() + '/groups/' + this.config.target.groupId,
        data: {
          stream: {
            active: false
          }
        }
      })
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          this.debug && console.log(err);
          reject(err);
        });
    });
  }

  private loadInitialData() {
    return new Promise((resolve, reject) => {
      axios
        .get(`${this.getApi()}/groups/${this.config.target.groupId}`)
        .then((res) => {
          if (res.status === 200 && res.data.lights) {
            const hueLightsData = { ...res.data };
            axios
              .all([
                ...hueLightsData.lights.map((ltIndex) =>
                  axios.get(`${this.getApi()}/lights/${ltIndex}`)
                )
              ])
              .then((resArr) => {
                const newLts = hueLightsData.lights.map((ltInstance, i) => {
                  return {
                    hueId: ltInstance,
                    gamut: [...resArr[i].data.capabilities.control.colorgamut],
                    color: {
                      r: 1,
                      g: 0,
                      b: 1
                    },
                    brightness: 1.0,
                    id: i,
                    maxBrightness: 1.0
                  };
                });
                this.lights = [...newLts].sort((a, b) => a.id - b.id);
                this.debug &&
                  console.log(
                    '[STREAM - ' + this.config.bridge.ipAddress + '] Loaded initial data.'
                  );
                resolve(true);
              });
          }
        })
        .catch((err) => {
          this.debug && console.log('Error loading initial data from Hue bridge.');
          this.debug && console.log(err);
          reject(err);
        });
    });
  }

  private connectDtlsStream() {
    this.debug && console.log('[STREAM - ' + this.config.bridge.ipAddress + '] Connecting...');
    const socketOptions: Options = {
      type: 'udp4',
      address: this.config.bridge.ipAddress,
      port: 2100,
      psk: {},
      timeout: 2000
    };

    // @ts-ignore
    socketOptions.psk[this.config.bridge.username] = Buffer.from(
      this.config.bridge.clientKey,
      'hex'
    );

    if (this.isActive) {
      if (this.dtlsConn) this.dtlsConn.close();
      this.isActive = false;
    }

    setTimeout(() => {
      if (!this.isActive) {
        this.debug && console.log();
        throw new Error('ERR: Connection Timeout.');
      }
    }, 500);

    this.dtlsConn = dtls
      .createSocket(socketOptions)
      .on('connected', () => {
        this.debug &&
          console.log('[STREAM - ' + this.config.bridge.ipAddress + '] Stream started.');
        this.isActive = true;
      })
      .on('disconnected', (e) => {
        this.isActive = false;
        this.debug && console.log('[STREAM - ' + this.config.bridge.ipAddress + '] Disconnected.');
      })
      .on('error', (e) => {
        this.debug &&
          console.log(
            '[STREAM - ' + this.config.bridge.ipAddress + '] Connection error. Retrying.'
          );
        this.isActive = false;
        this.retry();
      })
      .on('message', (msg) => {
        this.debug &&
          console.log('[STREAM - ' + this.config.bridge.ipAddress + '] Message received.');
        this.debug && console.log(msg);
      })
      .on('close', () => {
        this.debug && console.log('[STREAM - ' + this.config.bridge.ipAddress + '] Socket closed.');
        this.isActive = false;
      });
  }

  private retry(withTimeout = false) {
    this.requestStreamStop().then(() => {
      setTimeout(
        () => {
          this.requestStreamStart();
        },
        withTimeout ? 1000 : 0
      );
    });
  }

  sendStream(buffer) {
    if (this.isActive) this.dtlsConn.send(buffer, () => null);
  }

  getLightsContext() {
    return this.lights;
  }
}
