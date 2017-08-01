// Swarm variables
let SWARM = null
const SWARM_SIZE = 100
let SWARM_MASS = 10
let NEARBY_SIZE = 100

let CANVAS_SIZE = 500
let AVGAIM_MONITOR = 5
let AVOID_RANGE = 30
let AVOID_POWER = 1.6
let FRAMERATE = 35

// Updates in getCanvasSize()
let ORGIN = { x: 0, y: 0 }

const TORADIAN = (Math.PI / 180)
const STATES = {
  // Word Based
  Still: 0,
  Wander: 1,
  Seek: 2,
  Follow: 3,
  Flee: 4,
  Circles: 5,
  Nothing: 10,

  // Number based
  0: 'Still',
  1: 'Wander',
  2: 'Seek',
  3: 'Follow',
  4: 'Flee',
  5: 'Circles',
  10: 'Nothing'
}

var canvas = document.getElementById('ctx')
var ctx = document.getElementById('ctx').getContext('2d')

// Full page Canvas SECOND ARGUMENT = ADJUSTMENT TO SIZE
CANVAS_SIZE = getCanvasSize(ctx, 10)
canvas.width = canvas.height = CANVAS_SIZE
ctx.font = '30px Roboto'
// Swarm class
var Swarm = function () {
  var self = {
    things: [],
    target: ORGIN,
    state: 0
  }
  // Create Swarm
  if (self.things[0] === undefined) {
    for (var i = 0; i < SWARM_SIZE; i++) {
      self.things.push(Thing())
    };
  }
  self.setState = function (newState) {
    var oldState = self.things[0].state
    self.state = newState

    (self.state !== oldState) ? self.things.map(function (thing) {
      thing.state = self.state
    }) : ''// Nothing
  }
  self.setTarget = coords => self.target = coords
  self.update = () => self.things.map(thing => thing.update())
  return self
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
    state: undefined
  }
  self.update = function () {
    self.updatePosition()
    self.phaseWalls()
  }
  self.updatePosition = function () {
    self.x += self.spdX
    self.y += self.spdY
    self.currentAngle = angleToPoint({ x: self.spdX, y: self.spdY })
    self.totalSpeed = Math.sqrt(self.spdX * self.spdX + self.spdY * self.spdY)
  }
  self.phaseWalls = function () {
    // X Checks
    if (self.x > CANVAS_SIZE && self.spdx !== 0) {
      self.x -= CANVAS_SIZE
    } else if (self.x < 0 && self.spdx !== 0) {
      self.x += CANVAS_SIZE
    }
    // Y Checks
    if (self.y > CANVAS_SIZE && self.spdY !== 0) {
      self.y -= CANVAS_SIZE
    } else if (self.y < 0 && self.spdY !== 0) {
      self.y += CANVAS_SIZE
    }
  }
  return self
}

