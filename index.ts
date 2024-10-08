const GRID_COLS = 10
const SCREEN_WIDTH = 600
const epsilon = 1e-6
const GRID_ROWS = 10
const PI = Math.PI
const FOV = PI / 4
const SCREEN_DISTANCE = 1


class Player {
  public pos: Vector2 = new Vector2(2, 5)
  // dir is an angle represented in radians
  public dir: number = - PI / 4

  public getFovVectors() {
    // direction vector, direction left and drection right
    const dv = Vector2.fromAngle(this.dir).norm().mult(SCREEN_DISTANCE).add(this.pos)
    const dl = Vector2.fromAngle(this.dir + (FOV / 2)).norm().mult(SCREEN_DISTANCE / Math.cos(FOV / 2)).add(this.pos)
    const dr = Vector2.fromAngle(this.dir - (FOV / 2)).norm().mult(SCREEN_DISTANCE / Math.cos(FOV / 2)).add(this.pos)
    return { dl, dv, dr }
  }
}

class Vector2 {
  public x: number = 0
  public y: number = 0

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  array() {
    return [this.x, this.y]
  }

  sqrDistanceTo(other: Vector2) {
    return (this.x - other.x) ** 2 + (this.y - other.y) ** 2
  }

  add(v: Vector2) {
    return new Vector2(this.x + v.x, this.y + v.y)
  }

  sub(v: Vector2) {
    return new Vector2(this.x - v.x, this.y - v.y)
  }

  length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2)
  }

  norm() {
    const len = this.length()
    return new Vector2(this.x / len, this.y / len)
  }

  mult(scalar: number) {
    return new Vector2(this.x * scalar, this.y * scalar)
  }

  static fromAngle(radians: number) {
    return new Vector2(Math.cos(radians), Math.sin(radians))
  }

  static zero() {
    return new Vector2(0, 0)
  }

  lerp(other: Vector2, factor: number) {
    const dir = other.sub(this).norm().mult(factor)
    return this.add(dir)
  }
}

type Scene = Array<Array<string | null>>
const scene: Scene = [
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, 'purple', 'yellow', null, null, null, null, null],
  [null, null, null, 'blue', 'green', null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
]

document.addEventListener("DOMContentLoaded", () => {
  const game = document.getElementById('game') as HTMLCanvasElement | undefined
  if (!game) throw new Error("Canvas with id of 'game' not found")

  game.width = 800
  game.height = 800


  const ctx = game.getContext('2d')
  if (!ctx) throw new Error("Canvas 2d context not found")

  ctx.fillStyle = '#383838'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)


  let player = new Player()

  let isMovingForward = false
  let isMovingBackward = false
  let isRotatingRight = false
  let isRotatingLeft = false


  const rotateFactor = PI / 250
  const moveFactor = 0.03
  window.addEventListener('keydown', (key) => {
    if (key.key === 'd') {
      // rotate right
      isRotatingRight = true
    } else if (key.key === 'a') {
      // rotate left
      isRotatingLeft = true
    } else if (key.key === 'w') {
      // move forward
      isMovingForward = true
    } else if (key.key === 's') {
      isMovingBackward = true
    }
  })
  window.addEventListener('keyup', (key) => {
    if (key.key === 'd') {
      // rotate right
      isRotatingRight = false
    } else if (key.key === 'a') {
      // rotate left
      isRotatingLeft = false
    } else if (key.key === 'w') {
      // move forward
      isMovingForward = false
    } else if (key.key === 's') {
      isMovingBackward = false
    }
  })

  let prevTimestamp = 0

  const frame = (timestamp: number) => {
    const deltaTime = (timestamp - prevTimestamp) / 1000
    prevTimestamp = timestamp
    const velocity = Vector2.fromAngle(player.dir).norm().mult(moveFactor)

    if (isMovingForward) {
      player.pos = player.pos.add(velocity)
    }
    if (isMovingBackward) {
      player.pos = player.pos.sub(velocity)
    }
    if (isRotatingRight) {
      player.dir += rotateFactor
    }
    if (isRotatingLeft) {
      player.dir -= rotateFactor
    }

    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    minimap(ctx, player)
    renderScene(ctx, player)

    window.requestAnimationFrame(frame)
  }

  window.requestAnimationFrame(timestamp => {
    prevTimestamp = timestamp
    window.requestAnimationFrame(frame)
  })

  minimap(ctx, player)
  renderScene(ctx, player)


})

function renderScene(ctx: CanvasRenderingContext2D, player: Player) {
  const stripWidth = ctx.canvas.width / SCREEN_WIDTH
  const { dr, dl } = player.getFovVectors()
  for (let x = 0; x < SCREEN_WIDTH; x++) {
    const hitting = raycast(ctx, player.pos, dr.lerp(dl, x / SCREEN_WIDTH))
    if (hitting) {
      const c = hittingCell(player.pos, hitting)
      if (c.y < scene.length && c.y >= 0 && c.x < scene[0].length && c.x >= 0) {
        const color = scene[c.y][c.x]
        if (color !== null) {
          const dirVector = hitting.sub(player.pos)
          const distance = dirVector.length()
          const stripHeight = ctx.canvas.height / distance
          ctx.fillStyle = color
          ctx.fillRect(x * stripWidth, (ctx.canvas.height - stripHeight) * 0.5, stripWidth, stripHeight);
        }
      }
    }
  }
  return
}

