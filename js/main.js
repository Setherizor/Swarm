// Swarm variables
SWARM = null;
SWARM_SIZE = 2;
SWARM_MASS = 10;

CANVAS_SIZE = 500;
AVGAIM_MONITOR = 5;
AVOID_RANGE = 20;
AVOID_POWER = 1.6;
FRAMERATE = 35;

TODEGREE = (180 / Math.PI);
TORADIAN = (Math.PI / 180);

STATES = {
    // Word Based
    Still: 0,
    AlmostWander: 1,
    Wander: 1.5,
    Seek: 2,
    Follow: 3,
    Flee: 4,
    Circles: 5,
    Nothing: 10,

    // Number based
    0: "Still",
    1: "Almost Wander",
    1.5: "Wander",
    2: "Seek",
    3: "Follow",
    4: "Flee",
    5: "Circles",
    10: "Nothing"
}

var canvas = document.getElementById("ctx");
var ctx = document.getElementById("ctx").getContext("2d");

// Full page Canvas
var adjustment = 10;
CANVAS_SIZE = getCanvasSize(ctx, adjustment);
canvas.width = canvas.height = CANVAS_SIZE;
ctx.font = '30px Roboto';

// Swarm class
var Swarm = function () {
    var self = {
        things: [],
        target: { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 },
        state: 0
    }

    // Create Swarm
    if (self.things[0] == undefined) {
        for (i = 0; i < SWARM_SIZE; i++) {
            self.things.push(Thing());
        };
    }

    self.setState = function (newState) {
        var oldState = self.things[0].state;
        self.state = newState;

        if (self.state != oldState) {
            for (var i = 0; i < self.things.length; i++) {
                self.things[i].state = self.state;
            };
        }
    }
    self.setTarget = function (coords) {
        self.target = coords;
    }
    self.update = function () {
        for (var i = 0; i < self.things.length; i++) {
            self.things[i].update();
        };
    }
    return self;
}


// Entity Class
var Entity = function () {
    var self = {
        x: 0,
        y: 0,
        spdX: 0,
        spdY: 0,
        totalSpeed: 0,
        currentAngle: 0,
        state: undefined,
    }
    self.update = function () {
        self.updatePosition();
        self.collideWalls();
    }
    self.updatePosition = function () {
        self.x += self.spdX;
        self.y += self.spdY;
        self.currentAngle = Math.atan2(self.spdY, self.spdX);
        self.totalSpeed = Math.sqrt(self.spdX * self.spdX + self.spdY * self.spdY);
    }
    self.collideWalls = function () {
        // Someday add function to teleport Thing back inside canvas
        if (self.x > CANVAS_SIZE && self.spdx != 0) self.spdX *= -1;
        if (self.x < 0 && self.spdx != 0) self.spdX *= -1;

        if (self.y > CANVAS_SIZE && self.spdY != 0) self.spdY *= -1;
        if (self.y < 0 && self.spdY != 0) self.spdY *= -1;
    }
    return self;
}

