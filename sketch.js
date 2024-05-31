let circleDiameter;
let circles = []; // Array for big circles
let bgCircles = []; // Array for small red circles
let bgCircleAmount = 400;
//for audio
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
  var yoff = 0;
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
class bgCirclePattern {
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
    noStroke();
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

    // Draw frequency bands around r2
    this.drawFrequencyBands(x, y, r2);

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

  // Draw circular frequency bands 
  drawFrequencyBands(x, y, radius) {
    let spectrum = fft.analyze();
    //the distance between each frequency band segment in the circle
    let angleStep = TWO_PI / numBins;
    for (let i = 0; i < numBins; i++) {
      let angle = i * angleStep;
      let amp = spectrum[i];
      let bandRadius = map(amp, 0, 255, radius, radius * 1.5);
      let x1 = x + radius * cos(angle);
      let y1 = y + radius * sin(angle);
      let x2 = x + bandRadius * cos(angle);
      let y2 = y + bandRadius * sin(angle);

      // Create a gradient color from white to orange
      let r = map(i, 0, numBins, 255, 255);
      let g = map(i, 0, numBins, 255, 165);
      let b = map(i, 0, numBins, 255, 0);
      stroke(r, g, b);

      line(x1, y1, x2, y2);
    }
  }

  //creates an array of small circles that are placed randomly within a larger circle
  //This code was adapted from https://editor.p5js.org/slow_izzm/sketches/HyqLs-7AX */
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

  //check the samll circles are not overlaping with each other
  isValidPosition(newCircle, smallCircles, diameter) {
    for (let circle of smallCircles) {
      let distance = dist(newCircle.x, newCircle.y, circle.x, circle.y);
      if (distance < diameter) {
        return false;
      }
    }
    return true;
  }

  //draw random small circles inside biggest circle
  drawRandomSmallCircles() {
    let smallCircleDiameter = 10; 
    noStroke(); 
    for (let smallCircle of this.smallCircles) {
      fill(smallCircle.color);
      circle(smallCircle.x, smallCircle.y, smallCircleDiameter);
    }
  }

  updateRandomSmallCircles() {
    this.smallCircles = this.generateRandomSmallCircles();
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

  //Create a new instance of p5.FFT() object
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

  // Initialise circles with their respective positions
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

  // Create small background circles
  for (let i = 0; i < bgCircleAmount; i++) {
    let overlapping = true;
    let bgCircle;
    while (overlapping) {
      overlapping = false;
      bgCircle = new bgCirclePattern(random(width), random(height), random(0, 10));

  // Check for overlap with other background circles
  for (let other of bgCircles) {
    let d = dist(bgCircle.xPos, bgCircle.yPos, other.xPos, other.yPos);
      if (d < bgCircle.radius + other.radius) {
        overlapping = true;
        break;
      }
    }

      // Check for overlap with big circles
  for (let bigCircle of circles) {
    let d = dist(bgCircle.xPos, bgCircle.yPos, bigCircle.getX(), bigCircle.getY());
      if (d < bgCircle.radius + circleDiameter / 2 + 15) {
        overlapping = true;
        break;
      }
    }
  }
  bgCircles.push(bgCircle);
  }
}

function draw() {
  background(5, 89, 127);

  let rms = analyzer.getLevel();

  // Adjust circleDiameter dynamically based on rms
  let dynamicCircleDiameter = (windowHeight / 20) * 5.5 * (1 + rms);

  // draw wavy lines
  for (let t = 0; t < wavylineX.length; t++) {
    wavyLines(wavylineX[t], wavylineY[t], 5 + rms * 5, 244, 198, 226, rms);
  }

  // draw inner wavy lines
  for (let t = 0; t < wavylineX.length; t++) {
    wavyLines(wavylineX[t], wavylineY[t], 2 + rms * 2, 134, 198, 226, rms);
  }

  // Draw all small background circles
  for (let bgCircle of bgCircles) {
    bgCircle.display();
  }

  // Draw all big circles with dynamic circleDiameter
  for (let circle of circles) {
    circle.display(dynamicCircleDiameter);
  }
}

//play or pause the music
function play_pause() {
  if (song.isPlaying()) {
    song.stop();
  } else {
    song.loop();
  }
}

function windowResized() {
  resizeCanvas(windowHeight, windowHeight);
  circleDiameter = (windowHeight / 20) * 5.5;

  bgCircles = [];
  for (let i = 0; i < bgCircleAmount; i++) {
    let overlapping = true;
    let bgCircle;
    while (overlapping) {
      overlapping = false;
      bgCircle = new bgCirclePattern(random(width), random(height), random(0, 10));

      for (let other of bgCircles) {
        let d = dist(bgCircle.xPos, bgCircle.yPos, other.xPos, other.yPos);
        if (d < bgCircle.radius + other.radius) {
          overlapping = true;
          break;
        }
      }

      for (let bigCircle of circles) {
        let d = dist(bgCircle.xPos, bgCircle.yPos, bigCircle.getX(), bigCircle.getY());
        if (d < bgCircle.radius + circleDiameter / 2 + 15) {
          overlapping = true;
          break;
        }
      }
    }
    bgCircles.push(bgCircle);
  }

  for (let circle of circles) {
    circle.updateRandomSmallCircles();
  }

  draw();

  button.position((width - button.width) / 2, height - button.height - 2);
}