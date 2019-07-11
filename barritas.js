const canvasSketch = require("canvas-sketch");
const { lerp } = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");
const palettes = require("nice-color-palettes");

const settings = {
  dimensions: [500, 735]
};

const margin = 10;
const drawGrid = false;
const useColors = true;
const randomBackground = true;
const multiDoodle = true;

const seed = random.getRandomSeed();
// const seed = 315986;
random.setSeed(seed);
console.log("seed", seed);
const palette = random.pick(palettes);

const createGrid = gridSize => {
  const points = [];
  const count = gridSize;

  for (let y = 0; y < count; y++) {
    const row = [];
    for (let x = 0; x < count; x++) {
      let u = count < 2 ? 0.5 : x / (count - 1);
      let v = count < 2 ? 0.5 : y / (count - 1);
      const noise = random.noise2D(u, v, 1, 0.011);
      u = u + noise;
      v = v + noise;

      row.push({
        uvcoords: [u, v],
        used: false,
        xycoords: [x, y]
      });
    }
    points.push(row);
  }
  return points;
};

const drawRandomLines = (
  context,
  width,
  height,
  numberShapes,
  shapeLength,
  gridSize
) => {
  const grid = createGrid(gridSize);

  // draw the grid
  if (drawGrid) {
    context.strokeStyle = "black";
    context.fillStyle = "black";
    grid.forEach(row => {
      row.forEach(item => {
        context.beginPath();
        const [u, v] = item.uvcoords;
        const x = lerp(margin, width - margin, u);
        const y = lerp(margin, height - margin, v);

        context.arc(x, y, width / 600, Math.PI * 2, false);
        context.fill();
      });
    });
  }
  for (let i = 0; i < numberShapes; i++) {
    const x = random.rangeFloor(0, gridSize);
    const y = random.rangeFloor(0, gridSize);
    const point = grid[y][x];
    // console.log(point);
    const shape = growShape(point, grid, gridSize, shapeLength);

    if (shape.length > 1) {
      //draw the lines
      context.beginPath();
      if (useColors) {
        context.fillStyle = random.pick(palette);
      } else {
        context.fillStyle = "black";
      }
      context.strokeStyle = context.fillStyle;
      for (let step = 0; step < shape.length; step++) {
        const element = shape[step];
        const [u, v] = element.uvcoords;
        const x = lerp(margin, width - margin, u);
        const y = lerp(margin, height - margin, v);

        if (step == 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
      // draw the dots
      for (let step = 0; step < shape.length; step++) {
        const element = shape[step];
        const [u, v] = element.uvcoords;
        const x = lerp(margin, width - margin, u);
        const y = lerp(margin, height - margin, v);
        context.beginPath();
        const radius = width / 200 + random.range(0, 2);
        context.arc(x, y, radius, Math.PI * 2, false);
        context.fill();
      }
    }
  }
};

const sketch = () => {
  return ({ context, width, height }) => {
    if (randomBackground) {
      context.fillStyle = random.pick(palette);
    } else {
      context.fillStyle = "white";
    }
    context.fillRect(0, 0, width, height);

    context.lineWidth = width / 250;

    if (multiDoodle) {
      const verticalCells = 3;
      const cellWidth = (width - margin * 3) / 2;
      const cellHeigh = (height - margin * (verticalCells + 1)) / verticalCells;
      if (cellHeigh != cellWidth) {
        console.error(
          "wrong height, it should be:",
          cellWidth * verticalCells + margin * (verticalCells + 1)
        );
      }

      const gridSizes = [3, 4, 8, 16, 32, 48];
      const numberShapes = [2, 4, 10, 16, 50, 120];
      const shapeLengths = [2, 3, 4, 6, 9, 15];
      // const shapeLengths = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < verticalCells * 2; i++) {
        context.save();
        x = i % 2;
        y = Math.floor(i / 2);
        context.translate(
          x * cellWidth + margin + margin * x,
          y * cellHeigh + margin + margin * y
        );
        drawRandomLines(
          context,
          cellWidth,
          cellHeigh,
          numberShapes[i], //numberShapes
          shapeLengths[i], //shapeLength
          gridSizes[i] //Gridssize
        );
        context.restore();
      }
    } else {
      drawRandomLines(
        context,
        width,
        height,
        36, //numberShapes
        3, //shapeLength
        10 //Gridsize
      );
    }
  };
};

const growShape = (point, grid, gridSize, shapeLength) => {
  if (point.used) return [];
  const pickNext = point => {
    const [x, y] = point.xycoords;

    const allPoints = [
      { x: x - 1, y: y },
      { x: x + 1, y: y },
      { x: x, y: y - 1 },
      { x: x, y: y + 1 }
    ];
    const possiblePoints = allPoints.filter(item => {
      return (
        item.x >= 0 && item.y >= 0 && item.x < gridSize && item.y < gridSize
      );
    });
    let newPoint;
    for (let i = 0; i < 4; i++) {
      let picked = random.pick(possiblePoints);
      if (picked.visited) continue;
      //check if used in the grid
      let gridPoint = grid[picked.y][picked.x];
      if (!gridPoint.used) {
        newPoint = gridPoint;
        gridPoint.used = true;
        picked.visited = true;
        break;
      }
    }
    return newPoint;
  };

  const shape = [point];
  for (let i = 0; i < shapeLength; i++) {
    let next = pickNext(point);
    if (next) {
      shape.push(next);
      point.used = true; // the initial point is not marked as used by the pickNext
      point = next;
    }
  }
  return shape;
};

canvasSketch(sketch, settings);
