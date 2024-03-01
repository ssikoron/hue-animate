import Streamer from './Streamer';
import Renderer from './Renderer';
import { HueStreamConfig, Light, RenderFrameCallback } from './types';
import { createMessage } from './utils';

export default class HueSync {
  private streamer: Streamer;
  private renderer: Renderer;
  refreshRate: number;

  constructor({
    hueConfig,
    options
  }: {
    hueConfig: HueStreamConfig;
    options?: { debug?: boolean; refreshRate?: number };
  }) {
    this.streamer = new Streamer(hueConfig, options?.debug);
    this.renderer = null;
    this.refreshRate = options?.refreshRate || 20;
  }

  async start() {
    await this.streamer.start().then(() => {
      this.renderer = new Renderer({
        lights: this.streamer.getLightsContext(),
        refreshRate: this.refreshRate,
        requestStreamFn: this.sendStream.bind(this)
      });
      this.renderer.start();
    });
  }

  stop() {
    this.renderer.stop();
    this.streamer.stop();
  }

  requestAnimationFrame(cb: RenderFrameCallback) {
    this.renderer.requestAnimationFrame(cb);
  }

  private sendStream(lights: Light[]) {
    this.streamer.sendStream(createMessage(lights));
  }
}
