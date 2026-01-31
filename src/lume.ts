import 'lume';

// https://docs.lume.io/examples/hello-world/
let lastTime = performance.now()
let dt = 0

moonRotator.rotation = (x, y, z, time) => {
  dt = time - lastTime
  lastTime = time
  return [x, y, z + dt * 0.01]
}

// ^ We could've written it more simply but then rotation would start at an angle
// based on the current time instead of our preferred starting angle:
// moonRotator.rotation = (x, y, z, t) => [x, y, t * 0.004];
earth.rotation = (x, y, z, t) => [x, t * 0.01, z]

clouds.rotation = (x, y, z, t) => [x, -t * 0.003, z]