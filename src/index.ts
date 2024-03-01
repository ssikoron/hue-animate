import Streamer from './Streamer';
import Renderer from './Renderer';
import { HueStreamConfig, Light, RenderFrameCallback } from './types';
import { createMessage } from './utils';

export default class HueStream {
  private streamer: Streamer;
  private renderer: Renderer;

  constructor({
    hueConfig,
    options
  }: {
    hueConfig: HueStreamConfig;
    options?: { debug: boolean };
  }) {
    this.streamer = new Streamer(hueConfig, options?.debug);
    this.renderer = null;
  }

  start() {
    this.streamer.start().then(() => {
      this.renderer = new Renderer({
        lights: this.streamer.getLightsContext(),
        refreshRate: 20,
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
