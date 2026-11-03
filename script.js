// =====================================================================
//  GAMEOLOGYGIRL PORTFOLIO — script.js
//  This file makes things MOVE: the background fade, the ball of light,
//  the sparkles, the menu glide, and the case study pop-up.
//
//  Anything after // on a line is a note for people. The computer skips it.
//
//  Words you will see a lot:
//   const    = a name for something that never changes.
//   let      = a name for something that can change later.
//   function = a set of steps with a name. Calling the name runs the steps.
//   if       = "only do this when something is true."
//   ===      = "is exactly equal to."   !== = "is not equal to."
//   &&       = "and."   ||  = "or."   !  = "not."
// =====================================================================


// ---------------------------------------------------------------------
// 1. EASY SETTINGS
// Change these to adjust the page without touching anything else.
// ---------------------------------------------------------------------

const BACKGROUND_COLORS = [   // The background fades through these colors as you scroll, spread evenly from top to bottom. Add more to make more stops.
  [41, 37, 46],               // Top of the page. Three numbers = red, green, blue, each from 0 to 255.
  [36, 32, 40],               // One third down (around the case studies). Still fairly light.
  [27, 24, 30],               // Two thirds down (around Playground). The darkness speeds up after this.
  [11, 10, 13]                // The very bottom. Matches the dark fade behind the header.
];                            // End of the list.

const SPARKLE_COLORS = [      // Trail sparkle colors for each mood. Two colors each, so the trail mixes them.
  ['#EFFEFF', '#9EF3FF'],     // Mood 0, calm: white and soft cyan.
  ['#FFA53D', '#FFC56A'],     // Mood 1: orange.
  ['#FF4A2A', '#FF8A4A'],     // Mood 2: red.
  ['#FF2E7A', '#FF7A3D']      // Mood 3: hot pink.
];                            // End of the list.

const FIREWORK_COLORS = ['#FFFFFF', '#FFFBF2', '#FFF6E0'];   // The delicate white sparks in the explosion.

const BALL_SPOTS = [          // Where the ball can sit in each section. Each spot is [left %, top %].
  [[88, 78], [8, 24], [92, 30], [10, 82]],   // About: starting spot, then hop 1, hop 2, hop 3.
  [[92, 6], [6, 30], [94, 56], [7, 88]],     // Work: same idea.
  [[90, 24], [8, 70], [92, 82], [10, 16]]    // Contact: same idea.
];                            // End of the list.

const RESPAWN_SPOTS = [[8, 18], [92, 20], [7, 80], [93, 84]];   // Where the ball can re-form after fireworks. It picks the farthest one.

const HOPS_BEFORE_TANTRUM = 3;   // How many touches it allows before it gets mad.
const HOP_TIME = 1800;           // How long one hop takes, in milliseconds (1000 = 1 second).
const FLY_IN_TIME = 3500;        // How long it takes to float into the next section.
const DRIFT_TIME = 4000;         // How long it takes to lazily follow you.
const RISE_TIME = 1500;          // How long it shakes and rises before zooming.
const WINDUP_TIME = 380;         // The quick squash before the zoom.
const ZOOM_TIME = 900;           // How long the zoom away takes.
const FIREWORKS_TIME = 3600;     // How long the fireworks show lasts before it re-forms.
const FOLLOW_WAIT = 1200;        // How long it waits after you stop scrolling before it follows you.


// ---------------------------------------------------------------------
// 2. FINDING THINGS ON THE PAGE
// "document" is the whole page. These lines grab parts of it by name.
// ---------------------------------------------------------------------

const sections = Array.from(document.querySelectorAll('.section'));    // Every element with class="section", as a list.
const menuButtons = Array.from(document.querySelectorAll('[data-go]')); // Every menu button.
const backgroundLayer = document.getElementById('background-color-layer'); // The fading color layer.
const stage = document.getElementById('stage');                        // The main area, where the ball lives.
const ball = document.getElementById('ball');                          // The ball's touch area.
const canvas = document.getElementById('sparkle-canvas');              // The drawing board for sparkles.
const pen = canvas.getContext('2d');                                   // The "pen" we draw on the canvas with.
const lastSection = sections.length - 1;                               // The number of the last section (we count from 0).
const lessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; // True if the visitor asked their device for less motion.


// ---------------------------------------------------------------------
// 3. TINY HELPER TOOLS
// ---------------------------------------------------------------------

function mix(start, end, amount) {        // Finds a number between start and end. amount 0 = start, 1 = end, 0.5 = halfway.
  return start + (end - start) * amount;  // The math for "part of the way there."
}                                         // End of mix.

function randomBetween(low, high) {           // Picks a random number between low and high.
  return low + Math.random() * (high - low);  // Math.random() gives a number from 0 to 1.
}                                             // End of randomBetween.

function ballHas(className) {                 // Checks whether the ball currently has a class, like "is-rising".
  return ball.classList.contains(className);  // Gives back true or false.
}                                             // End of ballHas.

function ballIsGone() {                       // Checks whether the ball is exploded right now.
  return ballHas('is-gone');                  // True while the fireworks are going.
}                                             // End of ballIsGone.


// ---------------------------------------------------------------------
// 4. BACKGROUND FADE AND MENU HIGHLIGHT
// ---------------------------------------------------------------------

function getScrollProgress() {                                   // Works out how far down the page you are, from 0 (top) to 1 (bottom).
  const scrollRoom = document.documentElement.scrollHeight - window.innerHeight;   // How far the page can scroll in total.
  if (scrollRoom <= 0) return 0;                                 // Page too short to scroll? Call it the top.
  return Math.min(1, Math.max(0, window.scrollY / scrollRoom));  // How far we have scrolled, kept between 0 and 1.
}                                                                // End of getScrollProgress.

function getCurrentSection() {                                   // Which section is in the middle of the screen right now?
  const middle = window.innerHeight / 2;                         // The middle of the screen.
  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4; // Did we scroll all the way down?
  if (atBottom) return lastSection;                              // At the very bottom always counts as the last section.
  for (let i = 0; i < sections.length; i++) {                    // Check each section...
    const box = sections[i].getBoundingClientRect();             // ...where it is on screen...
    if (box.top <= middle && box.bottom > middle) return i;      // ...and if it covers the middle, that is the one.
  }                                                              // End of loop.
  return window.scrollY < 10 ? 0 : lastSection;                  // Backup: top of page = 0, otherwise the last one.
}                                                                // End of getCurrentSection.

let highlightedMenuItem = -1;                                    // Which menu item is pink right now. -1 means "none yet."

function updateBackgroundAndMenu() {                             // Runs every time you scroll.
  const lastColor = BACKGROUND_COLORS.length - 1;                // The number of the last color (we count from 0).
  const position = getScrollProgress() * lastColor;              // Where we are in the color list. With 3 colors, 1.4 = "40% of the way from color 1 to color 2."
  const fromIndex = Math.min(Math.floor(position), lastColor - 1); // The color we are leaving (1.4 becomes 1).
  const amount = position - fromIndex;                           // How far toward the next color (1.4 becomes 0.4).
  const fromColor = BACKGROUND_COLORS[fromIndex];                // The color we are leaving.
  const toColor = BACKGROUND_COLORS[fromIndex + 1];              // The color we are heading into.
  const red = Math.round(mix(fromColor[0], toColor[0], amount));   // Blend the red.
  const green = Math.round(mix(fromColor[1], toColor[1], amount)); // Blend the green.
  const blue = Math.round(mix(fromColor[2], toColor[2], amount));  // Blend the blue.
  backgroundLayer.style.backgroundColor = 'rgb(' + red + ', ' + green + ', ' + blue + ')'; // Paint the background with the blended color.

  const current = getCurrentSection();                           // Which section are we in?
  if (current !== highlightedMenuItem) {                         // Only update the menu if it changed.
    highlightedMenuItem = current;                               // Remember the new one.
    menuButtons.forEach(function (button, number) {              // For each menu button...
      button.setAttribute('aria-current', number === current ? 'true' : 'false'); // ...mark it current or not. style.css turns the current one pink.
    });                                                          // End of forEach.
  }                                                              // End of if.
}                                                                // End of updateBackgroundAndMenu.


// ---------------------------------------------------------------------
// 5. SPARKLES (drawn on the canvas)
// A "particle" is one tiny sparkle. We keep a list of them and move
// each one a tiny bit, many times per second.
// ---------------------------------------------------------------------

let particles = [];             // The list of every sparkle currently on screen.
let screenWidth = 0;            // Canvas width in pixels.
let screenHeight = 0;           // Canvas height in pixels.
let lastBallCenter = null;      // Where the ball was last frame, so we can tell if it moved.
let frameCount = 0;             // Counts frames. We use it to do some things only every few frames.

function resizeCanvas() {                                      // Makes the canvas match the screen size.
  const sharpness = Math.min(2, window.devicePixelRatio || 1); // Sharper drawing on high-quality screens (up to 2 times).
  screenWidth = canvas.clientWidth;                            // How wide the canvas looks on screen.
  screenHeight = canvas.clientHeight;                          // How tall it looks.
  canvas.width = Math.round(screenWidth * sharpness);          // How many real pixels wide to draw.
  canvas.height = Math.round(screenHeight * sharpness);        // How many real pixels tall.
  pen.setTransform(sharpness, 0, 0, sharpness, 0, 0);          // Scales the pen so our numbers still mean screen pixels.
}                                                              // End of resizeCanvas.

function getBallCenter() {                                     // Finds the middle of the ball, measured on the whole page.
  const box = ball.getBoundingClientRect();                    // Where the ball is on screen.
  return {                                                     // Give back an x and y...
    x: box.left + box.width / 2 + window.scrollX,              // ...left to right...
    y: box.top + box.height / 2 + window.scrollY               // ...and top to bottom.
  };                                                           // End of the answer.
}                                                              // End of getBallCenter.

function addParticle(settings) {                               // Adds one sparkle to the list.
  particles.push(Object.assign({                               // Start with these default settings...
    speedX: 0, speedY: 0,                                      // ...not moving...
    age: 0, lifespan: 30,                                      // ...brand new, lives 30 frames...
    size: 1, color: '#FFFFFF',                                 // ...small and white...
    drag: 1, gravity: 0,                                       // ...no slowing down, no falling...
    look: 'dot'                                                // ...drawn as a dot.
  }, settings));                                               // ...then use whatever settings were passed in instead.
}                                                              // End of addParticle.

