let mountainSkyBG; // Variable to hold our background image
let cloudImgs = [];
let clouds = [];
let Man1;
let sheep1 = [];
let sceneWidth = 0;
let sceneHeight = 0;
let bgDraw = { w: 0, h: 0, x: 0, y: 0 };
let resizeTimer = null;
const SHEEP_FRAME_INTERVAL = 120;
const BACKGROUND_SCALE = 1.08;
let pointerPosition = { x: -1, y: -1 };

function getCanvasHeight() {
    const footer = document.querySelector('footer');
    if (footer) {
        return footer.getBoundingClientRect().bottom + window.scrollY;
    }
    return Math.max(document.documentElement.scrollHeight, windowHeight);
}

function recalculateBackgroundCover() {
    let imgAspect = mountainSkyBG.width / mountainSkyBG.height;
    let canvasAspect = sceneWidth / sceneHeight;

    if (canvasAspect > imgAspect) {
        bgDraw.w = sceneWidth;
        bgDraw.h = sceneWidth / imgAspect;
        bgDraw.x = 0;
        bgDraw.y = (sceneHeight - bgDraw.h) / 2;
    } else {
        bgDraw.h = sceneHeight;
        bgDraw.w = sceneHeight * imgAspect;
        bgDraw.x = (sceneWidth - bgDraw.w) / 2;
        bgDraw.y = 0;
    }

    bgDraw.w *= BACKGROUND_SCALE;
    bgDraw.h *= BACKGROUND_SCALE;
    bgDraw.x = (sceneWidth - bgDraw.w) / 2;
    const headerHeight = document.querySelector('header')?.getBoundingClientRect().height || 0;
    bgDraw.y = sceneHeight - bgDraw.h - headerHeight;
}

function syncSceneSize() {
    const nextHeight = getCanvasHeight();
    if (Math.abs(nextHeight - sceneHeight) < 1) {
        return;
    }
    sceneHeight = nextHeight;
    resizeCanvas(sceneWidth, sceneHeight);
    recalculateBackgroundCover();
}

function preload() {
    // Load your background image using the globally defined path from index.html
    mountainSkyBG = loadImage(PIXEL_BG_PATH);
    let cloud1 = loadImage('/static/images/cloud_1.png');
    let cloud2 = loadImage('/static/images/cloud_2.png');
    let cloud3 = loadImage('/static/images/cloud_3.png');
    let cloud4 = loadImage('/static/images/cloud_4.png');
    cloudImgs = [cloud1, cloud2, cloud2, cloud3, cloud3, cloud4, cloud4];
    Man1 = loadImage(man_waving);
    let sheepGif = loadImage(Sheep);
    sheep1 = [sheepGif, sheepGif, sheepGif, sheepGif, sheepGif];
}

// p5.js setup function: runs once when the sketch starts
function setup() {
    document.documentElement.classList.add('animation-ready');
    sceneWidth = document.documentElement.clientWidth;
    sceneHeight = getCanvasHeight();
    let canvas = createCanvas(sceneWidth, sceneHeight);
    canvas.parent('backgroundCanvas');
    window.addEventListener('mousemove', updatePointerPosition, { passive: true });

    clouds = [
    { img: cloudImgs[0], x: 0.10, y: 500, speed: 0.02, offset: 0, scale: 0.05, name: 'Cloud 1' },
    { img: cloudImgs[0], x: 0.80 + 7 / sceneWidth, y: 420, speed: 0.02, offset: 0, scale: 0.05, name: 'Cloud 8' },
    { img: cloudImgs[1], x: 0.36, y: 300, speed: 0.015, offset: 50, scale: 0.05, name: 'Cloud 2' },
    { img: cloudImgs[2], x: 0.05, y: 260, speed: 0.025, offset: 100, scale: 0.05, name: 'Cloud 3' },
    { img: cloudImgs[3], x: 0.7, y: 250, speed: 0.018, offset: 150, scale: 0.05, name: 'Cloud 4' },
    { img: cloudImgs[4], x: 0.58, y: 420, speed: 0.022, offset: 200, scale: 0.05, name: 'Cloud 5' },
    { img: cloudImgs[5], x: 0.2 - 10 / sceneWidth, y: 85, speed: 0.02, offset: 250, scale: 0.05, name: 'Cloud 6' },
    { img: cloudImgs[6], x: 0.7 - 10 / sceneWidth, y: 80, speed: 0.017, offset: 300, scale: 0.05, name: 'Cloud 7'},
    ];

    for (let i = 0; i < clouds.length; i++) {
        let c = clouds[i];
        c.x *= sceneWidth;
        c.w = c.img.width * c.scale;
        c.h = c.img.height * c.scale;
    }

    function updatePointerPosition(event) {
        const canvas = document.querySelector('#backgroundCanvas canvas');
        if (!canvas) {
            return;
        }

        const canvasBounds = canvas.getBoundingClientRect();
        pointerPosition = {
            x: event.clientX - canvasBounds.left,
            y: event.clientY - canvasBounds.top
        };
    }
    

    Man1 = { img: Man1, x: sceneWidth * 0.60, y: sceneHeight - 800, offset: 0, scale: 0.22, name: 'Man 1' };
    Man1.w = Man1.img.width * Man1.scale;
    Man1.h = Man1.img.height * Man1.scale;

    sheep1 = [
    { img: sheep1[0], x: sceneWidth * 0.80, y: sceneHeight - 500, scale: 0.370, name: 'Sheep 1' },
    { img: sheep1[1], x: sceneWidth * 0.35, y: sceneHeight - 470, scale: 0.40, name: 'Sheep 2' },
    { img: sheep1[2], x: sceneWidth * 0.90, y: sceneHeight - 800, scale: 0.20, name: 'Sheep 3' },
    { img: sheep1[3], x: sceneWidth * 0.08, y: sceneHeight - 390, scale: 0.40, flipX: true, name: 'Sheep 4'},
    { img: sheep1[4], x: sceneWidth * 0.30, y: sceneHeight - 600, scale: 0.28, flipX: true, name: 'Sheep 5'},
    ];

    for (let i = 0; i < sheep1.length; i++) {
        let s = sheep1[i];
        s.w = s.img.width * s.scale;
        s.h = s.img.height * s.scale;
        s.cx = s.x + s.w / 2;
        s.cy = s.y + s.h / 2;
        s.animationOffset = floor(random(s.img.numFrames()));
    }

    recalculateBackgroundCover();
    setTimeout(syncSceneSize, 0);
}

