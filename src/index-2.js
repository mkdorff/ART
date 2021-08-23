const Engine = (() => {
  const C = {
    xMax: window.innerWidth,
    yMax: window.innerHeight,
    xRange: [-window.innerWidth / 2, window.innerWidth / 2],
    yRange: [-window.innerHeight / 2, window.innerHeight / 2],
    scale: 1,
    projectionZ: 1,
  };

  // const canvas = document.createElement('canvas')
  // const ctx = canvas.getContext('2d')
  // canvas.height = C.yMax
  // canvas.width = C.xMax
  // canvas.id = 'paint'
  // document.body.appendChild(canvas)

  const O = [0, 0, 0];
  const D = ctx.getImageData(0, 0, C.xMax, C.yMax);
  D.data.forEach((d, idx) => (D.data[idx] = 255));
  const objects = [
    {
      type: 'sphere',
      center: [0, -1, 3],
      radius: 1,
      color: [255, 0, 0],
    },
    {
      type: 'sphere',
      center: [2, 0, 4],
      radius: 1,
      color: [0, 0, 255],
    },
  ];

  const setPixel = (x, y, newData) => newData.forEach((data, i) => (D.data[4 * (C.xMax * y + x) + i] = data));

  const dotProduct = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  const subtract = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];

  const intersectRaySphere = (origin, direction, sphere) => {
    const oc = subtract(origin, sphere.center);
    const k1 = dotProduct(direction, direction);
    const k2 = 2 * dotProduct(oc, direction);
    const k3 = dotProduct(oc, oc) - sphere.radius * sphere.radius;
    const discriminant = k2 * k2 - 4 * k1 * k3;
    if (discriminant < 0) return [Infinity, Infinity];

    const sqrtDscrmnt = Math.sqrt(discriminant);
    return [(-k2 + sqrtDscrmnt) / (2 * k1), (-k2 - sqrtDscrmnt) / (2 * k1)];
  };

  const colorFromRay = (origin, direction, min_t, max_t) => {
    const {closest_t, closest_sphere} = objects.reduce(
      ({closest_t, closest_sphere}, sphere) => {
        let [t0, t1] = intersectRaySphere(origin, direction, sphere);

        if (t0 < closest_t && min_t < t0 && t0 < max_t) {
          closest_t = t0;
          closest_sphere = sphere;
        }
        if (t1 < closest_t && min_t < t1 && t1 < max_t) {
          closest_t = t1;
          closest_sphere = sphere;
        }
        return {closest_t, closest_sphere};
      },
      {closest_t: Infinity, closest_sphere: null}
    );

    if (closest_sphere == null) return [255, 255, 255];
    return closest_sphere.color;
  };

  for (let y = C.yRange[0]; y < C.yRange[1]; y++) {
    for (let x = C.xRange[0]; x < C.xRange[1]; x++) {
      const viewportVector = [(x * C.scale) / C.xMax, (y * C.scale) / C.yMax, C.projectionZ];
      const color = colorFromRay(O, viewportVector, 1, Infinity);
      setPixel(x + C.xRange[1], y + C.yRange[1], color);
    }
  }

  return {
    paint: () => ctx.putImageData(D, 0, 0),
    sphere: (center, radius, color) => objects.push({type: 'sphere', center, radius, color}),
  };
})();

//
// // Main loop.
// //
// for (var x = -canvas.width / 2; x < canvas.width / 2; x++) {
//   for (var y = -canvas.height / 2; y < canvas.height / 2; y++) {
//     var direction = CanvasToViewport([x, y])
//     var color = TraceRay(camera_position, direction, 1, Infinity)
//     PutPixel(x, y, color)
//   }
// }

// UpdateCanvas()

// Engine.setPixel(20, 20, [255, 255, 255])
// Engine.setPixel(21, 20, [255, 255, 255])
// Engine.setPixel(20, 21, [255, 255, 255])
// Engine.setPixel(21, 21, [255, 255, 255])
// Engine.setPixel(22, 20, [255, 255, 255])
Engine.paint();





// snapshot().forEach((row, y, {length}) =>
//   row.forEach(({r, g, b, a}, x) => {
//     context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
//     context.fillRect(x, length - y, 1, 1);
//   })
// );