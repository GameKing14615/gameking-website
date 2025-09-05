let mountainSkyBG; // Variable to hold our background image
let cloudImgs = [];
let clouds = [];
let Man1;
let sheep1 = [];
function preload() {
    // Load your background image using the globally defined path from index.html
    mountainSkyBG = loadImage(PIXEL_BG_PATH);
    cloudImgs.push(loadImage('images/cloud_1.png'));
    cloudImgs.push(loadImage('images/cloud_2.png'));
    cloudImgs.push(loadImage('images/cloud_2.png'));
    cloudImgs.push(loadImage('images/cloud_3.png'));
    cloudImgs.push(loadImage('images/cloud_3.png'));
    cloudImgs.push(loadImage('images/cloud_4.png'));
    cloudImgs.push(loadImage('images/cloud_4.png'));
    Man1 = loadImage(man_waving);
    sheep1.push(loadImage(Sheep));
    sheep1.push(loadImage(Sheep));
    sheep1.push(loadImage(Sheep));
    sheep1.push(loadImage(Sheep));
    sheep1.push(loadImage(Sheep));
}

// p5.js setup function: runs once when the sketch starts
function setup() {
    let canvas = createCanvas(windowWidth, document.documentElement.scrollHeight); // Use full scrollable height
    canvas.position(0, 0);
    canvas.style('z-index', '-1');
    canvas.style('max-width', '100%');
    canvas.style('max-height', '100%');

    clouds = [
    { img: cloudImgs[0], x: 250, y: height * 0.15, speed: 0.02, offset: 0, scale: 0.05, name: 'Cloud 1' },
    { img: cloudImgs[0], x: 1200, y: height * 0.35, speed: 0.02, offset: 0, scale: 0.05, name: 'Cloud 8' },
    { img: cloudImgs[1], x: 500, y: height * 0.35, speed: 0.015, offset: 50, scale: 0.05, name: 'Cloud 2' },
    { img: cloudImgs[2], x: 150, y: height * 0.20, speed: 0.025, offset: 100, scale: 0.05, name: 'Cloud 3' },
    { img: cloudImgs[3], x: 1200, y: height * 0.15, speed: 0.018, offset: 150, scale: 0.05, name: 'Cloud 4' },
    { img: cloudImgs[4], x: 1000, y: height * 0.25, speed: 0.022, offset: 200, scale: 0.05, name: 'Cloud 5' },
    { img: cloudImgs[5], x: 250, y: height * 0.05, speed: 0.02, offset: 250, scale: 0.05, name: 'Cloud 6' },
    { img: cloudImgs[6], x: 1200, y: height * 0.10, speed: 0.017, offset: 300, scale: 0.05, name: 'Cloud 7'},
    ]
    

    Man1 = { img: Man1, x: 1200, y: height * 0.75, offset: 0, scale: 0.2, name: 'Man 1' }

    sheep1 = [
    { img: sheep1[0], x: 1400, y: 1500, scale: 0.3, name: 'Sheep 1' },
    { img: sheep1[1], x: 450, y: 1700, scale: 0.4, name: 'Sheep 2' },
    { img: sheep1[2], x: 1000, y: 1550, scale: 0.2, name: 'Sheep 3' },
    { img: sheep1[3], x: 800, y: 1800, scale: 0.35, flipX: true, name: 'Sheep 4'},
    { img: sheep1[4], x: 700, y: 1600, scale: 0.25, flipX: true, name: 'Sheep 5'},
    ]

    // NEW: Set a random starting frame for each sheep's GIF animation
    for (let i = 0; i < sheep1.length; i++) {
        let s = sheep1[i];
        if (s.img.numFrames() > 1) { // Check if it's an animated GIF
            s.img.setFrame(floor(random(s.img.numFrames())));
        }
    }
}

// p5.js draw function: runs continuously (like an animation loop)
function draw() {
    // Calculate aspect ratios to make the image cover the canvas without distortion.
    let imgAspect = mountainSkyBG.width / mountainSkyBG.height;
    let canvasAspect = width / height; 

    let drawWidth;
    let drawHeight;
    let offsetX = 0;
    let offsetY = 0;

    // Determine if image needs to be scaled by width or height to cover the canvas.
    if (canvasAspect > imgAspect) {
        // Canvas is wider than image aspect ratio, so fit by width
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetY = (height - drawHeight) / 2; // Center vertically
    } else {
        // Canvas is taller than image aspect ratio, so fit by height
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2; // Center horizontally
    }

    // Draw the image, covering the canvas while maintaining aspect ratio
    image(mountainSkyBG, offsetX, offsetY, drawWidth, drawHeight);

    // Draw clouds with animated vertical movement
    for (let i = 0; i < clouds.length; i++) {
        let c = clouds[i];
        let yOffset = sin(frameCount * c.speed + c.offset) * 10; // animated vertical movement
        image(c.img, c.x, c.y + yOffset, c.img.width * c.scale, c.img.height * c.scale); // Draw each cloud at its position
    }

    //man functionality
    image(Man1.img, Man1.x, Man1.y, Man1.img.width * Man1.scale, Man1.img.height * Man1.scale);
    
    // Draw sheep with optional flipping
    for (let i = 0; i < sheep1.length; i++) {
        let s = sheep1[i];
        if (s.flipX) {
        push();
        translate(s.x + (s.img.width * s.scale) / 2, s.y + (s.img.height * s.scale) / 2);
        scale(-1, 1);
        translate(-(s.x + (s.img.width * s.scale) / 2), -(s.y + (s.img.height * s.scale) / 2));
        image(s.img, s.x, s.y, s.img.width * s.scale, s.img.height * s.scale);
        pop();
        } else {
            image(s.img, s.x, s.y, s.img.width * s.scale, s.img.height * s.scale);
        }
    }

    // Show the name of the sheep when hovering over it
    // for (let i = 0; i < sheep1.length; i++) {
    //     let s = sheep1[i];
    //     if (dist(mouseX, mouseY, s.x + (s.img.width * s.scale) / 2, s.y + (s.img.height * s.scale) / 2) < (s.img.width * s.scale) / 2) {
    //         fill(0);
    //         noStroke();
    //         textAlign(CENTER, CENTER);
    //         textSize(24);
    //         // offset by half of the image width plus 10 pixels to the right
    //         text(s.name, s.x + (s.img.width * s.scale) / 2 + 2, s.y);
    //         }
    //     }
    }
// This function automatically runs when the browser window is resized
function windowResized() {
    resizeCanvas(windowWidth, document.documentElement.scrollHeight); // Update to full scrollable height
    // Recalculate image drawing if needed, but for now, the draw() function handles it
}
