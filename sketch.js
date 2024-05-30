let circleDiameter;
let circles = []; // Array for big circles
let redCircles = []; // Array for small red circles
let redCircleAmount = 400;
let song, analyzer;
let fft;
let numBins = 128;
let smoothing = 0.8;
let button;

function preload() {
  //audio file from freesound https://uppbeat.io/browse/music/hip-hop-beats
  song = loadSound('assets/backgroundmusic.mp3');
}

// arrays for the X and Y coordinates for the orange lines
let wavylineX = [2.8, 8.9, 14.9, 0.7, 6.8, 12.7, 19.2, -0.3, 5.8, 11.5, 17.4, 4.3, 10, 16];
let wavylineY = [2.7, 1, 0, 8.9, 7.7, 6.8, 4.2, 15.2, 13.5, 12.8, 10.5, 19.5, 18.5, 17];

// function to create the lines in the background, adapted from https://editor.p5js.org/zygugi/sketches/BJHK3O_yM
function wavyLines(linesX, linesY, lineWeight, lineR, lineG, lineB, rms) {
  // styling for the lines
  noFill();
  stroke(lineR, lineG, lineB);
  strokeWeight(lineWeight);

  beginShape();

  // variables that change the noise level for the lines
  var xoff = 0;
  var yoff = 0.0;
  let noiseY = 0.05;
  let radius = (windowHeight / 20) * 4.2 * (1 + rms); // Dynamic radius based on rms

  // loop that creates the lines
  for (var a = 0; a < TWO_PI; a += 0.1) {
    var offset = map(noise(xoff, noiseY), 0, 1, -15, 5) * (1 + rms);
    var r = radius + offset;
    var x = (windowHeight / 20) * linesX + 0.8 * r * cos(a);
    var y = (windowHeight / 20) * linesY + 0.8 * r * sin(a);
    vertex(x, y);
    xoff += 0.5;
  }
  endShape();
}

// Class for small random red circles
class RedCirclePattern {
  constructor(xPos, yPos, radius) {
    this.xPos = xPos;
    this.yPos = yPos;
    this.radius = radius;
  }

  display() {
    fill(230, 101, 18);
    noStroke();
    circle(this.xPos, this.yPos, this.radius * 2);
  }
}

// Class for the biggest Circle Pattern
class CirclePattern {
  constructor(xFactor, yFactor) {
    this.xFactor = xFactor;
    this.yFactor = yFactor;
    this.smallCircles = this.generateRandomSmallCircles();
    this.colour = [random(0, 255), random(0, 255), random(0, 255)];
    // Generate random colors for nested circles
    this.r2Color = [random(0, 255), random(0, 255), random(0, 255)];
    this.r3Color = [random(0, 255), random(0, 255), random(0, 255)];
    this.r4Color = [random(0, 255), random(0, 255), random(0, 255)];

    // Generate random colors for additional rings
    this.additionalRingColors = []; // Array for storing colors
    for (let i = 0; i < 5; i++) {
      this.additionalRingColors.push([random(0, 255), random(0, 255), random(0, 255)]);
    }
  }

  display(diameter) {
    fill(this.colour);
    let x = this.xFactor * windowHeight / 20;
    let y = this.yFactor * windowHeight / 20;
    circle(x, y, diameter);

    // draw random small circles
    this.drawRandomSmallCircles();

    // draw nested circles
    this.drawNestedCircles(x, y, diameter);
  }

  drawNestedCircles(x, y, diameter) {
    // Calculate dynamic radii based on the provided diameter
    let dynamicScale = diameter / circleDiameter;
    let r2 = windowHeight / 20 * 1.5 * dynamicScale;
    let r3 = windowHeight / 20 * 1.35 * dynamicScale;
    let r4 = windowHeight / 20 * 0.5 * dynamicScale;

    fill(this.r2Color);
    circle(x, y, r2 * 2);

    fill(this.r3Color);
    circle(x, y, r3 * 2);

    // Additional rings between r3 and r4
    let ringRadii = [
      windowHeight / 20 * 1.2 * dynamicScale,
      windowHeight / 20 * 1.0 * dynamicScale,
      windowHeight / 20 * 0.8 * dynamicScale,
      windowHeight / 20 * 0.6 * dynamicScale,
      windowHeight / 20 * 0.4 * dynamicScale
    ];
    for (let i = 0; i < ringRadii.length; i++) {
      fill(this.additionalRingColors[i]);
      circle(x, y, ringRadii[i] * 2);
    }
  }