// Thing Class
var Thing = function () {
    var self = Entity();
    // Random Starting point
    self.x = Math.random() * CANVAS_SIZE;
    self.y = Math.random() * CANVAS_SIZE;

    // ==== NON STATE FUNCTIONS ====
    var entity_update = self.update;
    self.acclerate = function (ammount) {
        self.totalSpeed += ammount;
        self.spdX = (self.totalSpeed) * Math.cos(self.currentAngle);
        self.spdY = (self.totalSpeed) * Math.sin(self.currentAngle);
    }
    self.near = function () {
        var distances = [];
        for (var i = 0; i < SWARM.things.length; i++) {
            var distance = disToPoint(self, SWARM.things[i]);
            distances.push({ dis: distance, index: i });

            // Sort by distances
            distances.sort(function (a, b) { return a.dis - b.dis; });
            // Cut the crap farther away from self
            removeThing(distances, AVGAIM_MONITOR + 1, SWARM_SIZE);
        };
        return distances;
    }
    self.avoidNeighbors = function () {
        var distances = self.near();
        for (var i = 0; i < distances.length; i++) {
            var curr = distances[i];
            var other = SWARM.things[curr.index]

            if (curr.dis < AVOID_RANGE && curr.dis != 0) {
                var angle = angleToPoint(self, other);
                self.x -= Math.cos(angle) * AVOID_POWER;
                self.y -= Math.sin(angle) * AVOID_POWER;
            }
        }
    }
    self.averageAim = function (s) {
        var len = 10;
        var numx = 0;
        var numy = 0;
        var distances = s[0].near();

        for (var i = 0; i < distances.length; i++) {
            var curr = distances[i];
            numx += s[curr.index].x + (len * s[curr.index].spdX);
            numy += s[curr.index].y + (len * s[curr.index].spdY);
        }

        avgX = numx / distances.length - 1;
        avgY = numy / distances.length - 1;

        var avgAim = { x: avgX, y: avgY };
        return avgAim;
    }

    // ==== STATE FUNCTIONS ====
    self.update = function () {
        switch (self.state) {
            // Still 
            case 0:
                self.still();
                break;

            // Almost Wander 
            case 1:
                self.wander();
                // Nothing
                break;

            // Seek 
            case 2:
                self.seekTarget();
                break;

            // Follow 
            case 3:
                self.follow();
                break;

            // Flee 
            case 4:
                console.log("Broken");
                s(1);
                break;

            // Circles Everywhere
            case 5:
                self.turn(12);
                break;
            case 10:
            // do nothing
        }
        self.avoidNeighbors();
        entity_update();
    }

    self.still = function () {
        if (self.spdX != 0 || self.spdY != 0) {
            self.spdX = 0;
            self.spdY = 0;
        }
    }
    self.wander = function () {
        var maxSpeed = 4;
        var useSpd = "getBoundedRand(-maxSpeed, maxSpeed);";
        if (self.state == 1) {
            self.spdX = eval(useSpd);
            self.spdY = eval(useSpd);
            self.state = 1.5;
        }
        SWARM.state = 1;
    }
    self.seekTarget = function () {
        var t = SWARM.target;
        var angleRad = angleToPoint(self, t);// * 180 / Math.PI;
        var dis = disToPoint(self, t);

        self.spdX = .05 * dis * Math.cos(angleRad);
        self.spdY = .05 * dis * Math.sin(angleRad);
    }
    self.follow = function (x, y) {
        var other = SWARM.things[0];
        if (other.state === 3) {
            other.state = 1;
        }
        if (other.totalSpeed < 4) other.acclerate(1);
        if (self.totalSpeed > 3.8) self.acclerate(-.3);

        var desiredAngle = angleToPoint(self, other);
        var dis = disToPoint(self, other);

        self.spdX = self.totalSpeed * Math.cos(desiredAngle);
        self.spdY = self.totalSpeed * Math.sin(desiredAngle);
    }
    self.turn = function (turnAngle) {
        // This function uses radians (only way it would work)
        var currentAngleRad = self.currentAngle;
        angle = currentAngleRad + (turnAngle * TORADIAN);

        // angle = angle - Math.floor(angle/360)*360;
        self.spdX = self.totalSpeed * Math.cos(angle);
        self.spdY = self.totalSpeed * Math.sin(angle);
    }
    return self;
}

// ==== Rendering Functions ====
var renderFirst = function (data) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var s = SWARM_MASS * 1.75;
    ctx.fillStyle = "#FF00FF";
    ctx.fillRect(data[0].x - s / 2, data[0].y - s / 2, s, s);
}
var render = function (data) {
    // ctx.fillText("Hello World :)", 100, 50);

    // Render all but first unit
    ctx.fillStyle = "#FFFFFF";
    var s = SWARM_MASS;
    for (var i = 1; i < data.length; i++) {
        ctx.fillRect(data[i].x - s / 2, data[i].y - s / 2, s, s);
    };
}
var render0AverageAim = function (s) {
    avgAim = SWARM.things[0].averageAim(s);

    s = SWARM_MASS * 1.5;
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(avgAim.x - s / 2, avgAim.y - s / 2, s, s);
}
var showAim = function (data) {
    var len = 8;
    for (var i = 0; i < data.length; i++) {
        var s = data[i];
        var start = { x: s.x, y: s.y };
        var end = { x: s.x + (len * s.spdX), y: s.y + (len * s.spdY) };
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FF00FF';
        ctx.stroke();
    };
}

SWARM = Swarm();
var b = SWARM.things;

// Final frame runner
setInterval(function () {
    SWARM.update();
    renderFirst(b);
    render(b);
    render0AverageAim(b);
    showAim(b);
}, 1000 / FRAMERATE);