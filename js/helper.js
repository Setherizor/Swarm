// ==== HELPER FUNCTIONS ====
// Input for the commands ;)
const nativeConsole = () => {
  var input = document.getElementById('input').value
  eval(input)
  input = ''
  return false
}

const updateGlobals = () => {
  SWARM_MASS = document.getElementById('smass').value
  NEARBY_SIZE = document.getElementById('nearbySize').value
  AVGAIM_MONITOR = document.getElementById('watchNumber').value
  AVOID_RANGE = document.getElementById('avoidR').value
  AVOID_POWER = document.getElementById('avoidP').value
  FRAMERATE = document.getElementById('fps').value
  return false
}

// Command swarm
const s = (num, coords) => {
  const updateTitle = (state) => {
    document.getElementById('title').innerText = 'Swarm: ' + state
  }
  // Simple State Change
  const stateChange = (num) => {
    SWARM.setState(num)
    console.log('State changed to ' + STATES[num])
    updateTitle(STATES[num])
  }
  // Seek command with coords object
  const seekPoint = (num, coords) => {
    SWARM.setTarget(coords)
    SWARM.setState(num)
    updateTitle(STATES[num])
    console.log('Sent Swarm to (' + coords.x + ', ' + coords.y + ')')
  }
  (coords === undefined) ? stateChange(num) : seekPoint(num, coords)
}

// Remove thing from Array
// Example: removeThing(SWARM.things, 0, 1);
const removeThing = (array, toRemove, number) => {
  array.splice(toRemove, number)
}

// Math related functions
const getBoundedRand = (min, max) => {
  return Math.random() * (max - min) + min
}
const getBoundedInt = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
}
const angleToPoint = (self, other) => {
  const sanit = (a, b) => (b - a === 0) ? a : b - a
  const hasOther = (s, o) => Math.atan2(sanit(s.y, o.y), sanit(s.x, o.x))
  // returns radians
  return hasOther(self, other || self)
}
const disToPoint = (self, other) => {
  const a = self.x - other.x
  const b = self.y - other.y
  return Math.sqrt(a * a + b * b) // in pixels
}

// Click Events
var canvas = document.getElementById('ctx')
canvas.addEventListener('mousedown', (event) => {
  const x = event.pageX
  const y = event.pageY
  s(2, { x: x, y: y })
})
canvas.addEventListener('mouseup', (event) => {
  s(1)
})
canvas.addEventListener('dblclick', (event) => {
  s(5)
})

// Max canvas size for square
const getCanvasSize = (ctx, adjustment) => {
  const w = window.innerWidth - adjustment
  const h = window.innerHeight - adjustment
  const square = w > h ? h : w
  // Update the orgin Variable
  ORGIN = { x: square / 2, y: square / 2 }
  return square
}