function makeSparkles() {                                      // Adds new sparkles around the ball each frame.
  if (ballIsGone() || lessMotion) {                            // No ball, or the visitor wants less motion?
    lastBallCenter = null;                                     // Forget the old spot...
    return;                                                    // ...and stop here.
  }                                                            // End of if.
  const center = getBallCenter();                              // Where the ball is now.
  const moved = lastBallCenter && Math.hypot(center.x - lastBallCenter.x, center.y - lastBallCenter.y) > 1.2; // Did it move more than a tiny bit?
  const colors = SPARKLE_COLORS[ballState.colorLevel];         // The sparkle colors for its current mood.
  const rising = ballHas('is-rising');                         // Is it shaking and rising?
  const zooming = ballHas('is-zooming');                       // Is it zooming away?

  if (moved || frameCount % 9 === 0 || (rising && frameCount % 2 === 0)) { // Add trail sparkles when moving, or now and then. % means "remainder," so % 9 === 0 is "every 9th frame."
    let howMany = 1;                                           // Usually one sparkle...
    if (moved) howMany = 4;                                    // ...four while moving (raise this number for even more)...
    if (rising) howMany = 1;                                   // ...one while rising...
    if (zooming) howMany = 5;                                  // ...and five while zooming for a streak.
    for (let i = 0; i < howMany; i++) {                        // Make that many sparkles.
      addParticle({                                            // A small fading trail dot:
        x: center.x + randomBetween(-3, 3),                    // near the ball, left and right,
        y: center.y + randomBetween(-3, 3),                    // near the ball, up and down,
        speedX: randomBetween(-0.3, 0.3),                      // drifting a little sideways,
        speedY: randomBetween(-0.3, 0.3) - 0.15,               // drifting a little up,
        lifespan: randomBetween(10, 20),                       // living a short time,
        size: randomBetween(0.5, 1.5),                         // tiny,
        color: colors[i % 2],                                  // alternating the two mood colors,
        drag: 0.94,                                            // slowing down,
        look: 'trail'                                          // and drawn faint.
      });                                                      // End of this sparkle.
    }                                                          // End of loop.
  }                                                            // End of trail sparkles.

  if (moved && !zooming && frameCount % 3 === 0) {             // While it moves, every 3rd frame, toss off one extra twinkle.
    const angle = Math.random() * Math.PI * 2;                 // A random direction all the way around.
    const distance = randomBetween(4, 12);                     // How far from the center it starts.
    addParticle({                                              // A traveling twinkle:
      x: center.x + Math.cos(angle) * distance,                // placed in that direction (cos = left/right part),
      y: center.y + Math.sin(angle) * distance,                // (sin = up/down part),
      speedX: Math.cos(angle) * 0.25,                          // drifting gently outward,
      speedY: Math.sin(angle) * 0.25 - 0.1,                    // and a little upward,
      lifespan: randomBetween(16, 28),                         // fading out in under half a second,
      size: randomBetween(0.5, 1.2),                           // tiny,
      color: Math.random() < 0.5 ? '#FFFFFF' : colors[1],      // half white, half mood color,
      drag: 0.95,                                              // slowing down,
      look: 'twinkle'                                          // and blinking in and out.
    });                                                        // End of the traveling twinkle.
  }                                                            // End of the moving twinkles.

  if (frameCount % 8 === 0) {                                  // Every 8th frame, add one twinkle in the halo around the ball.
    const angle = Math.random() * Math.PI * 2;                 // A random direction all the way around.
    const distance = randomBetween(7, 17);                     // How far from the center.
    addParticle({                                              // A twinkle:
      x: center.x + Math.cos(angle) * distance,                // placed in that direction (cos = left/right part),
      y: center.y + Math.sin(angle) * distance,                // (sin = up/down part),
      speedX: Math.cos(angle) * 0.12 + randomBetween(-0.1, 0.1), // drifting gently outward,
      speedY: Math.sin(angle) * 0.12 - 0.08,                   // and a little upward,
      lifespan: randomBetween(14, 30),                         // living a bit longer,
      size: randomBetween(0.45, 1.15),                         // tiny,
      color: Math.random() < 0.5 ? '#FFFFFF' : colors[0],      // half white, half mood color,
      drag: 0.97,                                              // slowing down a little,
      look: 'twinkle'                                          // and blinking in and out.
    });                                                        // End of the twinkle.
  }                                                            // End of halo.

  lastBallCenter = center;                                     // Remember this spot for next frame.
}                                                              // End of makeSparkles.

function drawParticles() {                                     // Moves and draws every sparkle.
  pen.clearRect(0, 0, screenWidth, screenHeight);              // Erase the whole canvas first.
  pen.globalCompositeOperation = 'lighter';                    // Overlapping sparkles add their light together, so they glow.

  for (let i = particles.length - 1; i >= 0; i--) {            // Go through the list backwards (safe for removing items).
    const p = particles[i];                                    // "p" is the sparkle we are working on.
    p.previousX = p.x;                                         // Remember where it was (used to draw spark streaks).
    p.previousY = p.y;                                         // Same for up and down.
    p.speedX = p.speedX * p.drag;                              // Slow it down a little.
    p.speedY = p.speedY * p.drag + p.gravity;                  // Slow it down and let gravity pull it.
    p.x = p.x + p.speedX;                                      // Move it left or right.
    p.y = p.y + p.speedY;                                      // Move it up or down.
    p.age = p.age + 1;                                         // It is one frame older.

    const lifeLeft = 1 - p.age / p.lifespan;                   // 1 = brand new, 0 = used up.
    if (lifeLeft <= 0) {                                       // Used up?
      particles.splice(i, 1);                                  // Remove it from the list.
      continue;                                                // Skip to the next sparkle.
    }                                                          // End of if.

    if (p.crackles && !p.hasCrackled && p.age > p.lifespan * 0.55) { // Some firework sparks pop once, halfway through their life.
      p.hasCrackled = true;                                    // Only pop once.
      for (let k = 0; k < 7; k++) {                            // Make 7 tiny pieces.
        const angle = Math.random() * Math.PI * 2;             // Random direction.
        const speed = randomBetween(1, 3.5);                   // Random speed.
        addParticle({                                          // A tiny popping spark:
          x: p.x, y: p.y,                                      // starting where the parent spark is,
          speedX: Math.cos(angle) * speed,                     // flying out sideways,
          speedY: Math.sin(angle) * speed,                     // and up or down,
          lifespan: randomBetween(14, 26),                     // short life,
          size: 0.5, color: '#FFFFFF',                         // tiny and white,
          drag: 0.9, gravity: 0.03,                            // slowing fast and falling a bit,
          look: 'spark'                                        // drawn as a streak.
        });                                                    // End of the pop piece.
      }                                                        // End of loop.
    }                                                          // End of crackle.

    const drawX = p.x - window.scrollX;                        // Sparkles live on the whole page, but we draw on the screen, so subtract the scroll.
    const drawY = p.y - window.scrollY;                        // Same for up and down.

    if (p.look === 'twinkle') pen.globalAlpha = Math.sin((p.age / p.lifespan) * Math.PI) * 0.75; // Twinkles fade in, then out.
    else if (p.look === 'trail') pen.globalAlpha = lifeLeft * 0.4;  // Trail dots are faint and fade out.
    else pen.globalAlpha = lifeLeft;                           // Everything else just fades out. globalAlpha = see-through amount.

    if (p.look === 'flash') {                                  // The bright flash at the center of the fireworks:
      const radius = p.size * (1 + p.age / 6);                 // It grows as it gets older.
      const glow = pen.createRadialGradient(drawX, drawY, 0, drawX, drawY, radius); // A circle that fades from the center.
      glow.addColorStop(0, 'rgba(255, 250, 230, 0.9)');        // Bright warm white in the middle...
      glow.addColorStop(1, 'rgba(255, 200, 120, 0)');          // ...fading to clear at the edge.
      pen.fillStyle = glow;                                    // Use that fade as the paint.
      pen.beginPath();                                         // Start a new shape.
      pen.arc(drawX, drawY, radius, 0, Math.PI * 2);           // A full circle.
      pen.fill();                                              // Paint it.
    } else if (p.look === 'spark') {                           // Firework sparks are little streaks:
      pen.strokeStyle = p.color;                               // Line color.
      pen.lineWidth = p.size;                                  // Line thickness.
      pen.lineCap = 'round';                                   // Rounded line ends.
      pen.beginPath();                                         // Start a new line.
      pen.moveTo(p.previousX - window.scrollX - p.speedX * 2, p.previousY - window.scrollY - p.speedY * 2); // From a bit behind it...
      pen.lineTo(drawX, drawY);                                // ...to where it is now.
      pen.stroke();                                            // Draw the line.
    } else {                                                   // Everything else is a round dot:
      pen.fillStyle = p.color;                                 // Dot color.
      pen.beginPath();                                         // Start a new shape.
      pen.arc(drawX, drawY, p.size * lifeLeft + 0.3, 0, Math.PI * 2); // A circle that shrinks as it ages.
      pen.fill();                                              // Paint it.
    }                                                          // End of drawing choices.
  }                                                            // End of the loop through sparkles.

  pen.globalAlpha = 1;                                         // Reset see-through back to normal.
}                                                              // End of drawParticles.

function makeFireworks(center) {                               // The explosion at the end.
  addParticle({ x: center.x, y: center.y, lifespan: 18, size: 20, look: 'flash' }); // One bright flash in the middle.
  const howMany = lessMotion ? 50 : 170;                       // 170 sparks (or 50 for less motion).
  for (let i = 0; i < howMany; i++) {                          // Make each spark.
    const angle = Math.random() * Math.PI * 2;                 // Random direction.
    const speed = 1 + Math.pow(Math.random(), 0.6) * 3.6;      // Random speed. Raising to 0.6 makes more sparks go farther.
    addParticle({                                              // A firework spark:
      x: center.x, y: center.y,                                // starting at the ball,
      speedX: Math.cos(angle) * speed,                         // flying out sideways,
      speedY: Math.sin(angle) * speed,                         // and up or down,
      lifespan: randomBetween(64, 109),                        // lasting about 1 to 2 seconds,
      size: randomBetween(0.5, 1.2),                           // thin,
      color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)], // a random white,
      drag: 0.955, gravity: 0.025,                             // slowing and gently falling,
      crackles: Math.random() < 0.22,                          // about 1 in 5 will pop,
      look: 'spark'                                            // drawn as streaks.
    });                                                        // End of this spark.
  }                                                            // End of loop.
}                                                              // End of makeFireworks.

function makeGatherEffect(center) {                            // Sparkles pulling in when the ball re-forms.
  for (let i = 0; i < 70; i++) {                               // 70 sparkles.
    const angle = Math.random() * Math.PI * 2;                 // Random direction.
    const distance = randomBetween(28, 68);                    // Start this far from the center.
    const lifespan = 40;                                       // They all take 40 frames to arrive.
    addParticle({                                              // A gathering sparkle:
      x: center.x + Math.cos(angle) * distance,                // starting out in a circle,
      y: center.y + Math.sin(angle) * distance,                // (the same idea, for up and down),
      speedX: -Math.cos(angle) * distance / lifespan,          // moving inward at just the right speed
      speedY: -Math.sin(angle) * distance / lifespan,          // to reach the center as it fades,
      lifespan: lifespan,                                      // all fading together,
      size: 1.4, color: '#EFFEFF',                             // soft white,
      look: 'dot'                                              // drawn as dots.
    });                                                        // End of this sparkle.
  }                                                            // End of loop.
}                                                              // End of makeGatherEffect.


