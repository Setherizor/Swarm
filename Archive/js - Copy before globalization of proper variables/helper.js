// ==== HELPER FUNCTIONS ====
// Input for the commands ;)
function nativeConsole() {
    var input = document.getElementById("input").value;
    eval(input);
    input = "";
    return false;
}

// Command swarm
function s(num, coords) {
    // Simple Change
    if (coords == undefined) {
        SWARM.setState(num);
        console.log("State changed to " + STATES[num])
        document.getElementById("title").innerText = "Swarm: " + STATES[num];
        return num;
    } else {
        // Seek command with coords object
        SWARM.setTarget(coords);
        SWARM.setState(num);
        console.log("Sent Swarm to (" + coords.x + ", " + coords.y + ")");
    }
}

// Remove thing from Swarm
// Example: removeThing(SWARM.things, 0, 1);
function removeThing(array, toRemove, number) {
    array.splice(toRemove, number);
}

// Math related functions
function getBoundedRand(min, max) {
    return Math.random() * (max - min) + min;
}
function getBoundedInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
function angleToPoint(self, other) {
    // returns radians
    if (other != undefined) {
        return Math.atan2(other.y - self.y, other.x - self.x);
    }
    return Math.atan2(self.y, self.x);
}
function disToPoint(self, other) {
    var a = self.x - other.x;
    var b = self.y - other.y;
    var distance = Math.sqrt(a * a + b * b);
    return distance; // in pixels
}

// Click Events
var canvas = document.getElementById("ctx");
canvas.addEventListener("mousedown", function (event) {
    var x = event.pageX;
    var y = event.pageY;
    var click = { x: x, y: y };
    s(2, click);
    //console.log(angleToPoint(click, SWARM.things[1]))
});
canvas.addEventListener("mouseup", function (event) {
    s(1);
});
canvas.addEventListener("dblclick", function (event) {
    s(5);
});

// Max canvas size for square
function getCanvasSize(ctx, adjustment) {
    var square = 0;
    var w = window.innerWidth - adjustment;
    var h = window.innerHeight - adjustment;

    if (w > h) {
        square = h;
    } else {
        square = w;
    }

    ORGIN = { x: square / 2, y: square / 2 };
    return square;
}