// p5.js draw function: runs continuously (like an animation loop)
function draw() {
    // Draw the image, covering the canvas while maintaining aspect ratio
    image(mountainSkyBG, bgDraw.x, bgDraw.y, bgDraw.w, bgDraw.h);

    // Draw clouds with animated vertical movement
    for (let i = 0; i < clouds.length; i++) {
        let c = clouds[i];
        let yOffset = sin(frameCount * c.speed + c.offset) * 10; // animated vertical movement
        image(c.img, c.x, c.y + yOffset, c.w, c.h);
        // Hover labels are disabled. Re-enable this block to show cloud names.
        // if (isPointerOverAsset(c.x, c.y + yOffset, c.w, c.h)) {
        //     hoveredAsset = { name: c.name, x: c.x + c.w / 2, y: c.y + yOffset };
        // }
    }

    //man functionality
    image(Man1.img, Man1.x, Man1.y, Man1.w, Man1.h);
    
    // Draw sheep with optional flipping
    for (let i = 0; i < sheep1.length; i++) {
        let s = sheep1[i];
        if (s.img.numFrames() > 1) {
            const animationFrame = floor(frameCount / SHEEP_FRAME_INTERVAL);
            s.img.setFrame((animationFrame + s.animationOffset) % s.img.numFrames());
        }
        if (s.flipX) {
        push();
        translate(s.cx, s.cy);
        scale(-1, 1);
        translate(-s.cx, -s.cy);
        image(s.img, s.x, s.y, s.w, s.h);
        pop();
        } else {
            image(s.img, s.x, s.y, s.w, s.h);
        }
        // Hover labels are disabled. Re-enable this block to show sheep names.
        // if (isPointerOverAsset(s.x, s.y, s.w, s.h)) {
        //     hoveredAsset = { name: s.name, x: s.x + s.w / 2, y: s.y };
        // }
    }

    // Hover labels are disabled.
    // if (hoveredAsset) {
    //     drawAssetLabel(hoveredAsset.name, hoveredAsset.x, hoveredAsset.y);
    // }

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

    function isPointerOverAsset(x, y, assetWidth, assetHeight) {
        return pointerPosition.x >= x &&
            pointerPosition.x <= x + assetWidth &&
            pointerPosition.y >= y &&
            pointerPosition.y <= y + assetHeight;
    }

    function drawAssetLabel(name, x, y) {
        push();
        textAlign(CENTER, BOTTOM);
        textSize(18);
        textStyle(BOLD);
        const horizontalPadding = 10;
        const verticalPadding = 6;
        const labelWidth = textWidth(name) + horizontalPadding * 2;
        const labelHeight = 28;
        const labelX = constrain(x - labelWidth / 2, 8, sceneWidth - labelWidth - 8);
        const labelY = max(y - labelHeight - 10, 8);

        fill(255, 253, 240, 240);
        stroke(255, 204, 0);
        strokeWeight(2);
        rect(labelX, labelY, labelWidth, labelHeight, 8);
        noStroke();
        fill(42, 42, 42);
        text(name, labelX + labelWidth / 2, labelY + labelHeight - verticalPadding);
        pop();
    }
// This function automatically runs when the browser window is resized
function windowResized() {
    if (resizeTimer) {
        clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(function () {
        sceneWidth = document.documentElement.clientWidth;
        syncSceneSize();
    }, 100);
}
