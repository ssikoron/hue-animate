export function rgbToXY(color, gamutPoints) {
  const red = round(color.r);
  const green = round(color.g);
  const blue = round(color.b);

  const r = red > 0.04045 ? Math.pow((red + 0.055) / 1.055, 2.4000000953674316) : red / 12.92;
  const g = green > 0.04045 ? Math.pow((green + 0.055) / 1.055, 2.4000000953674316) : green / 12.92;
  const b = blue > 0.04045 ? Math.pow((blue + 0.055) / 1.055, 2.4000000953674316) : blue / 12.92;

  const X = r * 0.664511 + g * 0.154324 + b * 0.162028;
  const Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
  const Z = r * 8.8e-5 + g * 0.07231 + b * 0.986039;

  let x = X / (X + Y + Z);
  let y = Y / (X + Y + Z);

  if (isNaN(x)) x = 0;
  if (isNaN(y)) y = 0;

  let xy = [x, y];

  const reachable = checkPointInLampReach(xy, gamutPoints);

  if (!reachable) {
    const pAB = getClosestPoint(gamutPoints[0], gamutPoints[1], xy);
    const pAC = getClosestPoint(gamutPoints[2], gamutPoints[0], xy);
    const pBC = getClosestPoint(gamutPoints[1], gamutPoints[2], xy);

    const dAB = getDistanceBetweenPoints(xy, pAB);
    const dAC = getDistanceBetweenPoints(xy, pAC);
    const dBC = getDistanceBetweenPoints(xy, pBC);

    let lowest = dAB;
    let lowestP = pAB;

    if (dAC < dAB) {
      lowest = dAC;
      lowestP = pAC;
    }

    if (dBC < lowest) {
      lowestP = pBC;
    }

    xy = [lowestP[0], lowestP[1]];
  }

  return [round(xy[0]), round(xy[1])];
}

export function round(nr) {
  return Math.round(10000.0 * nr) / 10000.0;
}

export function getClosestPoint(pA, pB, p) {
  const dA = [p[0] - pA[0], p[1] - pA[1]];
  const dB = [pB[0] - pA[0], pB[1] - pA[1]];

  const dB2 = dB[0] * dB[0] + dB[1] * dB[1];
  const dAB = dA[0] * dB[0] + dA[1] * dB[1];

  let t = dAB / dB2;

  if (t < 0.0) {
    t = 0;
  } else if (t > 1.0) {
    t = 1.0;
  }

  return [pA[0] + dB[0] * t, pA[1] + dB[1] * t];
}

export function getDistanceBetweenPoints(A, B) {
  const dX = A[0] - B[0];
  const dY = A[1] - B[1];
  const d = Math.sqrt(dX * dX + dY * dY);
  return d;
}

export function vectorCrossProduct(p1, p2) {
  return p1[0] * p2[1] - p1[1] * p2[0];
}

export function checkPointInLampReach(point, withinPoints) {
  if (point != null && withinPoints != null) {
    const v1 = [withinPoints[1][0] - withinPoints[0][0], withinPoints[1][1] - withinPoints[0][1]];
    const v2 = [withinPoints[2][0] - withinPoints[0][0], withinPoints[2][1] - withinPoints[0][1]];

    const q = [point[0] - withinPoints[0][0], point[1] - withinPoints[0][1]];

    const s = vectorCrossProduct(q, v2) / vectorCrossProduct(v1, v2);
    const t = vectorCrossProduct(v1, q) / vectorCrossProduct(v1, v2);

    return s >= 0.0 && t >= 0.0 && s + t <= 1.0;
  } else {
    return false;
  }
}

export function toHex(nr) {
  const adjNr = nr * 0xffff;
  const arr = new Uint8Array([(adjNr & 0xff00) >> 8, adjNr & 0x00ff]);
  return Buffer.from(arr.buffer);
}

export function createLightMsgBuffer(lt) {
  const { color, brightness, hueId, gamut } = lt;
  const { r, g, b } = color;
  const [x, y] = rgbToXY({ r, g, b }, gamut);

  const buffer = Buffer.concat([
    Buffer.from([0x00, 0x00, hueId]),
    toHex(x),
    toHex(y),
    toHex(brightness)
  ]);
  return buffer;
}

export function createMessage(lights) {
  const buffer = Buffer.concat([
    Buffer.from('HueStream', 'ascii'),
    Buffer.from([
      0x01,
      0x00,
      0x07,
      0x00,
      0x00,
      0x01, // XY color mode - 0x00 for RGB
      0x00 // reserved
    ]),
    ...lights.map((lt) => {
      return createLightMsgBuffer(lt);
    })
  ]);
  return buffer;
}
