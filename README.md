# hue-sync

`hue-sync` lets you start a Hue Entertainment API sync session and control lights using an API similar to
the `requestAnimationFrame()` API in the browser.

### Why did I build this?

This came out from a separate not-(yet)-public side-project where I am syncing Hue lights to currently playing Spotify
music. I needed a way to have total control over the lights properties in each frame, and the result was something that
looked quite alike the requestAnimationFrame in the browser.

---

### Getting started

##### Install from npm:

```npm install @ssikoron/hue-sync```

##### Usage Example:

```typescript
import HueSync from 'hue-sync'

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

// Instantiate HueSync
const hueSync = new HueSync({
    hueConfig,
    options: {
        refreshRate: 20,
        debug: false,
    }
})

// Define your "render" function
const myRenderFn = ({lights, now}) => {
    lights.forEach((light) => {
        light.brightness = 1;
    });
    hueSync.requestAnimationFrame(myRenderFn)
}

// Start a sync session
hueSync.start().then(() => {
    hueSync.requestAnimationFrame(myRenderFn)
});
```

### `requestAnimationFrame()`

This method behaves similarly to how the browsers method of the same name behaves. Whenever you
call `requestAnimationFrame(yourCallbackFunction)`, your function will be placed in the queue.

Then, when the time comes
to "render" the scene, and by rendering we mean streaming the new state of lights to the Hue Bridge, all the callback
methods in the queue will be called with two arguments: `lights: Light[]` and `now: number`.

`lights: Light[]` is an array of all the lights in entertainment group that we are streaming to. Each `Light` has
an `id` and `hueId` which can help you to identify particular lights. Each `Light` also has  `brightness: number`
and `color: { r: number; g: number; b: number; };` properties. These two are what you will primarily be modifying in
order to create animations.

`now` is the timestamp for the currently rendering frame.

The callbacks in the queue will be executed in the order they were added. Every callback will be called with the
same `now` value, but the values inside `lights` will be modified by previously called callbacks. This enables you to,
for example, have two different callbacks, one handling color changes and the other handling brightness changes.

### License

MIT
