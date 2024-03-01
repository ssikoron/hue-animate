import HueStream from './index';
import { HueStreamConfig, Light } from './types';

const config: HueStreamConfig = {
  bridge: {
    ipAddress: '',
    username: '',
    clientKey: ''
  },
  target: {
    groupId: 0
  }
};

const hueStream = new HueStream({ hueConfig: config, options: { debug: true } });

hueStream.start();

let lastTimestamp = 0;

const someRandomFunction = ({ lights, now }: { lights: Light[]; now: number }) => {
  const brightness = Math.min((now - lastTimestamp) / 2000, 1);
  if (lastTimestamp === 0) lastTimestamp = now;
  lights.forEach((light) => {
    light.brightness = brightness;
  });
  hueStream.requestAnimationFrame(someRandomFunction);
};

setTimeout(() => {
  hueStream.requestAnimationFrame(someRandomFunction);
}, 10000);
