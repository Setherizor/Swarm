// Swarm variables
SWARM = null;
SWARM_SIZE = 300;
SWARM_MASS = 6;
CANVAS_SIZE = 0;

STATES = {
    // Word Based
    Still: 0,
    Wander: 1,
    AlmostWander: 1.5,
    Seek: 2,
    Follow: 3,
    Flee: 4,
    Near: 5,
    Nothing: 10,

    // Number based
    0: "Still",
    1: "Wander",    
    1.5: "almost Wander",
    2: "Seek",
    3: "Follow",
    4: "Flee",
    5: "Near",
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
        target: {x: 0, y: 0},
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
    self.setTarget = function(coords) {
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
        state: undefined,
    }
    self.update = function () {
        self.updatePosition();
        self.collideWalls();
    }
    self.updatePosition = function () {
        self.x += self.spdX;
        self.y += self.spdY;
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

    var entity_update = self.update;
    self.update = function () {
 
        switch (self.state) {
            // Still 
            case 0:
                self.still();
                break;

        /*   // Wander 
            case 1:
                //self.wander();
                // Nothing
                break;
        */
            // Almost Wander 
            case 1.5:
                self.wander();
                break;

            // Seek 
            case 2:
                self.seekTarget();
                break;

            // Follow 
            case 3:
                console.log("Broken");
                s(1);
                break;

            // Flee 
            case 4:
                console.log("Broken");
                s(1);
                break;

            // Near 
            case 5:
                console.log("Broken");
                s(1);
                break;
            case 10:
                // do nothing
        }
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
            //var totalSpeed = Math.sqrt(Math.pow(self.spdX, 2) + Math.pow(self.spdY,2));
            var useSpd = "getBoundedRand(-maxSpeed, maxSpeed);";
            if (self.state == 1.5) {
                self.spdX = eval(useSpd);
                self.spdY = eval(useSpd);
                self.state = 1;
            }
            SWARM.state = 1;
    }

    self.seekTarget = function () {
        var t = SWARM.target;

        var angleDeg = Math.atan2(t.y - self.y, t.x - self.x);// * 180 / Math.PI;

        var a = self.x - t.x;
        var b = self.y - t.y;
        var dis = Math.sqrt(a * a + b * b);

        self.spdX = .01 * dis * Math.cos(angleDeg);
        self.spdY = .01 * dis * Math.sin(angleDeg);
    }

    return self;
}

var render = function (data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render all units
    //ctx.fillText("Hello World :)", 100, 50);

    ctx.fillStyle = "#FFFFFF";
    var s = SWARM_MASS;
    for (var i = 0; i < data.length; i++) {
        ctx.fillRect(data[i].x - s / 2, data[i].y - s / 2, s, s);
    };
}

SWARM = Swarm();

// Final frame runner
setInterval(function () {
    SWARM.update();
    render(SWARM.things);
}, 1000 / 30);