// ---------------------------------------------------------------------
// 6. HOW THE BALL MOVES
// The ball travels on gentle curves instead of straight lines,
// and always floats a little, even when sitting still.
// ---------------------------------------------------------------------

const ballState = {             // Everything we need to remember about the ball.
  section: 0,                   // Which section it is in.
  spot: BALL_SPOTS[0][0],       // Which spot it is at (or heading to).
  touches: 0,                   // How many times it has been touched in this section.
  mood: 0,                      // How many times it has been chased away (0 = calm).
  colorLevel: 0,                // Which mood color it is showing right now (0 to 3).
  busy: false,                  // True while it is in the middle of something and should ignore touches.
  waitUntil: 0                  // A short cooldown after each hop, so one touch does not count twice.
};                              // End of ballState.

let ballPosition = { x: 0, y: 0 };   // Where the ball is right now (before the floating wiggle).
let currentTrip = null;              // The trip it is on right now. null means "not moving."
let floatAmount = 1;                 // How strongly it floats in place. 1 = full float, 0 = none.

function easeInOut(t) {                                    // Starts slow, speeds up, ends slow. t goes from 0 to 1.
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // A standard smooth curve.
}                                                          // End of easeInOut.

function easeOut(t) {                                      // Starts fast, ends slow, like a gentle landing.
  return 1 - Math.pow(1 - t, 3);                           // Standard curve.
}                                                          // End of easeOut.

function easeIn(t) {                                       // Starts slow, ends fast, like taking off.
  return t * t * t;                                        // Standard curve.
}                                                          // End of easeIn.

function curvePoint(a, b, c, d, t) {                       // Finds a point along a smooth curve from a to d, bending toward b and c.
  const u = 1 - t;                                         // The "leftover" part of t.
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;   // The curve formula (called a Bezier curve).
}                                                          // End of curvePoint.

function spotToPixels(sectionNumber, spot) {               // Turns a spot like [88, 78] into real pixel positions.
  const width = stage.clientWidth;                         // How wide the page is.
  const section = sections[sectionNumber];                 // The section we mean.
  return {                                                 // Give back x and y:
    x: Math.max(40, Math.min(width - 40, width * spot[0] / 100)),          // left %, kept at least 40px from each edge,
    y: section.offsetTop + section.offsetHeight * spot[1] / 100            // top %, measured inside that section.
  };                                                       // End of the answer.
}                                                          // End of spotToPixels.

function startTrip(target, duration, options, whenDone) {  // Starts the ball moving toward target on a curvy path.
  options = options || {};                                 // If no options were given, use an empty set.
  const from = { x: ballPosition.x, y: ballPosition.y };   // Where it is starting.
  const dx = target.x - from.x;                            // How far to go left or right.
  const dy = target.y - from.y;                            // How far to go up or down.
  const distance = Math.hypot(dx, dy) || 1;                // The straight-line distance (never 0).
  const sideX = -dy / distance;                            // A direction pointing sideways from the path...
  const sideY = dx / distance;                             // ...used to bend the curve.
  const whichSide = Math.random() < 0.5 ? -1 : 1;          // Bend left or right, chosen at random.
  let bendAmount = options.bend !== undefined ? options.bend : randomBetween(0.22, 0.44);   // How much to bend.
  let bend = bendAmount * distance * whichSide;            // The bend in pixels.
  if (lessMotion) {                                        // For less motion:
    duration = Math.min(duration, 250);                    // move quickly,
    bend = 0;                                              // and straight.
  }                                                        // End of if.
  currentTrip = {                                          // Save everything about this trip:
    from: from,                                            // start point,
    to: target,                                            // end point,
    sideX: sideX, sideY: sideY,                            // sideways direction,
    bendPoint1: { x: from.x + dx * 0.25 + sideX * bend, y: from.y + dy * 0.25 + sideY * bend },       // first bend point,
    bendPoint2: { x: from.x + dx * 0.75 + sideX * bend * 0.5, y: from.y + dy * 0.75 + sideY * bend * 0.5 }, // second bend point,
    duration: duration,                                    // how long it takes,
    startTime: performance.now(),                          // when it started (performance.now() is a precise clock),
    easing: options.easing || easeInOut,                   // which speed curve to use,
    wobble: lessMotion ? 0 : (options.wobble !== undefined ? options.wobble : Math.min(16, distance * 0.05)), // how much it sways,
    wobbleSpeed: options.wobbleSpeed || 2,                 // how many sways,
    whenDone: whenDone                                     // what to do when it arrives.
  };                                                       // End of the trip.
}                                                          // End of startTrip.

function moveBall(now) {                                   // Runs every frame to move the ball.
  if (currentTrip) {                                       // If it is on a trip...
    const trip = currentTrip;                              // A shorter name, so the lines below are easier to read.
    const t = Math.max(0, Math.min(1, (now - trip.startTime) / trip.duration)); // How far through the trip, from 0 to 1.
    const eased = trip.easing(t);                          // Apply the speed curve.
    const sway = Math.sin(t * Math.PI * trip.wobbleSpeed * 2) * Math.sin(t * Math.PI) * trip.wobble; // A gentle side-to-side sway that is zero at the start and end.
    ballPosition.x = curvePoint(trip.from.x, trip.bendPoint1.x, trip.bendPoint2.x, trip.to.x, eased) + trip.sideX * sway; // New left-right position.
    ballPosition.y = curvePoint(trip.from.y, trip.bendPoint1.y, trip.bendPoint2.y, trip.to.y, eased) + trip.sideY * sway; // New up-down position.
    if (t >= 1) {                                          // Arrived?
      ballPosition.x = trip.to.x;                          // Snap exactly to the end (left-right)...
      ballPosition.y = trip.to.y;                          // ...and (up-down)...
      currentTrip = null;                                  // ...end the trip...
      if (trip.whenDone) trip.whenDone();                  // ...and do the next step, if there is one.
    }                                                      // End of if.
  }                                                        // End of trip.

  const shouldFloat = !(ballHas('is-zooming') || ballHas('is-winding-up') || ballIsGone() || ballHas('is-forming') || lessMotion); // Float unless doing something dramatic.
  floatAmount = floatAmount + ((shouldFloat ? 1 : 0) - floatAmount) * 0.08;   // Ease the float on or off slowly.
  const floatX = (Math.sin(now / 2100) * 11 + Math.sin(now / 1200 + 1.3) * 3.5) * floatAmount;   // Lazy left-right drift (two waves mixed).
  const floatY = (Math.cos(now / 2500) * 11 + Math.sin(now / 1400) * 3) * floatAmount;          // Lazy up-down drift.
  ball.style.left = (ballPosition.x + floatX) + 'px';      // Put the ball there (left side).
  ball.style.top = (ballPosition.y + floatY) + 'px';       // Put the ball there (top side).
}                                                          // End of moveBall.

function placeBall(sectionNumber, spot, style, whenDone) { // Sends the ball to a spot in a section.
  ballState.section = sectionNumber;                       // Remember the section.
  ballState.spot = spot;                                   // Remember the spot.
  const target = spotToPixels(sectionNumber, spot);        // Turn the spot into pixels.
  if (style === 'instant') {                               // "instant" = jump there with no animation.
    currentTrip = null;                                    // Cancel any trip.
    ballPosition.x = target.x;                             // Jump left-right.
    ballPosition.y = target.y;                             // Jump up-down.
    if (whenDone) whenDone();                              // Do the next step, if any.
    return;                                                // Done.
  }                                                        // End of if.
  if (style === 'hop') startTrip(target, HOP_TIME, {}, whenDone);                                        // A bouncy hop.
  if (style === 'fly') startTrip(target, FLY_IN_TIME, { easing: easeOut }, whenDone);                    // A gentle landing into a new section.
  if (style === 'drift') startTrip(target, DRIFT_TIME, { wobble: 22, wobbleSpeed: 1.5 }, whenDone);      // A slow, swaying drift.
}                                                          // End of placeBall.

function setColorLevel(level) {                            // Changes the ball's mood color (0 to 3).
  ballState.colorLevel = Math.min(3, level);               // Remember it (never above 3).
  ball.classList.remove('mood-1', 'mood-2', 'mood-3');     // Remove any old mood color.
  if (ballState.colorLevel > 0) ball.classList.add('mood-' + ballState.colorLevel); // Add the new one. style.css has the colors.
}                                                          // End of setColorLevel.


// ---------------------------------------------------------------------
// 7. HOW THE BALL BEHAVES
// Touch it 3 times: it hops. 4th time: tantrum, then it zooms to the
// next section. In the last section it explodes into fireworks instead.
// ---------------------------------------------------------------------

function touchBall() {                                     // Runs when someone touches the ball.
  const now = Date.now();                                  // The current time.
  if (ballState.busy || now < ballState.waitUntil || ballIsGone()) return;   // Ignore touches while busy, cooling down, or exploded.
  ballState.touches = ballState.touches + 1;               // Count this touch.
  if (ballState.touches <= HOPS_BEFORE_TANTRUM) {          // Still in the hopping touches?
    placeBall(ballState.section, BALL_SPOTS[ballState.section][ballState.touches], 'hop'); // Hop to the next spot.
    ballState.waitUntil = now + 1500;                      // Cool down for 1.5 seconds.
    return;                                                // Done for now.
  }                                                        // End of if.
  throwTantrum();                                          // Too many touches! Get mad.
}                                                          // End of touchBall.

function throwTantrum() {                                  // Changes color, shakes, and rises.
  ballState.busy = true;                                   // Ignore touches during the tantrum.
  currentTrip = null;                                      // Stop any movement.
  const inLastSection = ballState.section >= lastSection;  // Is this the last section?
  const newLevel = inLastSection ? 3 : ballState.mood + 1; // Last section always goes hot pink. Otherwise one step angrier.
  setColorLevel(newLevel);                                 // Change color.
  ball.classList.add('is-rising');                         // Start the fast shake (see style.css).
  const target = { x: ballPosition.x, y: ballPosition.y - 60 };   // Rise 60 pixels.
  startTrip(target, lessMotion ? 300 : RISE_TIME, { easing: easeOut, bend: 0, wobble: 0 }, function () { // Rise slowly, straight up. When done:
    ball.classList.remove('is-rising');                    // Stop shaking.
    if (inLastSection) {                                   // In the last section...
      explode();                                           // ...explode!
      return;                                              // Done.
    }                                                      // End of if.
    ballState.mood = newLevel;                             // Remember it is angrier now.
    zoomAway();                                            // Zoom to the next section.
  });                                                      // End of the rise.
}                                                          // End of throwTantrum.

