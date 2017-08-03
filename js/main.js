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
    }
  }
  self.setState = function (newState) {
    var oldState = self.things.state
    self.state = newState

    if (self.state !== oldState) {
      self.things.forEach(function (thing) {
        thing.state = self.state
      })
    }
  }
  self.setTarget = function (coords) {
    self.target = coords
  }
  self.update = () => self.things.forEach(thing => thing.update())
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
  var entityUpdate = self.update
  self.acclerate = function (ammount) {
    self.totalSpeed += ammount
    self.spdX = (self.totalSpeed) * Math.cos(self.currentAngle)
    self.spdY = (self.totalSpeed) * Math.sin(self.currentAngle)
  }
  self.adoptAvgSpeed = function (distances) {
    var totUsed = 0

    // This Gets approproate objs then adds the total speed together
    const closeEnough = (x) => (x.dis < NEARBY_SIZE)
    var totSpd = distances.filter(el => { return closeEnough(el) }).reduce((sum, item) => {
      totUsed++
      return sum + b[item.index].totalSpeed
    }, 0)

    var avgSpd = totSpd / totUsed

    self.acclerate(avgSpd - self.totalSpeed)
  }
  self.near = function () {
    const sortByDis = (a, b) => { return a.dis - b.dis }

    // Distaces in pixels, array, sorted by distance
    var distances = b.map((item, index) => {
      var distance = disToPoint(self, b[index])
      return { dis: distance, index: index }
    }).sort(sortByDis)

    // Cut the crap farther away from self
    removeThing(distances, AVGAIM_MONITOR + 1, SWARM_SIZE)
    // Delete Zero dis Self from array
    removeThing(distances, 0, 1)
    return distances
  }
  self.avoidNeighbors = function () {
    const shouldMove = x => x.dis < AVOID_RANGE

    self.near().forEach((item) => {
      var other = b[item.index]
      if (shouldMove(item)) {
        var angle = angleToPoint(self, other)
        self.x -= Math.cos(angle) * AVOID_POWER
        self.y -= Math.sin(angle) * AVOID_POWER
      }
    })
  }
  self.averageAim = function () {
    var useNearby = true
    var len = 13
    var totx = 0
    var toty = 0
    var totUsed = 0
    var distances = self.near()

    const closeEnough = x => useNearby && x.dis < NEARBY_SIZE
    distances.forEach((item) => {
      if (closeEnough(item)) {
        totUsed++
        totx += b[item.index].x + (len * b[item.index].spdX)
        toty += b[item.index].y + (len * b[item.index].spdY)
      }
    })

    var avgX = totx / totUsed
    var avgY = toty / totUsed
    var avgAim = { x: avgX, y: avgY }

    // ADOPT AVG SPEED for Flock State
    if (totUsed > 1 && self.state === 3) {
      self.adoptAvgSpeed(distances)
    }

    return avgAim
  }

  // ==== STATE FUNCTIONS ====
  self.update = function () {
    const executeIfFunction = f =>
      typeof f === 'function' ? f() : f

    const switchcase = cases => defaultCase => key =>
      key in cases ? cases[key] : defaultCase

    const switchcaseF = cases => defaultCase => key =>
      executeIfFunction(switchcase(cases)(defaultCase)(key))

    const runState = x => switchcaseF({
      0: self.still,
      1: self.wander,
      2: self.seekTarget,
      3: self.follow,
      4: self.broken,
      5: self.turn10
    })('')(x)
    runState(self.state)

    self.avoidNeighbors()
    entityUpdate()
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
    var other = self.averageAim()

    var desiredAngle = angleToPoint(self, other)
    self.spdX = self.totalSpeed * Math.cos(desiredAngle)
    self.spdY = self.totalSpeed * Math.sin(desiredAngle)
  }
  self.turn = function (turnAngle) {
    // This function uses radians
    var currentAngleRad = self.currentAngle
    var angle = currentAngleRad + (turnAngle * TORADIAN)

    self.spdX = self.totalSpeed * Math.cos(angle)
    self.spdY = self.totalSpeed * Math.sin(angle)
  }
  self.turn10 = () => self.turn(10)
  self.broken = () => {
    console.log("Broken")
    self.state = 1.5
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
  ctx.fillStyle = '#FFFFFF'
  var s = SWARM_MASS

  data.forEach(function (thing) {
    ctx.fillRect(thing.x - s / 2, thing.y - s / 2, s, s)
  })
}
var renderAverageAim = function (data) {
  data.forEach(function (thing) {
    var avgAim = thing.averageAim()
    var s = SWARM_MASS * 0.5
    ctx.fillStyle = '#00FF00'
    ctx.fillRect(avgAim.x - s / 2, avgAim.y - s / 2, s, s)
  })
}
var showAim = function (data) {
  var len = 8
  data.forEach(function (s) {
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
  renderAverageAim(b)
  showAim(b)
}, 1000 / FRAMERATE)
