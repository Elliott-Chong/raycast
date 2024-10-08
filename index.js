var GRID_COLS = 10;
var SCREEN_WIDTH = 600;
var epsilon = 1e-6;
var GRID_ROWS = 10;
var PI = Math.PI;
var FOV = PI / 4;
var SCREEN_DISTANCE = 1;
var Player = /** @class */ (function () {
    function Player() {
        this.pos = new Vector2(2, 5);
        // dir is an angle represented in radians
        this.dir = -PI / 4;
    }
    Player.prototype.getFovVectors = function () {
        // direction vector, direction left and drection right
        var dv = Vector2.fromAngle(this.dir).norm().mult(SCREEN_DISTANCE).add(this.pos);
        var dl = Vector2.fromAngle(this.dir + (FOV / 2)).norm().mult(SCREEN_DISTANCE / Math.cos(FOV / 2)).add(this.pos);
        var dr = Vector2.fromAngle(this.dir - (FOV / 2)).norm().mult(SCREEN_DISTANCE / Math.cos(FOV / 2)).add(this.pos);
        return { dl: dl, dv: dv, dr: dr };
    };
    return Player;
}());
var Vector2 = /** @class */ (function () {
    function Vector2(x, y) {
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
    }
    Vector2.prototype.array = function () {
        return [this.x, this.y];
    };
    Vector2.prototype.sqrDistanceTo = function (other) {
        return Math.pow((this.x - other.x), 2) + Math.pow((this.y - other.y), 2);
    };
    Vector2.prototype.add = function (v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    };
    Vector2.prototype.sub = function (v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    };
    Vector2.prototype.length = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };
    Vector2.prototype.norm = function () {
        var len = this.length();
        return new Vector2(this.x / len, this.y / len);
    };
    Vector2.prototype.mult = function (scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    };
    Vector2.fromAngle = function (radians) {
        return new Vector2(Math.cos(radians), Math.sin(radians));
    };
    Vector2.zero = function () {
        return new Vector2(0, 0);
    };
    Vector2.prototype.lerp = function (other, factor) {
        var dir = other.sub(this).norm().mult(factor);
        return this.add(dir);
    };
    return Vector2;
}());
var scene = [
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
];
document.addEventListener("DOMContentLoaded", function () {
    var game = document.getElementById('game');
    if (!game)
        throw new Error("Canvas with id of 'game' not found");
    game.width = 800;
    game.height = 800;
    var ctx = game.getContext('2d');
    if (!ctx)
        throw new Error("Canvas 2d context not found");
    ctx.fillStyle = '#383838';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    var player = new Player();
    var isMovingForward = false;
    var isMovingBackward = false;
    var isRotatingRight = false;
    var isRotatingLeft = false;
    var rotateFactor = PI / 250;
    var moveFactor = 0.03;
    window.addEventListener('keydown', function (key) {
        if (key.key === 'd') {
            // rotate right
            isRotatingRight = true;
        }
        else if (key.key === 'a') {
            // rotate left
            isRotatingLeft = true;
        }
        else if (key.key === 'w') {
            // move forward
            isMovingForward = true;
        }
        else if (key.key === 's') {
            isMovingBackward = true;
        }
    });
    window.addEventListener('keyup', function (key) {
        if (key.key === 'd') {
            // rotate right
            isRotatingRight = false;
        }
        else if (key.key === 'a') {
            // rotate left
            isRotatingLeft = false;
        }
        else if (key.key === 'w') {
            // move forward
            isMovingForward = false;
        }
        else if (key.key === 's') {
            isMovingBackward = false;
        }
    });
    var prevTimestamp = 0;
    var frame = function (timestamp) {
        var deltaTime = (timestamp - prevTimestamp) / 1000;
        prevTimestamp = timestamp;
        var velocity = Vector2.fromAngle(player.dir).norm().mult(moveFactor);
        if (isMovingForward) {
            player.pos = player.pos.add(velocity);
        }
        if (isMovingBackward) {
            player.pos = player.pos.sub(velocity);
        }
        if (isRotatingRight) {
            player.dir += rotateFactor;
        }
        if (isRotatingLeft) {
            player.dir -= rotateFactor;
        }
        ctx.fillStyle = "#181818";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        minimap(ctx, player);
        renderScene(ctx, player);
        window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(function (timestamp) {
        prevTimestamp = timestamp;
        window.requestAnimationFrame(frame);
    });
    minimap(ctx, player);
    renderScene(ctx, player);
});
function renderScene(ctx, player) {
    var stripWidth = ctx.canvas.width / SCREEN_WIDTH;
    var _a = player.getFovVectors(), dr = _a.dr, dl = _a.dl;
    for (var x = 0; x < SCREEN_WIDTH; x++) {
        var hitting = raycast(ctx, player.pos, dr.lerp(dl, x / SCREEN_WIDTH));
        if (hitting) {
            var c = hittingCell(player.pos, hitting);
            if (c.y < scene.length && c.y >= 0 && c.x < scene[0].length && c.x >= 0) {
                var color = scene[c.y][c.x];
                if (color !== null) {
                    var dirVector = hitting.sub(player.pos);
                    var distance = dirVector.length();
                    var stripHeight = ctx.canvas.height / distance;
                    ctx.fillStyle = color;
                    ctx.fillRect(x * stripWidth, (ctx.canvas.height - stripHeight) * 0.5, stripWidth, stripHeight);
                }
            }
        }
    }
    return;
}
function minimap(ctx, player) {
    ctx.save();
    var GRID_SIZE = ctx.canvas.width / GRID_COLS;
    ctx.scale(GRID_SIZE, GRID_SIZE);
    ctx.scale(0.3, 0.3);
    // translateVector
    var tv = new Vector2(0.3, 0.3);
    ctx.translate(tv.x, tv.y);
    // set the background of the canvas
    ctx.fillStyle = '#999999';
    ctx.fillRect(0, 0, GRID_ROWS, GRID_COLS);
    ctx.lineWidth = 0.03;
    ctx.beginPath();
    for (var i = 0; i < scene.length; i++) {
        for (var j = 0; j < scene[i].length; j++) {
            var color = scene[i][j];
            if (color !== null) {
                ctx.fillStyle = color;
            }
            else {
                ctx.fillStyle = '#999999';
            }
            ctx.fillRect(j, i, 1, 1);
        }
    }
    for (var i = 0; i <= GRID_COLS; i++) {
        ctx.strokeStyle = '#222222';
        strokeLine(ctx, i, 0, i, GRID_COLS);
    }
    ctx.beginPath();
    ctx.strokeStyle = '#222222';
    for (var i = 0; i <= GRID_ROWS; i++) {
        strokeLine(ctx, 0, i, GRID_ROWS, i);
    }
    renderPlayer(ctx, player);
    // raycast(ctx, player.pos, p2)
    ctx.restore();
}
function renderPlayer(ctx, player) {
    ctx.fillStyle = 'red';
    fillCircle(ctx, player.pos.x, player.pos.y, 0.1);
    var _a = player.getFovVectors(), dl = _a.dl, dr = _a.dr, dv = _a.dv;
    ctx.strokeStyle = 'purple';
    strokeLine(ctx, player.pos.x, player.pos.y, dv.x, dv.y);
    strokeLine(ctx, player.pos.x, player.pos.y, dl.x, dl.y);
    strokeLine(ctx, player.pos.x, player.pos.y, dr.x, dr.y);
    strokeLine(ctx, dl.x, dl.y, dr.x, dr.y);
}
function raycast(ctx, p1, p2) {
    ctx.beginPath();
    ctx.fillStyle = 'red';
    fillCircle(ctx, p1.x, p1.y, 0.1);
    ctx.beginPath();
    fillCircle(ctx, p2.x, p2.y, 0.1);
    ctx.strokeStyle = 'blue';
    strokeLine(ctx, p1.x, p1.y, p2.x, p2.y);
    while (true) {
        var p3 = snapTo(p1, p2);
        if (p3) {
            fillCircle(ctx, p3.x, p3.y, 0.1);
            strokeLine(ctx, p2.x, p2.y, p3.x, p3.y);
        }
        p1 = p2;
        p2 = p3;
        if (p3.x >= GRID_COLS || p3.y >= GRID_ROWS || p3.x < 0 || p3.y < 0) {
            return null;
        }
        var c = hittingCell(p1, p2);
        if (c.x >= GRID_COLS || c.y >= GRID_ROWS || c.x < 0 || c.y < 0) {
            return p1;
        }
        if (scene[c.y][c.x] !== null) {
            return p3;
        }
    }
}
function hittingCell(p1, p2) {
    var d = p2.sub(p1);
    return new Vector2(Math.floor(p2.x + Math.sign(d.x) * epsilon), Math.floor(p2.y + Math.sign(d.y) * epsilon));
}
function snapTo(p1, p2) {
    // y1 = mx1 + c
    // y2 = mx2 + c
    // y = mx + c
    // x = (y - c) / m
    var dy = p2.y - p1.y;
    var dx = p2.x - p1.x;
    1;
    var offsetVector = new Vector2(Math.sign(dx) * epsilon, Math.sign(dy) * epsilon);
    p1 = p1.add(offsetVector);
    p2 = p2.add(offsetVector);
    if (dx === 0) {
        if (dy > 0) {
            return new Vector2(p2.x, Math.ceil(p2.y));
        }
        else {
            return new Vector2(p2.x, Math.floor(p2.y));
        }
    }
    var m = dy / dx;
    var c = p1.y - m * p1.x;
    var x3 = 0;
    if (dx > 0) {
        x3 = Math.ceil(p2.x);
    }
    else {
        x3 = Math.floor(p2.x);
    }
    var y3 = m * x3 + c;
    var firstCandidate = new Vector2(x3, y3);
    if (dy > 0) {
        y3 = Math.ceil(p2.y);
    }
    else {
        y3 = Math.floor(p2.y);
    }
    x3 = (y3 - c) / m;
    var secondCandidate = new Vector2(x3, y3);
    if (p2.sqrDistanceTo(firstCandidate) < p2.sqrDistanceTo(secondCandidate)) {
        return firstCandidate;
    }
    return secondCandidate;
}
function fillCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}
function strokeLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