function zoomAway() {                                      // The dramatic exit.
  const nextSection = ballState.section + 1;               // Where it is going.
  const width = stage.clientWidth;                         // Page width.
  const goRight = ballPosition.x < width / 2;              // On the left half? Zoom right. On the right half? Zoom left.
  ball.classList.add('is-winding-up');                     // Squash for the wind-up.
  const windupTarget = { x: ballPosition.x + (goRight ? -18 : 18), y: ballPosition.y + 10 };   // Pull back a little, like a slingshot.
  startTrip(windupTarget, lessMotion ? 60 : WINDUP_TIME, { easing: easeOut, bend: 0, wobble: 0 }, function () { // Wind up. When done:
    ball.classList.remove('is-winding-up');                // Stop squashing...
    ball.classList.add('is-zooming');                      // ...and stretch for the zoom.
    const exitTarget = { x: goRight ? width + 140 : -140, y: ballPosition.y - 40 };   // Off the edge of the screen.
    startTrip(exitTarget, lessMotion ? 120 : ZOOM_TIME, { easing: easeIn, bend: 0.08, wobble: 0 }, function () { // Zoom! When done:
      ball.classList.remove('is-zooming');                 // Back to normal shape.
      const entry = spotToPixels(nextSection, BALL_SPOTS[nextSection][0]);   // The starting spot of the next section.
      ballPosition.x = goRight ? -90 : width + 90;         // Appear just off the opposite edge...
      ballPosition.y = entry.y - 60;                       // ...a little above the spot.
      placeBall(nextSection, BALL_SPOTS[nextSection][0], 'fly', function () { // Float in. When done:
        ballState.touches = 0;                             // Reset the touch count for the new section.
        ballState.busy = false;                            // Ready for touches again.
      });                                                  // End of fly in.
    });                                                    // End of zoom.
  });                                                      // End of wind-up.
}                                                          // End of zoomAway.

function explode() {                                       // The fireworks finale.
  currentTrip = null;                                      // Stop moving.
  ball.classList.add('is-gone');                           // Hide the ball (see style.css).
  makeFireworks(getBallCenter());                          // Sparkler burst where it was.
  setTimeout(reform, FIREWORKS_TIME);                      // After the show, re-form. setTimeout means "do this later."
}                                                          // End of explode.

function reform() {                                        // Brings the ball back after the fireworks.
  let bestSpot = RESPAWN_SPOTS[0];                         // Start by guessing the first respawn spot.
  let bestDistance = -1;                                   // We want the farthest one.
  RESPAWN_SPOTS.forEach(function (spot) {                  // Check every respawn spot.
    const place = spotToPixels(ballState.section, spot);   // Where that spot is in pixels.
    const distance = Math.hypot(place.x - ballPosition.x, place.y - ballPosition.y);   // How far from where it exploded.
    if (distance > bestDistance) {                         // Farther than the best so far?
      bestDistance = distance;                             // Remember the distance...
      bestSpot = spot;                                     // ...and the spot.
    }                                                      // End of if.
  });                                                      // End of checking.
  placeBall(ballState.section, bestSpot, 'instant');       // Move the (invisible) ball there.
  requestAnimationFrame(function () {                      // Wait one frame for the move to show...
    requestAnimationFrame(function () {                    // ...and one more to be safe...
      makeGatherEffect(getBallCenter());                   // ...then pull sparkles in to that spot.
    });                                                    // End of the second wait.
  });                                                      // End of the first wait.
  setTimeout(function () {                                 // 0.65 seconds later (the number is at the bottom of this block):
    ballState.mood = 0;                                    // Calm again.
    ballState.touches = 0;                                 // Touch count reset.
    setColorLevel(0);                                      // Back to calm white and cyan.
    ball.classList.remove('is-gone');                      // Show the ball again...
    ball.classList.add('is-forming');                      // ...growing back in.
    setTimeout(function () {                               // 1.1 seconds later, when it has grown back:
      ball.classList.remove('is-forming');                 // Done forming.
      ballState.busy = false;                              // Ready for touches.
      setTimeout(checkIfBallShouldFollow, 1500);           // After 1.5 seconds, go find the visitor if they scrolled away.
    }, 1100);                                              // 1100 milliseconds = 1.1 seconds.
  }, 650);                                                 // 650 milliseconds = 0.65 seconds.
}                                                          // End of reform.

function driftTo(sectionNumber, evenIfSameSection) {       // Lazily floats the ball to wherever the visitor is.
  if ((sectionNumber === ballState.section && !evenIfSameSection) || ballState.busy || ballIsGone()) return;   // Skip if not needed or not ready.
  ballState.busy = true;                                   // Busy while drifting.
  ballState.touches = 0;                                   // Fresh touch count.
  const middleOfView = window.innerHeight / 2 - stage.getBoundingClientRect().top;   // The middle of the screen, measured on the page.
  let closestSpot = BALL_SPOTS[sectionNumber][0];          // Guess the first spot...
  let closestDistance = Infinity;                          // ...and look for the closest one to the middle of the screen.
  BALL_SPOTS[sectionNumber].forEach(function (spot) {      // Check every spot in that section.
    const spotY = spotToPixels(sectionNumber, spot).y;     // How far down the page it is.
    const distance = Math.abs(spotY - middleOfView);       // How far from the middle of the screen.
    if (distance < closestDistance) {                      // Closer than the best so far?
      closestDistance = distance;                          // Remember the distance...
      closestSpot = spot;                                  // ...and the spot.
    }                                                      // End of if.
  });                                                      // End of checking.
  placeBall(sectionNumber, closestSpot, 'drift', function () { // Drift there. When done:
    ballState.busy = false;                                // Ready again.
    setTimeout(checkIfBallShouldFollow, 1200);             // Check again in case the visitor moved on.
  });                                                      // End of the drift.
}                                                          // End of driftTo.

function checkIfBallShouldFollow() {                       // Decides if the ball should follow the visitor.
  if (isGliding || ballState.busy || ballIsGone()) return; // Not now if the page is gliding or the ball is busy.
  const current = getCurrentSection();                     // Where the visitor is.
  if (current !== ballState.section) {                     // In a different section?
    driftTo(current);                                      // Follow them.
    return;                                                // Stop here.
  }                                                        // End of if.
  const box = ball.getBoundingClientRect();                // Where the ball is on screen.
  if (box.bottom < 0 || box.top > window.innerHeight) driftTo(current, true);   // Off screen in a tall section? Come into view.
}                                                          // End of checkIfBallShouldFollow.

ball.addEventListener('pointerenter', function (event) {   // When a pointer moves over the ball...
  if (event.pointerType === 'mouse') touchBall();          // ...and it is a mouse, count it as a touch.
});                                                        // End of the mouse listener.
ball.addEventListener('pointerdown', function (event) {    // When a finger or pen presses the ball...
  if (event.pointerType !== 'mouse') {                     // ...(not a mouse click)...
    event.preventDefault();                                // ...stop the phone from doing anything else...
    touchBall();                                           // ...and count it as a touch.
  }                                                        // End of if.
});                                                        // End of the finger listener.
ball.addEventListener('keydown', function (event) {        // Keyboard users can press Enter or Space on the ball.
  if (event.key === 'Enter' || event.key === ' ') {        // If the key was Enter or Space...
    event.preventDefault();                                // ...stop the page from scrolling on Space...
    touchBall();                                           // ...and count it as a touch.
  }                                                        // End of if.
});                                                        // End of the keyboard listener.


// ---------------------------------------------------------------------
// 8. MENU GLIDE, LOGO, AND COPY EMAIL
// Clicking a menu item or the logo smoothly scrolls the page. The Copy
// button copies your email.
// ---------------------------------------------------------------------

let isGliding = false;                                     // True while the page is gliding.

function glideToSection(sectionNumber) {                   // Smoothly scrolls to a section.
  const title = sections[sectionNumber].querySelector('.section-title');   // The section's pink title (ABOUT, WORK, CONTACT).
  const headerHeight = document.querySelector('header').offsetHeight;      // How tall the header (and its dark fade) is.
  const maxY = document.documentElement.scrollHeight - window.innerHeight; // The farthest the page can scroll.
  const wantedY = title.getBoundingClientRect().top + window.scrollY - headerHeight - 16;   // Stop so the title sits 16 pixels below the header, not under it.
  const targetY = sectionNumber === 0 ? 0 : Math.max(0, Math.min(maxY, wantedY));   // About always goes to the very top. Others never scroll past the top or bottom.
  const startY = window.scrollY;                           // Where we are now.
  const distance = targetY - startY;                       // How far to go.
  const duration = lessMotion ? 0 : Math.min(1500, 550 + Math.abs(distance) * 0.3);   // Longer trips take longer, up to 1.5 seconds.
  const startTime = performance.now();                     // When the glide started.
  isGliding = true;                                        // Mark that we are gliding.

  function step(now) {                                     // One small step of the glide.
    const t = duration ? Math.min(1, (now - startTime) / duration) : 1;   // How far through, 0 to 1.
    window.scrollTo(0, startY + distance * easeInOut(t));  // Scroll that far, eased.
    if (t < 1) {                                           // Not there yet?
      requestAnimationFrame(step);                         // Do another step next frame.
    } else {                                               // Arrived:
      isGliding = false;                                   // Done gliding.
      setTimeout(function () { driftTo(sectionNumber); }, lessMotion ? 0 : 450);   // The ball drifts over after a short pause.
    }                                                      // End of if.
  }                                                        // End of step.

  requestAnimationFrame(step);                             // Start the first step.
}                                                          // End of glideToSection.

menuButtons.forEach(function (button) {                    // For every menu button...
  button.addEventListener('click', function () {           // ...when clicked...
    glideToSection(Number(button.dataset.go));             // ...glide to its section. dataset.go reads data-go from the HTML.
  });                                                      // End of the click listener.
});                                                        // End of forEach.


document.querySelectorAll('.say-hello').forEach(function (link) {   // Every "Say hello" link...
  link.addEventListener('click', function (event) {        // ...when clicked...
    event.preventDefault();                                // ...skips the normal jump...
    glideToSection(2);                                     // ...and glides to Contact (section number 2) instead.
  });                                                      // End of the click listener.
});                                                        // End of forEach.

document.getElementById('logo').addEventListener('click', function (event) {   // Clicking the logo...
  event.preventDefault();                                  // ...skips the normal jump...
  glideToSection(0);                                       // ...and glides back to the top instead.
});                                                        // End of the logo listener.

const copyButton = document.getElementById('copy-email');  // The Copy button next to your email.
copyButton.addEventListener('click', function () {         // When clicked:
  const text = copyButton.dataset.copy;                    // The email to copy (from data-copy in index.html).
  function showCopied() {                                  // Briefly says "Copied" so people know it worked.
    copyButton.textContent = 'Copied';                     // Change the label...
    setTimeout(function () { copyButton.textContent = 'Copy'; }, 2000);   // ...and change it back after 2 seconds.
  }                                                        // End of showCopied.
  function selectInstead() {                               // Backup plan if copying is not allowed:
    const range = document.createRange();                  // Make an empty "selection area"...
    range.selectNodeContents(document.querySelector('.email'));   // ...stretch it over the email...
    const selection = window.getSelection();               // ...grab the page's current selection...
    selection.removeAllRanges();                           // ...clear whatever was selected before...
    selection.addRange(range);                             // ...and select the email, so the visitor can press copy themselves.
  }                                                        // End of selectInstead.
  if (navigator.clipboard && navigator.clipboard.writeText) {   // Can this browser copy?
    navigator.clipboard.writeText(text).then(showCopied, selectInstead);   // Try it. If it works, say Copied. If not, select the email.
  } else {                                                 // Older browser?
    selectInstead();                                       // Select the email instead.
  }                                                        // End of if.
});                                                        // End of the Copy listener.


