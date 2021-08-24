// External params
const newx = Math.floor(1680 / 8 );
const newy = Math.floor(913 / 8);
const _resolution = {x: newx, y: newy};
Canvas.height = newy;
Canvas.width = newx;

// Runtime params
const c_origin = {x: 0, y: 0, z: 0};
const b_viewport = {x: {min: -1.84, max: 1.84}, y: {min: -1, max: 1}}; // lol aspect shit here
const v_origin_viewport = {x: 0, y: 0, z: 1.5}; // affects FOV
const rotates = [
  {x: 0, y: 0, z: 1.5},
  {x: 1.5, y: 0, z: 0},
  {x: 0, y: 0, z: -1.5},
  {x: -1.5, y: 0, z: 0},
];
const background = {r: 175, g: 175, b: 205, a: 255};

// Data
const objects = [
  {type: 'sphere', center: {x: 0, y: -1, z: 3}, radius: 1, color: {r: 255, g: 0, b: 0, a: 255}, specular: 500, reflective: 0.01},
  {type: 'sphere', center: {x: 3, y: 0, z: 4}, radius: 1, color: {r: 0, g: 0, b: 255, a: 255}, specular: 500, reflective: 0.6},
  {type: 'sphere', center: {x: -2, y: 1, z: 5}, radius: 1, color: {r: 0, g: 255, b: 0, a: 255}, specular: 10, reflective: 0.6},
  {type: 'sphere', center: {x: 0, y: -5001, z: 0}, radius: 5000, color: {r: 255, g: 255, b: 0, a: 255}, specular: 1000, reflective: 0.001},
  {type: 'sphere', center: {x: -1.4, y: -2.8, z: 2.4}, radius: 2, color: {r: 255, g: 220, b: 220, a: 255}, specular: 10000, reflective: 1},
  {type: 'sphere', center: {x: 10, y: 12, z: 21}, radius: 4, color: {r: 77, g: 200, b: 255, a: 255}, specular: 10000, reflective: 0},
];
const lights = [
  {type: 'ambient', intensity: 0.2},
  {type: 'point', intensity: 0.6, position: {x: 2, y: 1, z: 0}},
  {type: 'point', intensity: 0.3, position: {x: 15, y: 5, z: 20}},
  // {type: 'point', intensity: 0.8, position: {x: 4, y: 6, z:12}},
  {type: 'directional', intensity: 0.2, direction: {x: 1, y: 4, z: 4}},
  {type: 'directional', intensity: 0.6, direction: {x: 5, y: 7, z: 15}},
];

// const _ = x => Math.floor(Math.random() * x);
// [...Array(20)].forEach(() => {
//   objects.push({
//     type: 'sphere',
//     center: {x: _(20) - 10, y: _(20) - 10, z: _(20) - 10},
//     radius: _(5),
//     color: {r: _(255), g: _(255), b: _(255), a: 255},
//     specular: _(1000),
//   });
// });

const dotProduct = ({x: x0, y: y0, z: z0 = 0}, {x, y, z = 0}) => x0 * x + y0 * y + z0 * z;
const add = ({x: x0, y: y0, z: z0 = 0}, {x, y, z = 0}) => ({x: x0 + x, y: y0 + y, z: z0 + z});
const subtract = ({x: x0, y: y0, z: z0 = 0}, {x, y, z = 0}) => ({x: x0 - x, y: y0 - y, z: z0 - z});
const scalar = (scale, {x, y, z = 0}) => ({x: scale * x, y: scale * y, z: scale * z});
const length = v => Math.sqrt(dotProduct(v, v));

const reflectRay = (vector, normal) => subtract(scalar(2 * dotProduct(normal, vector), normal), vector);

const intersectSphere = (origin, direction, sphere) => {
  const v_origin_sphere_center = subtract(origin, sphere.center);

  const k1 = dotProduct(direction, direction);
  const k2 = 2 * dotProduct(v_origin_sphere_center, direction);
  const k3 = dotProduct(v_origin_sphere_center, v_origin_sphere_center) - sphere.radius * sphere.radius;
  const discriminant = k2 * k2 - 4 * k1 * k3;
  if (discriminant < 0) return [Infinity, Infinity];

  const sqrtDscrmnt = Math.sqrt(discriminant);
  return [(-k2 + sqrtDscrmnt) / (2 * k1), (-k2 - sqrtDscrmnt) / (2 * k1)];
};

const computeLighting = (surfacePoint, normalizedSurfaceVector, toCameraVector, specular) => {
  let intensity = 0;
  lights.forEach(light => {
    if (light.type === 'ambient') {
      intensity += light.intensity;
      return;
    }

    const v_light = light.type === 'point' ? subtract(light.position, surfacePoint) : light.direction;
    const t_max = light.type === 'point' ? 1 : Infinity;

    // Shadows
    const {closest_t, closest_object} = closestIntersection(surfacePoint, v_light, 0.001, Infinity);
    if (closest_object) return;

    const angularIntensity = dotProduct(normalizedSurfaceVector, v_light);
    if (angularIntensity > 0) {
      intensity += (light.intensity * angularIntensity) / (length(normalizedSurfaceVector) * length(v_light));
    }

    if (specular > 0) {
      const R = reflectRay(v_light, normalizedSurfaceVector);
      const R_dot_V = dotProduct(R, toCameraVector);

      if (R_dot_V > 0) {
        intensity += light.intensity * Math.pow(R_dot_V / (length(R) * length(toCameraVector)), specular);
      }
    }
  });

  return intensity > 1 ? 1 : intensity;
};

