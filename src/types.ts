export interface HueStreamConfig {
  bridge: {
    ipAddress: string;
    username: string;
    clientKey: string;
  };
  target: {
    groupId: number;
  };
}

export interface Bridge {
  config: HueStreamConfig;
  lights?: number[];
  _group?: any;
}

export interface Light {
  hueId: string;
  gamut: any[];
  color: {
    r: number;
    g: number;
    b: number;
  };
  brightness: number;
  id: number;
  maxBrightness: number;
}

export type RenderFrameCallback = ({ now, lights }: { now: number; lights: Light[] }) => void;