// ---------------------------------------------------------------------
// 9. SCROLLING, RESIZING, AND A SAFETY NET
// ---------------------------------------------------------------------

let followTimer = null;                                    // A timer for the lazy follow.

window.addEventListener('scroll', function () {            // Every time the page scrolls:
  updateBackgroundAndMenu();                               // Update the background color and menu.
  clearTimeout(followTimer);                               // Cancel the last follow timer...
  followTimer = setTimeout(function () {                   // ...and start a new one, so the ball only follows after you stop.
    if (!isGliding) checkIfBallShouldFollow();             // Follow, unless the page is mid-glide.
  }, FOLLOW_WAIT);                                         // Wait FOLLOW_WAIT milliseconds (see Easy Settings).
}, { passive: true });                                     // "passive" tells the browser we will not block scrolling, so it stays smooth.

window.addEventListener('resize', function () {            // When the window changes size:
  resizeCanvas();                                          // Resize the sparkle canvas.
  const calmTrip = currentTrip && !ballHas('is-rising') && !ballHas('is-zooming') && !ballHas('is-winding-up');   // Is it on a normal trip?
  if (calmTrip) {                                          // If it is on a normal trip...
    currentTrip.to = spotToPixels(ballState.section, ballState.spot);   // ...re-aim the trip at the spot's new position.
  } else if (!currentTrip && !ballState.busy) {            // Otherwise, if it is sitting still...
    placeBall(ballState.section, ballState.spot, 'instant');           // ...just snap to the spot's new position.
  }                                                        // End of if.
  highlightedMenuItem = -1;                                // Force the menu to re-check.
  updateBackgroundAndMenu();                               // Refresh colors.
  peekCarousels.forEach(updatePeekArrows);                 // Re-check the card-row arrows (see section 10).
});                                                        // End of the resize listener.

let stuckSince = 0;                                        // When the ball first looked stuck.
setInterval(function () {                                  // setInterval repeats forever. This runs every half second.
  const looksStuck = ballState.busy && !currentTrip && !ballIsGone() && !ballHas('is-forming');   // Busy but nothing is happening?
  if (!looksStuck) {                                       // Not stuck:
    stuckSince = 0;                                        // reset the timer,
    return;                                                // and stop here.
  }                                                        // End of if.
  if (!stuckSince) stuckSince = Date.now();                // Just got stuck? Note the time.
  if (Date.now() - stuckSince > 2500) {                    // Stuck for over 2.5 seconds?
    ballState.busy = false;                                // Free it.
    ballState.touches = 0;                                 // Reset touches.
    ball.classList.remove('is-rising', 'is-zooming', 'is-winding-up');   // Clear any leftover looks.
    stuckSince = 0;                                        // Reset the timer.
  }                                                        // End of if.
}, 500);                                                   // Repeat every 500 milliseconds (0.5 seconds).


// ---------------------------------------------------------------------
// 10. PEEK CAROUSELS (the sideways rows of cards in Work and Playground)
// ---------------------------------------------------------------------

const peekCarousels = Array.from(document.querySelectorAll('.peek-carousel'));   // Every sideways-scrolling card row.

function scrollProjects(carousel, direction) {              // Scrolls one carousel one card left (-1) or right (1).
  const row = carousel.querySelector('.peek-row');          // The scrolling row inside this carousel.
  const firstCard = row.querySelector('.project-card');     // Any card works; they are all the same width.
  if (!firstCard) return;                                   // No cards? Stop.
  const gap = parseFloat(getComputedStyle(row).columnGap) || 18;   // The space between cards, read from style.css.
  const oneCard = firstCard.getBoundingClientRect().width + gap;   // How far one card step is.
  row.scrollBy({ left: oneCard * direction });              // Scroll by one card. style.css makes it glide smoothly.
}                                                          // End of scrollProjects.

function updatePeekArrows(carousel) {                       // Fades out an arrow when there is nowhere left to go.
  const row = carousel.querySelector('.peek-row');          // The scrolling row.
  const controls = carousel.querySelector('.peek-controls');   // The box holding both arrows.
  const arrows = Array.from(carousel.querySelectorAll('.peek-arrow'));  // The two arrow buttons.
  const atStart = row.scrollLeft <= 2;                      // Scrolled all the way left?
  const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2;   // Scrolled all the way right?
  arrows[0].disabled = atStart;                             // Left arrow off at the start.
  arrows[1].disabled = atEnd;                               // Right arrow off at the end.
  controls.hidden = atStart && atEnd;                       // If every card already fits, hide both arrows.
  row.classList.toggle('not-at-start', !atStart);           // Turns on the soft left fade once you scroll (style.css).
  row.classList.toggle('at-end', atEnd);                    // Turns off the soft right fade at the last card, so it shows fully.
}                                                          // End of updatePeekArrows.

peekCarousels.forEach(function (carousel) {                // For each sideways-scrolling row...
  const arrows = Array.from(carousel.querySelectorAll('.peek-arrow'));   // ...get its arrows.
  const row = carousel.querySelector('.peek-row');          // ...and its row.
  arrows.forEach(function (arrow) {                         // For each arrow in this carousel...
    arrow.addEventListener('click', function () {           // ...when clicked...
      scrollProjects(carousel, Number(arrow.dataset.direction));   // ...scroll this row in its direction.
    });                                                     // End of the click listener.
  });                                                       // End of the arrows.
  row.addEventListener('scroll', function () { updatePeekArrows(carousel); }, { passive: true });   // Re-check the arrows whenever the row scrolls.
  updatePeekArrows(carousel);                               // Check once at the start.
});                                                         // End of peek carousel setup.


// ---------------------------------------------------------------------
// 11. CASE STUDY POP-UP
// Each project's words live here. Add a new project by copying one block.
// The id (like 'dsff') must match data-open="dsff" in index.html.
// ---------------------------------------------------------------------