const closestIntersection = (origin, direction, min_t, max_t) =>
  objects.reduce(
    ({closest_t, closest_object}, object) => {
      // The API being return Infinity for no collision
      let t0, t1;
      switch (object.type) {
        case 'sphere':
        default:
          [t0, t1] = intersectSphere(origin, direction, object);
          break;
      }

      if (t0 < closest_t && min_t < t0 && t0 < max_t) {
        closest_t = t0;
        closest_object = object;
      }
      if (t1 < closest_t && min_t < t1 && t1 < max_t) {
        closest_t = t1;
        closest_object = object;
      }
      return {closest_t, closest_object};
    },
    {closest_t: Infinity, closest_object: null}
  );

const backtrace = (origin, direction, min_t, max_t, recursionDepth = 0) => {
  const {closest_t, closest_object} = closestIntersection(origin, direction, min_t, max_t);

  if (!closest_object) return {...background};

  const surfacePoint = scalar(closest_t, direction);
  const normalSurfaceVector = subtract(surfacePoint, closest_object.center);
  const normalizedSurfaceVector = scalar(1 / length(normalSurfaceVector), normalSurfaceVector);

  const lightingScalar = computeLighting(
    surfacePoint,
    normalizedSurfaceVector,
    subtract({x: 0, y: 0, z: 0}, direction),
    closest_object.specular
  );

  // Reflections
  if (recursionDepth > 2 || closest_object.reflective <= 0) {
    return {...closest_object.color, a: closest_object.color.a * lightingScalar};
  } else {
    const v_reflection = reflectRay(subtract({x: 0, y: 0, z: 0}, direction), normalizedSurfaceVector);
    const reflectedColor = backtrace(surfacePoint, v_reflection, 0.001, Infinity, recursionDepth + 1);
    return {
      r: closest_object.color.r * (1 - closest_object.reflective) + reflectedColor.r * closest_object.reflective,
      g: closest_object.color.g * (1 - closest_object.reflective) + reflectedColor.g * closest_object.reflective,
      b: closest_object.color.b * (1 - closest_object.reflective) + reflectedColor.b * closest_object.reflective,
      a: closest_object.color.a * lightingScalar
    }
  }
};

const snapshot = (resolution = _resolution) => {
  const dy = Math.abs(b_viewport.y.max - b_viewport.y.min) / resolution.y; // would we add scale here?
  const dx = Math.abs(b_viewport.x.max - b_viewport.x.min) / resolution.x;
  const frame = [];

  for (let y = b_viewport.y.min + dy / 2, row = []; y < b_viewport.y.max; y += dy, row = []) {
    for (let x = b_viewport.x.min + dx / 2; x < b_viewport.x.max; x += dx) {
      v_viewport_pixel = add({x, y}, v_origin_viewport);
      pixelColor = backtrace(c_origin, v_viewport_pixel, 1, Infinity);
      row.push(pixelColor);
    }
    frame.push(row);
  }

  return frame;
};

const context = Canvas.getContext('2d');

const canvasRender = () =>
  snapshot()
    .reverse()
    .map(row => row.map(({r, g, b, a}) => [r, g, b, a]))
    .flat(2);

const paint = () => context.putImageData(new ImageData(new Uint8ClampedArray(canvasRender()), _resolution.x, _resolution.y), 0, 0);
paint();

// const moveLights = ({x, y, z}) =>
//   lights.forEach(light => {
//     if (!light.position) return;
//     if (x) light.position.x += x;
//     if (y) light.position.y += y;
//     if (z) light.position.z += z;
//   });

// Interactivity
window.addEventListener('keydown', e => {
  const movement = e.shiftKey ? 10 : 0.4;
  switch (e.key) {
    case 'w':
    case 'W':
      c_origin.z = c_origin.z + movement;
      paint();
      break;
    case 'a':
    case 'A':
      c_origin.x = c_origin.x - movement;
      paint();
      break;
    case 'd':
    case 'D':
      c_origin.x = c_origin.x + movement;
      paint();
      break;
    case 's':
    case 'S':
      c_origin.z = c_origin.z - movement;
      paint();
      break;
    case 'ArrowUp':
      c_origin.y = c_origin.y + movement;
      paint();
      break;
    case 'ArrowDown':
      c_origin.y = c_origin.y - movement;
      paint();
      break;
    case 'ArrowRight':
      {
        const foundIndex = rotates.findIndex(
          ({x, y, z}) => v_origin_viewport.x === x && v_origin_viewport.y === y && v_origin_viewport.z === z
        );

        if (foundIndex + 1 === rotates.length) {
          v_origin_viewport.x = rotates[0].x;
          v_origin_viewport.y = rotates[0].y;
          v_origin_viewport.z = rotates[0].z;
        } else {
          v_origin_viewport.x = rotates[foundIndex + 1].x;
          v_origin_viewport.y = rotates[foundIndex + 1].y;
          v_origin_viewport.z = rotates[foundIndex + 1].z;
        }
      }
      paint();
      break;
    case 'ArrowLeft':
      {
        const foundIndex = rotates.findIndex(
          ({x, y, z}) => v_origin_viewport.x === x && v_origin_viewport.y === y && v_origin_viewport.z === z
        );

        if (foundIndex === 0) {
          const lastIndex = rotates.length - 1;
          v_origin_viewport.x = rotates[lastIndex].x;
          v_origin_viewport.y = rotates[lastIndex].y;
          v_origin_viewport.z = rotates[lastIndex].z;
        } else {
          v_origin_viewport.x = rotates[foundIndex - 1].x;
          v_origin_viewport.y = rotates[foundIndex - 1].y;
          v_origin_viewport.z = rotates[foundIndex - 1].z;
        }
      }
      paint();
      break;
    default:
      break;
  }
});
