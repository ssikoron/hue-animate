import HueAnimate from './index';
import { HueStreamConfig, Light } from './types';

// Configuration needed to connect to the Hue Bridge and start an Entertainment API session
// Refer to Hue API docs for more details
const hueConfig: HueStreamConfig = {
  bridge: {
    ipAddress: '',
    username: '',
    clientKey: ''
  },
  target: {
    groupId: 0
  }
};

// Instantiate HueAnimate
const hueAnimate = new HueAnimate({
  hueConfig,
  options: {
    debug: false
  }
});

const myRenderFn = ({ lights, now }) => {
  lights.forEach((light) => {
    light.brightness = 1;
  });
  hueAnimate.requestAnimationFrame(myRenderFn);
};

// Start a sync session
hueAnimate.start().then(() => {
  hueAnimate.requestAnimationFrame(myRenderFn);
});