// TO ADD A CASE STUDY: copy one whole project block below, paste it before "End of PROJECTS," give it a new id,
// and add that id to PROJECT_ORDER. The full steps are in HOW TO #1 at the top of index.html.
const PROJECTS = {                                         // All the case studies. Each id must match data-open="..." in index.html.
  'dsff': {                                                // Project id.
    title: 'Dark Scenes with the Fear Forge',              // Title on the wall label.
    year: '2026',                                          // Year.
    materials: 'Wood, speakers, printed cards, tools used', // Materials or tools.
    role: 'Your role',                                     // Your role.
    note: 'A horror card game and handcrafted sound instrument that helps children ages 8 to 12 build emotional resilience.',   // One-sentence description.
    media: '',                                             // Your hero image or video file, like 'images/dsff.jpg' or 'images/dsff-loop.mp4'. Leave '' for the gray stand-in.
    quote: { text: 'A short quote from a player, teacher, or partner goes here.', by: 'Name, role' },   // Delete this line if there is no quote.
    sections: [                                            // The story parts. Each is [heading, the HTML inside it].
      ['Overview', '<p class="body-text">A handcrafted, coffin-shaped sound instrument and horror card game that helps children ages 8 to 12 build emotional resilience. Players face their fears together through sound, story, and play.</p>'],   // Story part "Overview". Change the words between <p> and </p>.
      ['Process', '<p class="body-text">Two or three short paragraphs on research, early sketches, and how the instrument and card game came together.</p><div class="project-grid"><div class="placeholder" style="aspect-ratio:4/3">sketch</div><div class="placeholder" style="aspect-ratio:4/3">prototype</div><div class="placeholder" style="aspect-ratio:4/3">build</div></div>'],   // Story part "Process". Change the words between <p> and </p>. The gray <div> boxes are stand-in pictures.
      ['Playtest', '<p class="body-text">Who played, what you watched for, and the moments that surprised you. A pull quote from a player works well here.</p><div class="placeholder" style="aspect-ratio:16/9">playtest photo or clip</div>'],   // Story part "Playtest". Change the words between <p> and </p>. The gray <div> boxes are stand-in pictures.
      ['Outcomes', '<p class="body-text">Results from playtest data, what you would do next, and what you learned as a designer.</p>']   // Story part "Outcomes". Change the words between <p> and </p>.
    ]   // End of the story parts.
  },   // End of this project.
  'career-explorer': {                                     // Game Career Explorer.
    title: 'Game Career Explorer',   // The project's name. Change the words between the quotes.
    year: '2026',   // The year you made it, like '2025'.
    materials: 'HTML, CSS, JavaScript, Unity',   // What you made it with: materials or software.
    role: 'Lead developer and experience designer, Harlem Gallery of Science',   // Your role, shown on the wall label.
    note: 'An interactive web experience that simulates a game studio internship across seven departments, ending in the Unity demo game Patch and Watt: Split Spark.',   // The short description on the wall label.
    media: '',                                             // Your hero image or video file, like 'images/dsff.jpg' or 'images/dsff-loop.mp4'. Leave '' for the gray stand-in.
    quote: { text: 'A short quote from a player, teacher, or partner goes here.', by: 'Name, role' },   // Delete this line if there is no quote.
    sections: [   // The story parts. Each part is ['Heading', 'words and pictures'].
      ['Overview', '<p class="body-text">An interactive web experience that simulates a game studio internship across seven departments. Visitors earn a badge for each department, then play a Unity demo game that ties their learning together.</p>'],   // Story part "Overview". Change the words between <p> and </p>.
      ['Process', '<p class="body-text">How you mapped studio roles into playable moments and built the badge system.</p>'],   // Story part "Process". Change the words between <p> and </p>.
      ['Patch and Watt: Split Spark', '<p class="body-text">The capstone Unity demo game, and how it connects to what visitors learned.</p>'],   // Story part "Patch and Watt: Split Spark". Change the words between <p> and </p>.
      ['Outcomes', '<p class="body-text">Feedback, results, and next steps.</p>']   // Story part "Outcomes". Change the words between <p> and </p>.
    ]   // End of the story parts.
  },   // End of this project.
  'trailblazer-heroes': {                                  // Trailblazer Heroes. You did not create the game, so "credit" says who did.
    title: 'Trailblazer Heroes: The AAPI Card Game',   // The project's name. Change the words between the quotes.
    year: 'Year',   // The year you made it, like '2025'.
    credit: 'Game by [creator]. Curriculum Guide by Brandy Coleman.',   // Replaces the usual "Brandy Coleman, year" line. Put the creator's name in.
    materials: 'Printed card game and curriculum guide',   // What you made it with: materials or software.
    role: 'Content research and writing lead; author of the first-edition Curriculum Guide',   // Your role, shown on the wall label.
    note: 'A card game celebrating Asian American and Pacific Islander trailblazers. My work: the research, the writing, and the guide that brings it into classrooms.',   // The short description on the wall label.
    media: '',                                             // Your hero image or video file, like 'images/dsff.jpg' or 'images/dsff-loop.mp4'. Leave '' for the gray stand-in.
    quote: { text: 'A short quote from a player, teacher, or partner goes here.', by: 'Name, role' },   // Delete this line if there is no quote.
    sections: [   // The story parts. Each part is ['Heading', 'words and pictures'].
      ['Overview', '<p class="body-text">What the game is, who it is for, and who created it.</p>'],   // Story part "Overview". Change the words between <p> and </p>.
      ['My role', '<p class="body-text">How you led the content research and writing team.</p>'],   // Story part "My role". Change the words between <p> and </p>.
      ['The Curriculum Guide', '<p class="body-text">How you designed the first-edition guide for teachers.</p><div class="placeholder" style="aspect-ratio:16/9">guide pages</div>'],   // Story part "The Curriculum Guide". Change the words between <p> and </p>. The gray <div> boxes are stand-in pictures.
      ['Impact', '<p class="body-text">Over 100 units sold. Add any feedback from teachers or players.</p>']   // Story part "Impact". Change the words between <p> and </p>.
    ]   // End of the story parts.
  },   // End of this project.
  'shifty-friend': {                                       // Shifty Friend.
    title: 'Shifty Friend',   // The project's name. Change the words between the quotes.
    year: 'Year',   // The year you made it, like '2025'.
    materials: 'Tools used',   // What you made it with: materials or software.
    role: 'Your role',   // Your role, shown on the wall label.
    note: 'An AI interactive. One sentence about what players do and what it explores.',   // The short description on the wall label.
    media: '',                                             // Your hero image or video file, like 'images/dsff.jpg' or 'images/dsff-loop.mp4'. Leave '' for the gray stand-in.
    quote: { text: 'A short quote from a player, teacher, or partner goes here.', by: 'Name, role' },   // Delete this line if there is no quote.
    sections: [   // The story parts. Each part is ['Heading', 'words and pictures'].
      ['Overview', '<p class="body-text">What players do, and the question the piece explores.</p>'],   // Story part "Overview". Change the words between <p> and </p>.
      ['Designing the AI character', '<p class="body-text">How you shaped its personality, rules, and limits.</p>'],   // Story part "Designing the AI character". Change the words between <p> and </p>.
      ['Outcomes', '<p class="body-text">What players did and what you learned.</p>']   // Story part "Outcomes". Change the words between <p> and </p>.
    ]   // End of the story parts.
  },   // End of this project.
  'steamnasium': {                                         // STEAMnasium photo booth and I Spy.
    title: 'STEAMnasium Photo Booth and I Spy',   // The project's name. Change the words between the quotes.
    year: '2025 and 2026',   // The year you made it, like '2025'.
    credit: 'Teachers College Game Research Lab, 2025 and 2026',   // Replaces the usual "Brandy Coleman, year" line, since this was a team project.
    materials: 'Fabrication, tools used',   // What you made it with: materials or software.
    role: 'Co-designer and fabricator',   // Your role, shown on the wall label.
    note: 'Interactive exhibit experiences co-designed and fabricated for a public STEAM learning event: a photo booth and an I Spy game with custom tools.',   // The short description on the wall label.
    media: '',                                             // Your hero image or video file, like 'images/dsff.jpg' or 'images/dsff-loop.mp4'. Leave '' for the gray stand-in.
    quote: { text: 'A short quote from a player, teacher, or partner goes here.', by: 'Name, role' },   // Delete this line if there is no quote.
    sections: [   // The story parts. Each part is ['Heading', 'words and pictures'].
      ['Overview', '<p class="body-text">Where these lived and who used them.</p>'],   // Story part "Overview". Change the words between <p> and </p>.
      ['The photo booth', '<p class="body-text">How you designed and built it.</p><div class="placeholder" style="aspect-ratio:16/9">photo booth</div>'],   // Story part "The photo booth". Change the words between <p> and </p>. The gray <div> boxes are stand-in pictures.
      ['The I Spy game and tools', '<p class="body-text">How the game worked and what you made for it.</p>'],   // Story part "The I Spy game and tools". Change the words between <p> and </p>.
      ['Outcomes', '<p class="body-text">How visitors responded.</p>']   // Story part "Outcomes". Change the words between <p> and </p>.
    ]   // End of the story parts.
  }   // End of this project.
};                                                         // End of PROJECTS.

const PROJECT_ORDER = ['dsff', 'career-explorer', 'trailblazer-heroes', 'shifty-friend', 'steamnasium'];   // The order the "Next" button follows.

const popup = document.getElementById('case-study');       // The pop-up cover.
const popupPanel = document.getElementById('case-study-panel');   // The sliding panel.
const closeButton = document.getElementById('close-button');      // The Close button.
const nextButton = document.getElementById('next-button');        // The Next button.
let openProjectId = null;                                  // Which project is showing.
let focusBeforePopup = null;                               // What was selected before opening, so we can return there.

function setAddress(newAddress) {                          // Changes the web address without reloading the page.
  try {                                                    // "try" means: attempt this, and if it fails, do not crash.
    history.replaceState(null, '', newAddress);            // Swap the address.
  } catch (problem) {                                      // If the browser refuses (some preview windows do)...
    // ...we simply skip it. The page still works.
  }                                                        // End of try.
}                                                          // End of setAddress.

function getNextProjectId(id) {                            // Finds the project after this one.
  const position = PROJECT_ORDER.indexOf(id);              // Where this one is in the list.
  return PROJECT_ORDER[(position + 1) % PROJECT_ORDER.length];   // The next one. % wraps back to the first after the last.
}                                                          // End of getNextProjectId.

function putMedia(box, file, alt, label) {               // Shows a photo, GIF, or video in a box, or a gray stand-in if there is no file yet.
  box.textContent = '';                                    // Clear the box.
  box.classList.toggle('placeholder', !file);              // Gray stand-in look only when there is no file.
  if (!file) {                                             // No file yet?
    box.textContent = label;                               // Show the stand-in words.
    return;                                                // Done.
  }                                                        // End of if.
  const isVideo = /\.(mp4|webm|mov)$/i.test(file);        // Does the file name end in .mp4, .webm, or .mov? Then it is a video.
  const item = document.createElement(isVideo ? 'video' : 'img');   // Make a video or an image.
  item.src = file;                                         // Point it at your file.
  if (isVideo) {                                           // For videos:
    item.muted = true;                                     // no sound (browsers only autoplay silent videos),
    item.loop = true;                                      // play on repeat,
    item.playsInline = true;                               // play inside the page on phones, not full screen,
    item.setAttribute('aria-label', alt);                  // describe it for screen readers,
    if (lessMotion) item.controls = true;                  // and for less motion, show play controls instead of autoplaying...
    else item.autoplay = true;                             // ...otherwise start playing right away.
  } else {                                                 // For photos and GIFs:
    item.alt = alt;                                        // describe it for screen readers.
  }                                                        // End of if.
  box.appendChild(item);                                   // Put it in the box.
}                                                          // End of putMedia.

function fillPopup(id) {                                   // Puts a project's words into the pop-up.
  const project = PROJECTS[id];                            // Look up the project.
  openProjectId = id;                                      // Remember it.
  document.getElementById('case-title').textContent = project.title;                    // Title.
  document.getElementById('case-credit').textContent = project.credit || ('Brandy Coleman, ' + project.year); // Credit line.
  document.getElementById('case-materials').textContent = project.materials;            // Materials.
  document.getElementById('case-role').textContent = project.role;                      // Role.
  document.getElementById('case-note').textContent = project.note;                      // Description.
  putMedia(document.getElementById('case-media'), project.media, project.title, 'hero image or video · ' + project.title);   // Hero image, video, or stand-in.
  const quote = document.getElementById('case-quote');     // The quote box.
  quote.hidden = !project.quote;                           // Hide it if this project has no quote.
  if (project.quote) {                                     // Has a quote?
    document.getElementById('case-quote-text').textContent = '“' + project.quote.text + '”';   // The quote, in curly quote marks.
    document.getElementById('case-quote-by').textContent = project.quote.by;                    // Who said it.
  }                                                        // End of if.
  let storyHTML = '';                                      // Start with an empty story.
  project.sections.forEach(function (part) {               // For each story part...
    storyHTML += '<section class="story-section"><h3>' + part[0] + '</h3>' + part[1] + '</section>';   // ...add its heading and content.
  });                                                      // End of the story parts.
  document.getElementById('case-story').innerHTML = storyHTML;   // Put the story on the page.
  nextButton.textContent = 'Next: ' + PROJECTS[getNextProjectId(id)].title;   // Label the Next button.
  popupPanel.scrollTop = 0;                                // Start at the top of the panel.
}                                                          // End of fillPopup.

function openPopup(id, cameFromLink) {                     // Opens a case study.
  if (!PROJECTS[id]) return;                               // Unknown project? Do nothing.
  focusBeforePopup = document.activeElement;               // Remember what was selected.
  fillPopup(id);                                           // Fill in the words.
  popup.hidden = false;                                    // Show the pop-up.
  document.documentElement.classList.add('no-scroll');     // Freeze the page behind it.
  requestAnimationFrame(function () {                      // Wait two frames so the slide-up animation plays.
    requestAnimationFrame(function () { popup.classList.add('open'); });  // ...then add "open" to slide it up.
  });                                                      // End of the wait.
  if (!cameFromLink) setAddress('#' + id);                 // Put #dsff (etc.) in the address bar so the link can be shared.
  setTimeout(function () { closeButton.focus(); }, 60);    // Select the Close button for keyboard users.
}                                                          // End of openPopup.

function closePopup() {                                    // Closes the case study.
  if (popup.hidden) return;                                // Already closed? Do nothing.
  popup.classList.remove('open');                          // Start sliding down.
  setAddress(location.pathname + location.search);         // Remove the #project from the address bar.
  setTimeout(function () {                                 // After the slide finishes:
    popup.hidden = true;                                   // hide it,
    document.documentElement.classList.remove('no-scroll');   // unfreeze the page,
    if (focusBeforePopup && focusBeforePopup.focus) focusBeforePopup.focus();   // and return focus where it was.
  }, lessMotion ? 0 : 380);                                // 0.38 seconds later (right away for less motion).
}                                                          // End of closePopup.