// Thing Class
var Thing = function () {
  var self = Entity()
  // Random Starting point
  self.x = Math.random() * CANVAS_SIZE
  self.y = Math.random() * CANVAS_SIZE

  // ==== UTILITY FUNCTIONS ====
  var entity_update = self.update
  self.acclerate = function (ammount) {
    self.totalSpeed += ammount
    self.spdX = (self.totalSpeed) * Math.cos(self.currentAngle)
    self.spdY = (self.totalSpeed) * Math.sin(self.currentAngle)
  }
  self.adoptAvgSpeed = function (nearby) {
    var distances = nearby
    var numUsed = 0
    var numSpd = 0

    distances.map((item) => {
      if (item.dis < NEARBY_SIZE) {
        numUsed++
        numSpd += b[item.index].totalSpeed
      }
    })

    // minus one for the self that is included in array
    var avgSpd = numSpd / numUsed

    self.acclerate(avgSpd - self.totalSpeed)
  }
  self.near = function () {
    var distances = b.map((item, index) => {
      var distance = disToPoint(self, b[index])
      return { dis: distance, index: index }
    })

    // Sort by distances
    distances.sort((a, b) => { return a.dis - b.dis })
    // Cut the crap farther away from self
    removeThing(distances, AVGAIM_MONITOR + 1, SWARM_SIZE)
    return distances
  }
  self.avoidNeighbors = function () {
    self.near().map((item) => {
      var other = b[item.index]
      if (item.dis < AVOID_RANGE && item.dis !== 0) {
        var angle = angleToPoint(self, other)
        self.x -= Math.cos(angle) * AVOID_POWER
        self.y -= Math.sin(angle) * AVOID_POWER
      }
    })
  }
  self.averageAim = function () {
    var useNearby = true
    var len = 13
    var numx = 0
    var numy = 0
    var numUsed = 0

    self.near().map((item) => {
      if (useNearby && item.dis < NEARBY_SIZE) {
        numUsed++
        numx += b[item.index].x + (len * b[item.index].spdX)
        numy += b[item.index].y + (len * b[item.index].spdY)
      }
    })

    // minus one for the self that is included in array
    var avgX = numx / numUsed
    var avgY = numy / numUsed
    var avgAim = { x: avgX, y: avgY }

    // GET AVG SPEED
    if (numUsed > 1 && self.state === 3) {
      self.adoptAvgSpeed(distances)
    }

    return avgAim
  }

  // ==== STATE FUNCTIONS ====
  self.update = function () {
    switch (self.state) {
      // Still
      case 0:
        self.still()
        break

      // Almost Wander
      case 1:
        self.wander()
        // Nothing
        break

      // Seek
      case 2:
        self.seekTarget()
        break

      // Follow
      case 3:
        self.follow()
        break

      // Flee
      case 4:
        console.log('Broken')
        s(1)
        break

      // Circles Everywhere
      case 5:
        self.turn(10)
        break
      case 10:
      // do nothing
    }
    self.avoidNeighbors()
    entity_update()
  }

  self.still = function () {
    if (self.spdX !== 0 || self.spdY !== 0) {
      self.spdX = 0
      self.spdY = 0
    }
  }
  self.wander = function () {
    let maxSpeed = 4
    const useSpd = () => getBoundedRand(-maxSpeed, maxSpeed)

    if (self.state === 1) {
      self.spdX = useSpd()
      self.spdY = useSpd()
      self.state = 1.5
    }

    SWARM.state = 1
  }
  self.seekTarget = function () {
    var t = SWARM.target
    var angleRad = angleToPoint(self, t)// * 180 / Math.PI;
    var dis = disToPoint(self, t)

    self.spdX = 0.05 * dis * Math.cos(angleRad)
    self.spdY = 0.05 * dis * Math.sin(angleRad)
  }
  self.follow = function (x, y) {
    var followAvg = true
    if (followAvg) {
      // Use this for follow the average aim function
      var other = self.averageAim()
    } else {
      // Use this for follow the first block.
      var other = b[0]
      if (other.totalSpeed < 4) other.acclerate(1)
      if (self.totalSpeed > 3.8) self.acclerate(-0.3)

      if (other.state === 3) {
        other.state = 1
      }
    }

    var desiredAngle = angleToPoint(self, other)
    self.spdX = self.totalSpeed * Math.cos(desiredAngle)
    self.spdY = self.totalSpeed * Math.sin(desiredAngle)
  }
  self.turn = function (turnAngle) {
    // This function uses radians (only way it would work)
    var currentAngleRad = self.currentAngle
    var angle = currentAngleRad + (turnAngle * TORADIAN)

    // angle = angle - Math.floor(angle/360)*360;
    self.spdX = self.totalSpeed * Math.cos(angle)
    self.spdY = self.totalSpeed * Math.sin(angle)
  }
  return self
}

// ==== Rendering Functions ====
var clearCanvas = function () {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}
var renderFirst = function (data) {
  var s = SWARM_MASS * 1.75
  ctx.fillStyle = '#FF00FF'
  ctx.fillRect(data[0].x - s / 2, data[0].y - s / 2, s, s)
}
var renderWhite = function (data) {
  // Render all but first unit
  ctx.fillStyle = '#FFFFFF'
  var s = SWARM_MASS

  data.map(function (thing) {
    ctx.fillRect(thing.x - s / 2, thing.y - s / 2, s, s)
  })
}
var renderAllAverageAim = function () {
  b.map(function (thing) {
    var avgAim = thing.averageAim()
    var s = SWARM_MASS * 0.5
    ctx.fillStyle = '#00FF00'
    ctx.fillRect(avgAim.x - s / 2, avgAim.y - s / 2, s, s)
  })
}
var showAim = function (data) {
  var len = 8
  data.map(function (s) {
    var start = { x: s.x, y: s.y }
    var end = { x: s.x + (len * s.spdX), y: s.y + (len * s.spdY) }
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.lineWidth = 1.5
    ctx.strokeStyle = '#FF00FF'
    ctx.stroke()
  })
}

SWARM = Swarm()
var b = SWARM.things

// Final frame runner
setInterval(function () {
  SWARM.update()
  clearCanvas()
  renderWhite(b)
  renderFirst(b)
  renderAllAverageAim()
  showAim(b)
}, 1000 / FRAMERATE)