  generateRandomSmallCircles() {
    let smallCircles = [];
    let x = this.xFactor * windowHeight / 20;
    let y = this.yFactor * windowHeight / 20;
    let radius = circleDiameter / 2;
    let smallCircleDiameter = 10; // Smaller diameter
    let maxAttempts = 10000;
    let attempts = 0;

    while (smallCircles.length < 100 && attempts < maxAttempts) {
      let angle = random(TWO_PI);
      let distance = random(radius - smallCircleDiameter / 2);
      let randX = x + distance * cos(angle);
      let randY = y + distance * sin(angle);
      let randColor = color(random(255), random(255), random(255));
      let newCircle = { x: randX, y: randY, color: randColor };

      if (this.isValidPosition(newCircle, smallCircles, smallCircleDiameter)) {
        smallCircles.push(newCircle);
      }

      attempts++;
    }

    return smallCircles;
  }

  isValidPosition(newCircle, smallCircles, diameter) {
    for (let circle of smallCircles) {
      let distance = dist(newCircle.x, newCircle.y, circle.x, circle.y);
      if (distance < diameter) {
        return false;
      }
    }
    return true;
  }

  drawRandomSmallCircles() {
    let smallCircleDiameter = 10; // Smaller size of small circles
    noStroke(); // Remove stroke
    for (let smallCircle of this.smallCircles) {
      fill(smallCircle.color);
      circle(smallCircle.x, smallCircle.y, smallCircleDiameter);
    }
  }

  getX() {
    return this.xFactor * windowHeight / 20;
  }

  getY() {
    return this.yFactor * windowHeight / 20;
  }
}

function setup() {
  createCanvas(windowHeight, windowHeight);
  background(5, 89, 127);

  fft = new p5.FFT(smoothing, numBins);
  song.connect(fft);

  // create a new Amplitude analyzer, this will analyze the volume of the song
  analyzer = new p5.Amplitude();
  analyzer.setInput(song);

  // Add a button for play/pause
  button = createButton("Play/Pause");
  button.position((width - button.width) / 2, height - button.height - 2);
  button.mousePressed(play_pause);

  circleDiameter = (windowHeight / 20) * 5.5;

  // Initialize circles with their respective positions
  circles.push(new CirclePattern(2.8, 2.7));
  circles.push(new CirclePattern(8.9, 1));
  circles.push(new CirclePattern(14.9, 0));
  circles.push(new CirclePattern(0.7, 8.9));
  circles.push(new CirclePattern(6.8, 7.7));
  circles.push(new CirclePattern(12.7, 6.8));
  circles.push(new CirclePattern(19.2, 4.2));
  circles.push(new CirclePattern(-0.3, 15.2));
  circles.push(new CirclePattern(5.8, 13.5));
  circles.push(new CirclePattern(11.5, 12.8));
  circles.push(new CirclePattern(17.4, 10.5));
  circles.push(new CirclePattern(4.3, 19.5));
  circles.push(new CirclePattern(10, 18.5));
  circles.push(new CirclePattern(16, 17));

  // Create small red circles
  for (let i = 0; i < redCircleAmount; i++) {
    let overlapping = true;
    let redCircle;
    while (overlapping) {
      overlapping = false;
      redCircle = new RedCirclePattern(random(width), random(height), random(0, 10));

      // Check for overlap with other small red circles
      for (let other of redCircles) {
        let d = dist(redCircle.xPos, redCircle.yPos, other.xPos, other.yPos);
        if (d < redCircle.radius + other.radius) {
          overlapping = true;
          break;
        }
      }

      // Check for overlap with big circles
      for (let bigCircle of circles) {
        let d = dist(redCircle.xPos, redCircle.yPos, bigCircle.getX(), bigCircle.getY());
        if (d < redCircle.radius + circleDiameter / 2 + 15) {
          overlapping = true;
          break;
        }
      }
    }
    redCircles.push(redCircle);
  }
}

function draw() {
  background(5, 89, 127);

  let rms = analyzer.getLevel();

  // Adjust circleDiameter dynamically based on rms
  let dynamicCircleDiameter = (windowHeight / 20) * 5.5 * (1 + rms);

  // draw lines
  for (let t = 0; t < wavylineX.length; t++) {
    wavyLines(wavylineX[t], wavylineY[t], 5 + rms * 5, 244, 198, 226, rms);
  }

  // draw inner lines
  for (let t = 0; t < wavylineX.length; t++) {
    wavyLines(wavylineX[t], wavylineY[t], 2 + rms * 2, 134, 198, 226, rms);
  }

  // Draw all small red circles
  for (let redCircle of redCircles) {
    redCircle.display();
  }

  // Draw all big circles with dynamic circleDiameter
  for (let circle of circles) {
    circle.display(dynamicCircleDiameter);
  }
}

function play_pause() {
  if (song.isPlaying()) {
    song.stop();
  } else {
    song.loop();
  }
}

function windowResized() {
  resizeCanvas(windowHeight, windowHeight);
  circleDiameter = (windowHeight / 20) * 5.5; // Recalculate circleDiameter after resize
  draw(); // Redraw circles to reflect the new dimensions
}