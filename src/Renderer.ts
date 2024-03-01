import { performance } from 'perf_hooks';
import { Light, RenderFrameCallback } from './types';

type RequestStreamFn = (lights: Light[]) => void;

class Renderer {
  lights: Light[];
  refreshInterval: number;
  private queue: RenderFrameCallback[];
  private requestStream: (lights: Light[]) => void;
  private intervalRef: NodeJS.Timer;

  constructor({
    lights,
    refreshRate,
    requestStreamFn
  }: {
    lights: Light[];
    refreshRate: number;
    requestStreamFn: RequestStreamFn;
  }) {
    this.resetQueue();
    this.init({ lights, refreshRate, requestStreamFn });
  }

  private init({
    lights,
    refreshRate = 20,
    requestStreamFn
  }: {
    lights: Light[];
    refreshRate: number;
    requestStreamFn: RequestStreamFn;
  }) {
    this.lights = [...lights];
    this.requestStream = requestStreamFn;
    this.refreshInterval = Math.round(1000 / refreshRate);
  }

  private resetQueue() {
    this.queue = [];
  }

  start() {
    if (this.intervalRef) clearInterval(this.intervalRef);
    this.intervalRef = setInterval(() => this.render(), this.refreshInterval);
  }

  stop() {
    clearInterval(this.intervalRef);
    this.intervalRef = null;
  }

  requestAnimationFrame(callback: RenderFrameCallback) {
    this.queue.push(callback);
  }

  private render() {
    const now = performance.now();

    const finalQueue = [...this.queue];
    this.queue.length = 0;

    for (let i = 0; i < finalQueue.length; i++) {
      finalQueue[i]({ now, lights: this.lights });
    }

    this.requestStream(this.lights);
  }
}

export default Renderer;
