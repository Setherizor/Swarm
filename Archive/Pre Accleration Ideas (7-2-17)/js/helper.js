// --- HELPER FUNCTIONS ---
function getBoundedRand(min, max) {
    return Math.random() * (max - min) + min;
}
function getBoundedInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

// Click Events
var canvas = document.getElementById("ctx");
canvas.addEventListener("mousedown", function(event) {
    var x = event.pageX;
    var y = event.pageY;
    // Seek & coordinates
    s(2, {x: x, y: y});
});

canvas.addEventListener("mouseup", function(event) {
   s(1.5);
});

// Command swarm
function s(num, coords) {
    // Simple Change
    if (coords == undefined) {
        SWARM.setState(num);
        console.log("State changed to " + STATES[num])
        return num;
    } else {
        // Seek command with coords object
        SWARM.setTarget(coords);
        SWARM.setState(num);
        console.log("Sent Swarm to (" + coords.x + ", " + coords.y + ")");
    }
}


// Remove Swarm thing
function removeThing(array, toRemove, number) {
    array.splice(toRemove, number);
}
// Example: removeThing(SWARM.things, 0, 1);

// Max canvas square size
function getCanvasSize(ctx, adjustment) {
    var square = 0;
    var w = window.innerWidth - adjustment;
    var h = window.innerHeight - adjustment;

    if (w > h) {
        square = h;
    } else {
        square = w;
    }

    return square;
}