document.addEventListener('click', function (event) {      // Any click anywhere:
  const opener = event.target.closest('[data-open]');      // Was it on (or inside) a case study card or button?
  if (opener) {                                            // If yes...
    event.preventDefault();                                // ...stop any default action...
    openPopup(opener.dataset.open);                        // ...and open that case study.
    return;                                                // Done.
  }                                                        // End of if.
  const quickOpener = event.target.closest('[data-quick]');   // Was it on (or inside) a Playground card?
  if (quickOpener) openQuickLook(quickOpener.dataset.quick);  // If yes, open its quick look (see section 12).
});                                                        // End of the click listener.

document.addEventListener('keydown', function (event) {    // Any key press:
  const selected = document.activeElement;                 // What is selected right now.
  if ((event.key === 'Enter' || event.key === ' ') && selected && (selected.dataset.open || selected.dataset.quick)) {   // Enter or Space on a card?
    event.preventDefault();                                // Stop the browser from doing its usual thing.
    if (selected.dataset.open) openPopup(selected.dataset.open);    // A case study card opens its case study...
    else openQuickLook(selected.dataset.quick);            // ...and a Playground card opens its quick look.
  }                                                        // End of if.
  if (event.key === 'Escape') {                            // Esc...
    closePopup();                                          // ...closes the case study pop-up...
    closeQuickLook();                                      // ...and the quick look, whichever is open.
  }                                                        // End of if.
  const openDialog = !popup.hidden ? popup : (!quickLook.hidden ? quickLook : null);   // Which pop-up is open, if any.
  if (event.key === 'Tab' && openDialog) {                 // Tab inside a pop-up: keep focus inside it.
    const focusable = Array.from(openDialog.querySelectorAll('button, a, [tabindex="0"]')).filter(function (item) { return !item.classList.contains('is-placeholder'); });   // Everything you can Tab to inside (skipping faded placeholder links).
    if (!focusable.length) return;                         // Nothing to focus? Stop.
    const first = focusable[0];                            // The first one.
    const last = focusable[focusable.length - 1];          // The last one.
    if (event.shiftKey && document.activeElement === first) {   // Shift+Tab on the first one?
      event.preventDefault();                              // Stop the browser from doing its usual thing...
      last.focus();                                        // ...and jump to the last one.
    } else if (!event.shiftKey && document.activeElement === last) {   // Tab on the last one?
      event.preventDefault();                              // Stop the browser from doing its usual thing...
      first.focus();                                       // ...and jump to the first one.
    }                                                      // End of if.
  }                                                        // End of the Tab check.
});                                                        // End of the key listener.

closeButton.addEventListener('click', closePopup);         // The Close button closes it.
popup.addEventListener('click', function (event) {         // Clicking the dark area outside the panel...
  if (event.target === popup) closePopup();                // ...closes it too.
});                                                        // End of the outside-click listener.
nextButton.addEventListener('click', function () {         // The Next button:
  const nextId = getNextProjectId(openProjectId);          // find the next project,
  fillPopup(nextId);                                       // show it,
  setAddress('#' + nextId);                                // and update the address bar.
});                                                        // End of the Next listener.


// ---------------------------------------------------------------------
// 12. PLAYGROUND QUICK LOOK
// A smaller pop-up for each Playground project. Each project's words and
// links live here. The id (like 'graveyard') must match data-quick="graveyard"
// in index.html.
//   media         = your screenshot, GIF, or short video file, like 'images/graveyard.gif'.
//                   Leave '' for the gray stand-in.
//   note          = one line on what it is.
//   why, special, teaches = the three short parts under the note. Leave one
//                   out (delete its line) and that part simply does not show.
//   photos: true  = show a row of 3 photos instead of one big picture.
//                   Visitors click a small photo to see it large underneath.
//                   For real photos, list the files instead of true, like:
//                   photos: ['photos/windchimes-1.jpg', 'photos/windchimes-2.jpg', 'photos/windchimes-3.jpg'],
//   links         = the pink buttons. Paste a web address between the quotes
//                   after url:. Until you do, the button shows faded and cannot
//                   be clicked, so it never leads nowhere.
// ---------------------------------------------------------------------