function minimap(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.save()
  const GRID_SIZE = ctx.canvas.width / GRID_COLS
  ctx.scale(GRID_SIZE, GRID_SIZE)
  ctx.scale(0.3, 0.3)
  // translateVector
  const tv = new Vector2(0.3, 0.3)
  ctx.translate(tv.x, tv.y)
  // set the background of the canvas
  ctx.fillStyle = '#999999'
  ctx.fillRect(0, 0, GRID_ROWS, GRID_COLS)
  ctx.lineWidth = 0.03

  ctx.beginPath()

  for (let i = 0; i < scene.length; i++) {
    for (let j = 0; j < scene[i].length; j++) {
      const color = scene[i][j]
      if (color !== null) {
        ctx.fillStyle = color
      } else {
        ctx.fillStyle = '#999999'
      }
      ctx.fillRect(j, i, 1, 1)
    }
  }

  for (let i = 0; i <= GRID_COLS; i++) {
    ctx.strokeStyle = '#222222'
    strokeLine(ctx, i, 0, i, GRID_COLS)
  }

  ctx.beginPath()
  ctx.strokeStyle = '#222222'
  for (let i = 0; i <= GRID_ROWS; i++) {
    strokeLine(ctx, 0, i, GRID_ROWS, i)
  }
  renderPlayer(ctx, player)
  // raycast(ctx, player.pos, p2)
  ctx.restore()

}

function renderPlayer(ctx: CanvasRenderingContext2D, player: Player) {

  ctx.fillStyle = 'red'
  fillCircle(ctx, player.pos.x, player.pos.y, 0.1)

  const { dl, dr, dv } = player.getFovVectors()

  ctx.strokeStyle = 'purple'
  strokeLine(ctx, player.pos.x, player.pos.y, dv.x, dv.y)
  strokeLine(ctx, player.pos.x, player.pos.y, dl.x, dl.y)
  strokeLine(ctx, player.pos.x, player.pos.y, dr.x, dr.y)

  strokeLine(ctx, dl.x, dl.y, dr.x, dr.y)

}

function raycast(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
  ctx.beginPath()
  ctx.fillStyle = 'red'
  fillCircle(ctx, p1.x, p1.y, 0.1)

  ctx.beginPath()
  fillCircle(ctx, p2.x, p2.y, 0.1)


  ctx.strokeStyle = 'blue'
  strokeLine(ctx, p1.x, p1.y, p2.x, p2.y)

  while (true) {
    const p3 = snapTo(p1, p2)
    if (p3) {
      fillCircle(ctx, p3.x, p3.y, 0.1)
      strokeLine(ctx, p2.x, p2.y, p3.x, p3.y)
    }
    p1 = p2
    p2 = p3
    if (p3.x >= GRID_COLS || p3.y >= GRID_ROWS || p3.x < 0 || p3.y < 0) {
      return null
    }

    const c = hittingCell(p1, p2)
    if (c.x >= GRID_COLS || c.y >= GRID_ROWS || c.x < 0 || c.y < 0) {
      return p1
    }

    if (scene[c.y][c.x] !== null) {
      return p3
    }
  }
}

function hittingCell(p1: Vector2, p2: Vector2): Vector2 {
  const d = p2.sub(p1);
  return new Vector2(Math.floor(p2.x + Math.sign(d.x) * epsilon),
    Math.floor(p2.y + Math.sign(d.y) * epsilon));
}

function snapTo(p1: Vector2, p2: Vector2): Vector2 {

  // y1 = mx1 + c
  // y2 = mx2 + c
  // y = mx + c
  // x = (y - c) / m
  const dy = p2.y - p1.y
  const dx = p2.x - p1.x
  1
  const offsetVector = new Vector2(Math.sign(dx) * epsilon, Math.sign(dy) * epsilon)
  p1 = p1.add(offsetVector)
  p2 = p2.add(offsetVector)

  if (dx === 0) {
    if (dy > 0) {
      return new Vector2(p2.x, Math.ceil(p2.y))
    } else {
      return new Vector2(p2.x, Math.floor(p2.y))
    }
  }
  const m = dy / dx
  const c = p1.y - m * p1.x

  let x3 = 0
  if (dx > 0) {
    x3 = Math.ceil(p2.x)
  } else {
    x3 = Math.floor(p2.x)
  }

  let y3 = m * x3 + c
  const firstCandidate = new Vector2(x3, y3)

  if (dy > 0) {
    y3 = Math.ceil(p2.y)
  } else {
    y3 = Math.floor(p2.y)
  }

  x3 = (y3 - c) / m
  const secondCandidate = new Vector2(x3, y3)

  if (p2.sqrDistanceTo(firstCandidate) < p2.sqrDistanceTo(secondCandidate)) {
    return firstCandidate
  }
  return secondCandidate

}

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)

  ctx.fill()
}

function strokeLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}
