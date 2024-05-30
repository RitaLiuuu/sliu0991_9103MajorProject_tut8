let circleDiameter;
let circles = []; // Array for big circles
let bgCircles = []; // Array for all the small background circles
let bgCircleAmount = 400;

//audio
let song, analyzer;

function preload() {
  //audio file from freesound https://freesound.org/people/multitonbits/sounds/383935/?
  //licensed under the Creative Commons 0 License
  //let's load the sound file in preload
  song = loadSound('assets/backgroundmusic.mp3');
}

// arrays for the X and Y coordinates for the orange lines
let wavylineX = [2.8, 8.9, 14.9, 0.7, 6.8, 12.7, 19.2, -0.3, 5.8, 11.5, 17.4, 4.3, 10, 16];
let wavylineY = [2.7, 1, 0, 8.9, 7.7, 6.8, 4.2, 15.2, 13.5, 12.8, 10.5, 19.5, 18.5, 17];

// Predefined colors for the big circles
let circleColors = [
  [210, 266, 248],
  [250, 181, 37],
  [255, 231, 233],
  [237, 213, 148],
  [220, 255, 237],
  [252, 179, 138],
  [239, 174, 49],
  [197, 254, 254],
  [251, 222, 131],
  [255, 235, 245],
  [255, 249, 239],
  [255, 247, 248],
  [255, 208, 139],
  [253, 220, 62]
];

// function to create the lines in the background, adapted from https://editor.p5js.org/zygugi/sketches/BJHK3O_yM
function wavyLines(linesX, linesY, lineWeight, lineR, lineG, lineB) {
  noFill();
  stroke(lineR, lineG, lineB);
  strokeWeight(lineWeight);

  beginShape();
  var xoff = 0;
  var yoff = 0.0;
  let noiseY = 0.05;
  let radius = (windowHeight / 20) * 4.2;

  for (var a = 0; a < TWO_PI; a += 0.1) {
    var offset = map(noise(xoff, noiseY), 0, 1, -15, 5);
    var r = radius + offset;
    var x = (windowHeight/20)*linesX + 0.8*r * cos(a);
    var y = (windowHeight/20)*linesY + 0.8*r * sin(a);
    vertex(x, y);
    xoff += 0.5;
  }
  endShape();
}

// Class for small random background circles
class BgCirclePattern {
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
  constructor(xFactor, yFactor, color) {
    this.xFactor = xFactor;
    this.yFactor = yFactor;
    this.smallCircles = this.generateRandomSmallCircles();
    this.colour = color;
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

  display() {
    fill(this.colour);
    let x = this.xFactor * windowHeight / 20;
    let y = this.yFactor * windowHeight / 20;
    circle(x, y, circleDiameter);

    // draw random small circles
    this.drawRandomSmallCircles();

    // draw nested circles
    this.drawNestedCircles(x, y);
  }

  drawNestedCircles(x, y) {
    // second circle
    let r2 = windowHeight / 20 * 1.5;
    fill(this.r2Color);
    circle(x, y, r2 * 2);

    let r3 = windowHeight / 20 * 1.35;
    fill(this.r3Color);
    circle(x, y, r3 * 2);

    // Additional rings between r3 and r4
    let r4 = windowHeight / 20 * 0.5;
    let ringRadii = [ // Radius of each circle between first circle 3 and circle 4
      windowHeight / 20 * 1.2,
      windowHeight / 20 * 1.0,
      windowHeight / 20 * 0.8,
      windowHeight / 20 * 0.6,
      windowHeight / 20 * 0.4
    ];
    for (let i = 0; i < ringRadii.length; i++) {
      fill(this.additionalRingColors[i]); // Achieve different color fills by calling the data in the array
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
  circleDiameter = (windowHeight / 20) * 5.5;

  // create a new Amplitude analyzer, this will analyze the volume of the song
  analyzer = new p5.Amplitude();

  // Connect the input of the analyzer to the song
  analyzer.setInput(song);

  //Add a button for play/pause
  let button = createButton('Play/Pause');

  //set the position of the button to the bottom center
  button.position((width - button.width) / 2, height - button.height - 2);

  button.mousePressed(play_pause);

  // Initialize circles with their respective positions and colors
  for (let i = 0; i < wavylineX.length; i++) {
    circles.push(new CirclePattern(wavylineX[i], wavylineY[i], circleColors[i]));
  }

  // Create small background circles
  for (let i = 0; i < bgCircleAmount; i++) {
    let overlapping = true;
    let bgCircle;
    while (overlapping) {
      overlapping = false;
      bgCircle = new BgCirclePattern(random(width), random(height), random(0, 10));

      // Check for overlap with other small background circles
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

  // draw lines
  for (let t = 0; t < wavylineX.length; t++) {
    wavyLines(wavylineX[t], wavylineY[t], 10 + rms * 5, 244, 198, 226);
  }

  // draw inner lines
  for (let t = 0; t < wavylineX.length; t++) {
    wavyLines(wavylineX[t], wavylineY[t], 5 + rms * 2, 134, 198, 226);
  }

  // Draw all small background circles
  for (let bgCircle of bgCircles) {
    bgCircle.display();
  }

  // Draw all big circles
  for (let circle of circles) {
    circle.display();
  }
}

function play_pause() {
  if (song.isPlaying()) {
    song.stop();
  } else {
    //we can use song.play() here if we want the song to play once
    //In this case, we want the song to loop, so we call song.loop()
    song.loop();
  }
}

function windowResized() {
  resizeCanvas(windowHeight, windowHeight);
  circleDiameter = (windowHeight / 20) * 5.5; // Recalculate circleDiameter after resize
  draw(); // Redraw circles to reflect the new dimensions
}