// TO ADD A PLAYGROUND PROJECT: copy one whole project block below, paste it inside the list, and give it a new id
// that matches data-quick in index.html. The full steps are in HOW TO #2 at the top of index.html.
const QUICK_LOOKS = {                                      // All the Playground projects.
  'alt-controller': {   // Project id. Must match data-quick="alt-controller" in index.html.
    title: 'Alternative controller game',   // The project's name. Change the words between the quotes.
    role: 'Your role · 2024',   // Your role and the year, shown in pink.
    tags: ['Game', 'Physical'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'Game jam prototype that won Best Alternative Controller at Global Game Jam 2024.',   // One line on what it is.
    media: '',   // Your picture, GIF, or video file, like 'images/graveyard.gif'. Leave '' for the gray stand-in.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    links: [{ label: 'Play on itch.io', url: '' }]   // The pink button. Paste your web address between the quotes after url:
  },   // End of this project.
  'ar-history': {   // Project id. Must match data-quick="ar-history" in index.html.
    title: 'ARtifacts: Central Park',   // The project's name. Change the words between the quotes.
    role: 'Your role · 2025',   // Your role and the year, shown in pink.
    tags: ['Learning', 'AR'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'A location-based AR history prototype and research poster, presented at the Connected Learning Summit 2025.',   // One line on what it is.
    media: '',   // Your picture, GIF, or video file, like 'images/graveyard.gif'. Leave '' for the gray stand-in.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    links: [{ label: 'See the poster', url: '' }]   // The pink button. Paste your web address between the quotes after url:
  },   // End of this project.
  'see-you-in-court': {   // Project id. Must match data-quick="see-you-in-court" in index.html.
    title: 'See You In Court',   // The project's name. Change the words between the quotes.
    role: 'Your role · Year',   // Your role and the year, shown in pink.
    tags: ['Board game'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'A board game.',   // One line on what it is.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    photos: true,   // true = 3 photos people can click. Or list your files, like ['a.jpg', 'b.jpg', 'c.jpg'].
    links: []   // No link buttons. To add one: [{ label: 'Button words', url: 'https://...' }]
  },   // End of this project.
  'governors-island': {   // Project id. Must match data-quick="governors-island" in index.html.
    title: 'Governors Island',   // The project's name. Change the words between the quotes.
    role: 'Your role · Year',   // Your role and the year, shown in pink.
    tags: ['Board game'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'A board game.',   // One line on what it is.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    photos: true,   // true = 3 photos people can click. Or list your files, like ['a.jpg', 'b.jpg', 'c.jpg'].
    links: []   // No link buttons. To add one: [{ label: 'Button words', url: 'https://...' }]
  },   // End of this project.
  'windchimes': {   // Project id. Must match data-quick="windchimes" in index.html.
    title: 'Wishing Windchimes',   // The project's name. Change the words between the quotes.
    role: 'Your role · Year',   // Your role and the year, shown in pink.
    tags: ['Physical'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'A fabrication project.',   // One line on what it is.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    photos: true,   // true = 3 photos people can click. Or list your files, like ['a.jpg', 'b.jpg', 'c.jpg'].
    links: []   // No link buttons. To add one: [{ label: 'Button words', url: 'https://...' }]
  },   // End of this project.
  'circuit-sewing': {   // Project id. Must match data-quick="circuit-sewing" in index.html.
    title: 'Circuit Sewing',   // The project's name. Change the words between the quotes.
    role: 'Your role · Year',   // Your role and the year, shown in pink.
    tags: ['Physical'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'Sewn circuits.',   // One line on what it is.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    photos: true,   // true = 3 photos people can click. Or list your files, like ['a.jpg', 'b.jpg', 'c.jpg'].
    links: []   // No link buttons. To add one: [{ label: 'Button words', url: 'https://...' }]
  },   // End of this project.
  'wood-gear': {   // Project id. Must match data-quick="wood-gear" in index.html.
    title: 'Wood and Gear Work',   // The project's name. Change the words between the quotes.
    role: 'Your role · Year',   // Your role and the year, shown in pink.
    tags: ['Physical'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'Woodworking and gears.',   // One line on what it is.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    photos: true,   // true = 3 photos people can click. Or list your files, like ['a.jpg', 'b.jpg', 'c.jpg'].
    links: []   // No link buttons. To add one: [{ label: 'Button words', url: 'https://...' }]
  },   // End of this project.
  'graveyard': {   // Project id. Must match data-quick="graveyard" in index.html.
    title: 'Graveyard',   // The project's name. Change the words between the quotes.
    role: 'Your role · Year',   // Your role and the year, shown in pink.
    tags: ['Game'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'A Scratch click game.',   // One line on what it is.
    media: '',   // Your picture, GIF, or video file, like 'images/graveyard.gif'. Leave '' for the gray stand-in.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    links: [{ label: 'Play on Scratch', url: '' }]   // The pink button. Paste your web address between the quotes after url:
  },   // End of this project.
  'dino-tweak': {   // Project id. Must match data-quick="dino-tweak" in index.html.
    title: 'Dino Tweak',   // The project's name. Change the words between the quotes.
    role: 'Your role · Year',   // Your role and the year, shown in pink.
    tags: ['Game'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'A Scratch click game.',   // One line on what it is.
    media: '',   // Your picture, GIF, or video file, like 'images/graveyard.gif'. Leave '' for the gray stand-in.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    links: [{ label: 'Play on Scratch', url: '' }]   // The pink button. Paste your web address between the quotes after url:
  },   // End of this project.
  'dark-romance': {   // Project id. Must match data-quick="dark-romance" in index.html.
    title: 'Dark Romance',   // The project's name. Change the words between the quotes.
    role: 'Your role · Year',   // Your role and the year, shown in pink.
    tags: ['Game'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'A Unity game.',   // One line on what it is.
    media: '',   // Your picture, GIF, or video file, like 'images/graveyard.gif'. Leave '' for the gray stand-in.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    links: [{ label: 'Play on itch.io', url: '' }]   // The pink button. Paste your web address between the quotes after url:
  },   // End of this project.
  'missing-sister': {   // Project id. Must match data-quick="missing-sister" in index.html.
    title: 'Missing Sister',   // The project's name. Change the words between the quotes.
    role: 'Your role · Year',   // Your role and the year, shown in pink.
    tags: ['Game'],   // The small tags. Each word goes in quotes, with commas between.
    note: 'A Unity game.',   // One line on what it is.
    media: '',   // Your picture, GIF, or video file, like 'images/graveyard.gif'. Leave '' for the gray stand-in.
    why: 'One or two sentences on why you made it.',   // The "Why I made it" part. Type your words between the quotes.
    special: 'One or two sentences on what makes it special.',   // The "What makes it special" part.
    teaches: 'One or two sentences on what it teaches or encourages players to do.',   // The "What it teaches" part. Delete this line if it does not fit.
    links: [{ label: 'Play on itch.io', url: '' }]   // The pink button. Paste your web address between the quotes after url:
  }   // End of this project.
};                                                         // End of QUICK_LOOKS.

const QUICK_ORDER = Object.keys(QUICK_LOOKS);              // The order for Previous and Next: the same order as the list above.

const quickLook = document.getElementById('quick-look');   // The quick look cover.
const quickPanel = document.getElementById('quick-panel'); // Its panel.
const quickClose = document.getElementById('quick-close'); // Its Close button.
const quickPrev = document.getElementById('quick-prev');   // Its Previous button.
const quickNext = document.getElementById('quick-next');   // Its Next button.
let openQuickId = null;                                    // Which project is showing.
let focusBeforeQuick = null;                               // What was selected before opening, so we can return there.

function makeTextElement(tag, className, text) {           // Makes a new element with some words in it.
  const element = document.createElement(tag);             // Make the element (like a <div>).
  if (className) element.className = className;            // Give it a class, if one was given.
  element.textContent = text;                              // Put the words in. textContent keeps them as plain words, never code.
  return element;                                          // Give it back.
}                                                          // End of makeTextElement.

function showBigPhoto(files, index, row, big, title) {   // Shows one photo large and outlines its small photo in pink.
  Array.from(row.children).forEach(function (thumb, i) {   // For each small photo...
    thumb.classList.toggle('is-selected', i === index);    // ...outline only the chosen one (see style.css)...
    thumb.setAttribute('aria-pressed', i === index ? 'true' : 'false');   // ...and tell screen readers which one is chosen.
  });                                                      // End of the small photos.
  big.textContent = '';                                    // Clear the big photo.
  big.classList.toggle('placeholder', !files[index]);      // Gray stand-in if there is no file yet.
  if (files[index]) {                                      // A real photo file?
    const img = document.createElement('img');             // Show it big.
    img.src = files[index];                                // The file.
    img.alt = title + ', photo ' + (index + 1);            // Describes it for screen readers.
    big.appendChild(img);                                  // Put it in.
  } else {                                                 // No file yet?
    big.textContent = 'photo ' + (index + 1) + ', large';  // Stand-in label.
  }                                                        // End of if.
}                                                          // End of showBigPhoto.

function quickStep(id, direction) {                        // Finds the project before (-1) or after (1) this one.
  const position = QUICK_ORDER.indexOf(id);                // Where this one is in the list.
  return QUICK_ORDER[(position + direction + QUICK_ORDER.length) % QUICK_ORDER.length];   // Wraps around at both ends.
}                                                          // End of quickStep.

function fillQuickLook(id) {                               // Puts a project's words into the quick look.
  const project = QUICK_LOOKS[id];                         // Look up the project.
  openQuickId = id;                                        // Remember it.

  const media = document.getElementById('quick-media');    // The picture area.
  media.className = '';                                    // Clear the old look...
  media.textContent = '';                                  // ...and the old contents.
  if (project.photos) {                                    // A physical project? Show a row of small photos with a big one below.
    const files = Array.isArray(project.photos) ? project.photos : [null, null, null];   // Real photo files, or 3 stand-ins if photos is just true.
    const row = document.createElement('div');             // The row of small photos...
    row.className = 'quick-photos';                        // (styled in style.css)
    const big = document.createElement('div');             // ...and the big photo under them.
    big.className = 'quick-big';                           // (styled in style.css)
    media.className = 'quick-gallery';                     // The whole photo area.
    files.forEach(function (file, i) {                     // For each photo...
      const thumb = document.createElement('button');      // ...make a small clickable photo.
      thumb.className = 'quick-thumb';                     // (styled in style.css)
      thumb.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' larger');   // What screen readers say.
      if (file) {                                          // A real photo file?
        const img = document.createElement('img');         // Show it.
        img.src = file;                                    // The file name, like 'photos/windchimes-1.jpg'.
        img.alt = '';                                      // The big photo below carries the description, so this one stays quiet.
        thumb.appendChild(img);                            // Put the picture in the button.
      } else {                                             // No file yet?
        thumb.classList.add('placeholder');                // Gray stand-in...
        thumb.textContent = 'photo ' + (i + 1);            // ...with a label.
      }                                                    // End of if.
      thumb.addEventListener('click', function () { showBigPhoto(files, i, row, big, project.title); });   // Clicking it shows it big.
      row.appendChild(thumb);                              // Add it to the row.
    });                                                    // End of the photos.
    media.appendChild(row);                                // Small photos on top...
    media.appendChild(big);                                // ...big photo below.
    showBigPhoto(files, 0, row, big, project.title);       // Start with the first photo selected.
  } else {                                                 // Otherwise, one big picture.
    media.className = 'quick-media';                       // The big picture area.
    putMedia(media, project.media, project.title, 'screenshot, GIF, or short clip');   // Your picture or video, or a stand-in.
  }                                                        // End of if.

  document.getElementById('quick-title').textContent = project.title;   // Title.
  document.getElementById('quick-role').textContent = project.role;     // Role and year.
  document.getElementById('quick-note').textContent = project.note;     // One line on what it is.

  const parts = document.getElementById('quick-parts');    // The three short labeled parts.
  parts.textContent = '';                                  // Clear the old ones.
  [['Why I made it', project.why], ['What makes it special', project.special], ['What it teaches', project.teaches]].forEach(function (part) {   // For each part...
    if (!part[1]) return;                                  // ...skip it if there are no words for it...
    const block = document.createElement('div');           // ...otherwise make a small block...
    block.className = 'quick-part';                        // (styled in style.css)
    block.appendChild(makeTextElement('h3', 'small-label', part[0]));   // ...with a tiny label...
    block.appendChild(makeTextElement('p', 'body-text', part[1]));      // ...and the words.
    parts.appendChild(block);                              // Add it.
  });                                                      // End of the parts.

  const tags = document.getElementById('quick-tags');      // The tag list.
  tags.textContent = '';                                   // Clear the old tags.
  project.tags.forEach(function (tag) { tags.appendChild(makeTextElement('li', '', tag)); });   // Add each tag.

  const links = document.getElementById('quick-links');    // The button row.
  links.textContent = '';                                  // Clear the old buttons.
  links.hidden = project.links.length === 0;               // No links? Hide the row.
  project.links.forEach(function (link) {                  // For each link...
    const button = makeTextElement('a', 'glow-button', link.label);   // ...make a pink pill button...
    if (link.url) {                                        // ...and if it has a web address...
      button.href = link.url;                              // ...point it there,
      button.target = '_blank';                            // open it in a new tab,
      button.rel = 'noopener';                             // (a safety setting for new tabs)
    } else {                                               // No web address yet?
      button.classList.add('is-placeholder');              // Show it faded and unclickable (see style.css).
      button.setAttribute('aria-disabled', 'true');        // Tell screen readers it does not work yet.
    }                                                      // End of if.
    links.appendChild(button);                             // Add the button.
  });                                                      // End of the links.

  quickPrev.textContent = '← ' + QUICK_LOOKS[quickStep(id, -1)].title;   // Label Previous with the project's name.
  quickNext.textContent = QUICK_LOOKS[quickStep(id, 1)].title + ' →';    // Label Next with the project's name.
  quickPanel.scrollTop = 0;                                // Start at the top.
}                                                          // End of fillQuickLook.

function openQuickLook(id, cameFromLink) {                 // Opens a quick look.
  if (!QUICK_LOOKS[id]) return;                            // Unknown project? Do nothing.
  focusBeforeQuick = document.activeElement;               // Remember what was selected.
  fillQuickLook(id);                                       // Fill in the words.
  quickLook.hidden = false;                                // Show it.
  document.documentElement.classList.add('no-scroll');     // Freeze the page behind it.
  requestAnimationFrame(function () {                      // Wait two frames so the fade-in plays...
    requestAnimationFrame(function () { quickLook.classList.add('open'); });   // ...then add "open."
  });                                                      // End of the wait.
  if (!cameFromLink) setAddress('#' + id);                 // Put #graveyard (etc.) in the address bar so the link can be shared.
  setTimeout(function () { quickClose.focus(); }, 60);     // Select Close for keyboard users.
}                                                          // End of openQuickLook.

function closeQuickLook() {                                // Closes the quick look.
  if (quickLook.hidden) return;                            // Already closed? Do nothing.
  quickLook.classList.remove('open');                      // Start fading out.
  setAddress(location.pathname + location.search);         // Remove the #project from the address bar.
  setTimeout(function () {                                 // After the fade:
    quickLook.hidden = true;                               // hide it,
    document.documentElement.classList.remove('no-scroll');   // unfreeze the page,
    if (focusBeforeQuick && focusBeforeQuick.focus) focusBeforeQuick.focus();   // and return focus where it was.
  }, lessMotion ? 0 : 380);                                // 0.38 seconds later (right away for less motion).
}                                                          // End of closeQuickLook.

function stepQuickLook(direction) {                        // Shows the previous (-1) or next (1) project.
  const id = quickStep(openQuickId, direction);            // Find it.
  fillQuickLook(id);                                       // Show it.
  setAddress('#' + id);                                    // Update the address bar.
}                                                          // End of stepQuickLook.

quickClose.addEventListener('click', closeQuickLook);      // Close closes it.
quickLook.addEventListener('click', function (event) {     // Clicking the dark area outside the panel...
  if (event.target === quickLook) closeQuickLook();        // ...closes it too.
});                                                        // End of the outside-click listener.
quickPrev.addEventListener('click', function () { stepQuickLook(-1); });   // Previous button.
quickNext.addEventListener('click', function () { stepQuickLook(1); });    // Next button.


// ---------------------------------------------------------------------
// 13. START EVERYTHING
// ---------------------------------------------------------------------

function everyFrame(now) {                                 // Runs about 60 times per second.
  frameCount = frameCount + 1;                             // Count the frame.
  moveBall(now);                                           // Move the ball.
  makeSparkles();                                          // Add new sparkles.
  drawParticles();                                         // Move and draw all sparkles.
  requestAnimationFrame(everyFrame);                       // Ask to run again next frame.
}                                                          // End of everyFrame.

resizeCanvas();                                            // Size the sparkle canvas.
placeBall(0, BALL_SPOTS[0][0], 'instant');                 // Put the ball at its first spot.
updateBackgroundAndMenu();                                 // Set the starting background color.
requestAnimationFrame(everyFrame);                         // Start the animation loop.

if (document.fonts && document.fonts.ready) {              // When the fonts finish loading (they change sizes a little)...
  document.fonts.ready.then(function () {                  // ...run these steps:
    placeBall(ballState.section, ballState.spot, 'instant');   // re-place the ball,
    highlightedMenuItem = -1;                              // make the menu re-check,
    updateBackgroundAndMenu();                             // and refresh the colors.
  });                                                      // End of the font steps.
}                                                          // End of if.

const linkedProject = location.hash.slice(1);              // If the address ends with #dsff, this is "dsff".
if (PROJECTS[linkedProject]) openPopup(linkedProject, true);   // Open that project right away, for shared links.
if (QUICK_LOOKS[linkedProject]) openQuickLook(linkedProject, true);   // Same for Playground quick looks, like #graveyard.
