// External params
const newx = Math.floor(1680 / 8);
const newy = Math.floor(913 / 8);
const _resolution = {x: newx, y: newy};
Canvas.height = newy;
Canvas.width = newx;

// Runtime params
const c_origin = {x: 0, y: 0, z: 0};
const b_viewport = {x: {min: -1.84, max: 1.84}, y: {min: -1, max: 1}}; // lol aspect shit here
const v_origin_viewport = {x: 0, y: 0, z: 0.4}; // affects FOV
const background = {r: 45, g: 45, b: 55, a: 255};

// Data
const objects = [{type: 'grid', axis: {x: true, y: true, z: true}}];
const _ = x => Math.floor(Math.random() * x);
[...Array(20)].forEach(() => {
  objects.push({
    type: 'sphere',
    center: {x: _(20), y: _(20), z: _(20)},
    radius: _(5),
    color: {r: _(255), g: _(255), b: _(255), a: 255},
  });
});

const dotProduct = ({x: x0, y: y0, z: z0 = 0}, {x, y, z = 0}) => x0 * x + y0 * y + z0 * z;
const add = ({x: x0, y: y0, z: z0 = 0}, {x, y, z = 0}) => ({x: x0 + x, y: y0 + y, z: z0 + z});
const subtract = ({x: x0, y: y0, z: z0 = 0}, {x, y, z = 0}) => ({x: x0 - x, y: y0 - y, z: z0 - z});

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

const backtrace = (origin, direction, min_t, max_t) => {
  const {closest_object} = objects.reduce(
    ({closest_t, closest_object}, object) => {
      // The API being return Infinity for no collision
      let t0, t1;
      switch (object.type) {
        case 'grid':
          // [t0, t1] = intersectGrid(origin, direction, object);
          break;
        case 'sphere':
          [t0, t1] = intersectSphere(origin, direction, object);
          break;
        default:
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

  return (closest_object && closest_object.color) || {...background};
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
    // case 'ArrowLeft':
    //   v_origin_viewport.x = v_origin_viewport.x + 
    //   v_origin_viewport.z = v_origin_viewport.x * sin + v_origin_viewport.z * cos;
    //   paint();
    //   break;
    // case 'ArrowRight':
    //   paint();
    //   break;
    default:
      break;
  }
});
