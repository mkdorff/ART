// External params
const scaledX = Math.floor(window.innerWidth);
const scaledY = Math.floor(window.innerHeight);
Canvas.height = scaledY;
Canvas.width = scaledX;

const context = Canvas.getContext('2d');
const d_depends_i = {i: 'i', d: 'd'};
const y_depends_x = {i: 'x', d: 'y'};
const x_depends_y = {i: 'y', d: 'x'};

// Runtime params
// const c_origin = {x: 0, y: 0, z: 0};
// const b_viewport = {x: {min: -1.84, max: 1.84}, y: {min: -1, max: 1}}; // lol aspect shit here
// const v_origin_viewport = {x: 0, y: 0, z: 1}; // affects FOV
// const background = {r: 175, g: 175, b: 205, a: 255};

/**
 *
 * @param {number}} x
 * @param {number}} y
 * @param {{r: number, g: number, b: number, a: number}} color
 */
function canvasRenderer(x, y, {r, g, b, a}) {
  context.fillStyle = `rgba(${r},${g},${b},${a})`;
  context.fillRect(x + scaledX / 2, scaledY / 2 - y, 1, 1);
}

/**
 * Interpolates dependent based of independent values
 * @param {number} i0
 * @param {number} d0
 * @param {number} i1
 * @param {number} d1
 * @returns {{x, y} | {i, d}}
 */
function interpolate(i0, d0, i1, d1, variableMapping = d_depends_i) {
  if (i0 === i1) return [d0];

  const values = [];
  for (let i = i0, d = d0, delta = (d1 - d0) / (i1 - i0); i < i1; i++, d += delta) {
    values.push({[variableMapping['i']]: i, [variableMapping['d']]: d});
  }
  return values;
}

function sortByX(...points) {
  return points.sort(({x: Ax}, {x: Bx}) => (Ax < Bx ? -1 : 1));
}

function sortByY(...points) {
  return points.sort(({y: Ay}, {y: By}) => (Ay < By ? -1 : 1));
}

/**
 *
 * @param {{x: number, y: number}} point0
 * @param {{x: number, y: number}} point1
 * @param {{r: number, g: number, b: number, a: number}} color
 */
function drawLine(point0, point1, color, renderer = canvasRenderer) {
  if (Math.abs(point1.x - point0.x) > Math.abs(point1.y - point0.y)) {
    const [{x: p0x, y: p0y}, {x: p1x, y: p1y}] = point0.x > point1.x ? sortByX(point0, point1) : [point0, point1];
    interpolate(p0x, p0y, p1x, p1y, y_depends_x).forEach(({x, y}) => renderer(x, y, color));
  } else {
    const [{y: p0y, x: p0x}, {y: p1y, x: p1x}] = point0.y > point1.y ? sortByY(point0, point1) : [point0, point1];
    interpolate(p0y, p0x, p1y, p1x, x_depends_y).forEach(({x, y}) => renderer(x, y, color));
  }
}

/**
 *
 * @param {{x: number, y: number}} point0
 * @param {{x: number, y: number}} point1
 * @param {{x: number, y: number}} point2
 * @param {{r: number, g: number, b: number, a: number}} color
 */
function drawTriangle(point0, point1, point2) {
  const sortedPoints = sortByY(point0, point1, point2)
  drawLine(sortedPoints[0], sortedPoints[1], {r: 77, g: 200, b: 55, a: 255})
  drawLine(sortedPoints[1], sortedPoints[2], {r: 77, g: 200, b: 55, a: 255})
  drawLine(sortedPoints[2], sortedPoints[0], {r: 77, g: 200, b: 55, a: 255})
}

drawLine({x: -200 + 500, y: 20}, {x: 200 + 500, y: -5}, {r: 77, g: 200, b: 55, a: 255});
drawLine({x: -50 + 500, y: -200}, {x: 60 + 500, y: 240}, {r: 77, g: 200, b: 55, a: 255});
drawTriangle({x: -200, y: -250}, {x: 20, y: 250}, {x: 200, y: 50});
