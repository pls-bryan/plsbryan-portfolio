// Array to store all the falling circles
let secondsCircles = [];
let minuteCircles = [];
let hourCircles = [];
let lastSecond = -1; // Track when we last created a circle
let lastMinute = -1; // Track when we last created a minute circle
let lastHour = -1; // Track when we last created an hour circle

// Device orientation for gravity direction
let gravityAngle = Math.PI / 2; // Default: gravity points down (90 degrees)
let gyroSupported = false;

// Initialize device orientation listener
function initGyroscope() {
    // Check if DeviceOrientationEvent is supported
    if (typeof DeviceOrientationEvent !== 'undefined') {
        // iOS 13+ requires permission request
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // We'll request permission on first user interaction
            gyroSupported = 'needs-permission';
        } else {
            // Android and older iOS - just add the listener
            window.addEventListener('deviceorientation', handleOrientation);
            gyroSupported = true;
        }
    }
}

// Request permission for iOS devices (must be called from user gesture)
function requestGyroPermission() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                    gyroSupported = true;
                }
            })
            .catch(console.error);
    }
}

// Handle device orientation changes
function handleOrientation(event) {
    // beta: front-to-back tilt (-180 to 180), gamma: left-to-right tilt (-90 to 90)
    let beta = event.beta || 0;   // Forward/back tilt
    let gamma = event.gamma || 0; // Left/right tilt
    
    // Convert device tilt to gravity angle
    // When phone is upright (portrait), beta ~90, gamma ~0
    // We want gravity to point "down" relative to device tilt
    
    // Clamp gamma to prevent extreme values
    gamma = Math.max(-90, Math.min(90, gamma));
    
    // Convert to radians and calculate gravity direction
    // gamma controls left/right gravity, beta controls if phone is tilted forward/back
    let gammaRad = gamma * (Math.PI / 180);
    let betaRad = beta * (Math.PI / 180);
    
    // Calculate gravity vector components
    // When phone tilts right (gamma > 0), gravity should pull right
    // When phone tilts forward (beta > 0 from upright 90°), gravity pulls down more
    let gravityX = Math.sin(gammaRad);
    let gravityY = Math.cos(gammaRad) * Math.sin(betaRad);
    
    // Normalize and clamp for stability
    let magnitude = Math.sqrt(gravityX * gravityX + gravityY * gravityY);
    if (magnitude > 0.1) {
        gravityAngle = Math.atan2(gravityY, gravityX);
    }
}
let second_inner_scale = 15;
let second_outer_scale = 12;
let minute_inner_scale = 20/3;
let minute_outer_scale = 6;
let hour_inner_scale = 1200/301;  // 7.5% larger radius, same thickness
let hour_outer_scale = 400/107;
let clearing = { second: false, minute: false, hour: false }; 
let already_spawned = { second: false, minute: false, hour: false }; // Track if circles are being cleared
let rings = []; // Array to store all ring dimensions for collision detection
let already_cleared = false;
// Toolbar state
let showNumbers = false;
let darkMode = null; // null = auto (follows AM/PM), true = dark, false = light
let currentBg = 225; // Current background value for smooth transitions
let targetBg = 225;  // Target background value
let bgTransitionSpeed = 0.02; // ~1 second transition (60 frames * 0.02 ≈ 1.2s)

// Function to calculate donut dimensions without drawing
function getDonutDims(outerScale, innerScale) {
    let donutX = windowWidth / 2;
    let donutY = windowHeight / 2;
    let outerRadius = windowWidth / outerScale;
    let innerRadius = windowWidth / innerScale;
    let ringThickness = outerRadius - innerRadius;
    return { donutX, donutY, outerRadius, innerRadius, ringThickness };
}

// Register a ring for collision detection (call before update loop)
function registerRing(outerScale, innerScale) {
    rings.push(getDonutDims(outerScale, innerScale));
}

// Clear all registered rings (call at start of each frame)
function clearRings() {
    rings = [];
}

// Circle class for falling particles
class Circle {
    constructor(x, y, innerScale = second_inner_scale, colors = [100, 150, 200], gravityMultiplier = 1.0) {
        this.x = x;
        this.y = y;
        this.innerScale = innerScale; // Store scale to compute radius dynamically
        this.velocityY = 0;
        this.velocityX = 0;
        this.friction = 0.98;
        this.bounce = 0.75;
        this.colors = colors;
        this.gravityMultiplier = gravityMultiplier;
    }
    
    // Compute radius dynamically based on current window size
    getRadius() {
        return (windowWidth / this.innerScale) / 12;
    }
    
    // Scale gravity based on window size (prevents tunneling at small sizes)
    getGravity() {
        return windowWidth * 0.0003 * this.gravityMultiplier;
    }
    
    // Max velocity to prevent tunneling through thin rings
    getMaxVelocity() {
        return this.getRadius() * 0.8;
    }
    
    update(circleArray) {
        // 1. Apply gravity based on device orientation
        let gravity = this.getGravity();
        this.velocityX += Math.cos(gravityAngle) * gravity;
        this.velocityY += Math.sin(gravityAngle) * gravity;
        
        // Cap velocity to prevent tunneling
        let maxVel = this.getMaxVelocity();
        this.velocityY = constrain(this.velocityY, -maxVel * 3, maxVel * 3);
        this.velocityX = constrain(this.velocityX, -maxVel * 3, maxVel * 3);
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        this.checkArcCollision();
        this.checkCircleCollision(circleArray);
        
        // Check collision with all screen edges
        let radius = this.getRadius();
        
        // Bottom edge
        if (this.y + radius > windowHeight) {
            this.y = windowHeight - radius;
            this.velocityY *= -this.bounce;
            this.velocityX *= this.friction;
            if (abs(this.velocityY) < 0.5) this.velocityY = 0;
        }
        
        // Top edge
        if (this.y - radius < 0) {
            this.y = radius;
            this.velocityY *= -this.bounce;
            this.velocityX *= this.friction;
            if (abs(this.velocityY) < 0.5) this.velocityY = 0;
        }
        
        // Right edge
        if (this.x + radius > windowWidth) {
            this.x = windowWidth - radius;
            this.velocityX *= -this.bounce;
            this.velocityY *= this.friction;
            if (abs(this.velocityX) < 0.5) this.velocityX = 0;
        }
        
        // Left edge
        if (this.x - radius < 0) {
            this.x = radius;
            this.velocityX *= -this.bounce;
            this.velocityY *= this.friction;
            if (abs(this.velocityX) < 0.5) this.velocityX = 0;
        }
    }
    
    

    checkCircleCollision(circleArray) {
        let radius = this.getRadius();
        for (let i = 0; i < circleArray.length; i++) {
            let other = circleArray[i];
            if (other !== this) {
                let otherRadius = other.getRadius();
                let d = dist(this.x, this.y, other.x, other.y);
                let minDist = radius + otherRadius;
                
                // Prevent division by zero
                if (d < minDist && d > 0) {
                    // Calculate normal vector (pointing from this to other)
                    let normalX = (other.x - this.x) / d;
                    let normalY = (other.y - this.y) / d;
                    
                    // Position correction - push BOTH particles out equally (like template)
                    let overlap = minDist - d;
                    this.x -= normalX * overlap * 0.5;
                    this.y -= normalY * overlap * 0.5;
                    other.x += normalX * overlap * 0.5;
                    other.y += normalY * overlap * 0.5;
                    
                    // Calculate relative velocity (other - this, like template)
                    let vDiffX = other.velocityX - this.velocityX;
                    let vDiffY = other.velocityY - this.velocityY;
                    
                    // Dot product of velocity difference with normal
                    let num = vDiffX * normalX + vDiffY * normalY;
                    
                    // Only react if particles are approaching (num < 0 means moving toward each other)
                    if (num < 0) {
                        // For equal mass, momentum exchange simplifies
                        // Each particle gets velocity change along normal axis
                        // Include bounce coefficient for energy loss
                        let impulse = num * (1 + this.bounce) * 0.5;
                        
                        this.velocityX += impulse * normalX;
                        this.velocityY += impulse * normalY;
                        other.velocityX -= impulse * normalX;
                        other.velocityY -= impulse * normalY;
                    }
                }
            }
        }
    }
    checkArcCollision() {
        let radius = this.getRadius();
        // Loop through all registered rings
        for (let ring of rings) {
            let { donutX, donutY, outerRadius, innerRadius } = ring;
            
            // Distance from circle center to donut center
            let distToCenter = dist(this.x, this.y, donutX, donutY);
            
            // Prevent division by zero
            if (distToCenter === 0) continue;
            
            // Calculate normal vector (pointing outward from center)
            let normalX = (this.x - donutX) / distToCenter;
            let normalY = (this.y - donutY) / distToCenter;
            
            // Check inner edge collision (ball touching inner wall from inside the hollow center)
            if (distToCenter > innerRadius - radius && distToCenter < innerRadius + radius) {
                // Position correction - keep ball inside the hollow center
                this.x = donutX + normalX * (innerRadius - radius);
                this.y = donutY + normalY * (innerRadius - radius);
                
                // Calculate velocity component into the surface
                let velIntoSurface = this.velocityX * normalX + this.velocityY * normalY;
                
                // Only bounce if moving outward toward inner wall
                if (velIntoSurface > 0) {
                    this.velocityX -= velIntoSurface * normalX * (1 + this.bounce);
                    this.velocityY -= velIntoSurface * normalY * (1 + this.bounce);
                }
            }
            
            // Check outer edge collision (ball hitting outer wall from OUTSIDE the arc)
            if (distToCenter < outerRadius + radius && distToCenter > outerRadius - radius) {
                // Position correction - keep ball OUTSIDE the arc
                this.x = donutX + normalX * (outerRadius + radius);
                this.y = donutY + normalY * (outerRadius + radius);
                
                // Calculate velocity component into the surface
                let velIntoSurface = this.velocityX * normalX + this.velocityY * normalY;
                
                // Only bounce if moving inward toward wall
                if (velIntoSurface < 0) {
                    this.velocityX -= velIntoSurface * normalX * (1 + this.bounce);
                    this.velocityY -= velIntoSurface * normalY * (1 + this.bounce);
                }
            }
        }
    }
    display() {
        fill(this.colors[0], this.colors[1], this.colors[2]);
        noStroke();
        ellipse(this.x, this.y, this.getRadius() * 2);
    }
}

// setup() is called once at page-load
function setup() {
    createCanvas(windowWidth, windowHeight); // make an HTML canvas element that fills the viewport
    
    // Initialize gyroscope for tilt-based gravity
    initGyroscope();
    
    // Spawn circles based on current second (continuous through reload)
    let currentSecond = 0;
    let currentMinute = 0;
    let currentHour = 0; // Use 12-hour format for hours
    let donutX = windowWidth / 2;
    let donutY = windowHeight / 2;
    let secondInnerRadius = windowWidth / second_inner_scale;
    let secondOuterRadius = windowWidth / second_outer_scale;
    let minuteInnerRadius = windowWidth / minute_inner_scale;
    let minuteOuterRadius = windowWidth / minute_outer_scale;
    let hourInnerRadius = windowWidth / hour_inner_scale;

    // Spawn seconds along arc inside seconds ring
    let secondArcRadius = secondInnerRadius / 2;
    for (let i = 0; i < currentSecond; i++) {
        let angle = random(TWO_PI);
        let spawnX = donutX + cos(angle) * secondArcRadius;
        let spawnY = donutY + sin(angle) * secondArcRadius;
        secondsCircles.push(new Circle(spawnX, spawnY, second_inner_scale, [100, 150, 200], 1.0));
    }
    
    // Spawn minutes along arc between second's outer and minute's inner radius
    let minuteArcRadius = (secondOuterRadius + minuteInnerRadius) / 2;
    for (let i = 0; i < currentMinute; i++) {
        let angle = random(TWO_PI);
        let spawnX = donutX + cos(angle) * minuteArcRadius;
        let spawnY = donutY + sin(angle) * minuteArcRadius;
        minuteCircles.push(new Circle(spawnX, spawnY, minute_inner_scale, [200, 100, 100], 0.55));
    }
    
    // Spawn hours along arc between minute's outer and hour's inner radius
    let hourArcRadius = (minuteOuterRadius + hourInnerRadius) / 2;
    for (let i = 0; i < currentHour; i++) {
        let angle = random(TWO_PI);
        let spawnX = donutX + cos(angle) * hourArcRadius;
        let spawnY = donutY + sin(angle) * hourArcRadius;
        hourCircles.push(new Circle(spawnX, spawnY, hour_inner_scale, [255, 200, 0], 0.9));
    }
    
    // Set lastSecond so we don't double-spawn the current second
    lastSecond = currentSecond;
    lastMinute = currentMinute;
    lastHour = currentHour;
}

// windowResized() is called automatically when the window is resized
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    location.reload();
}

// Function to shoot circles up and clear them after delay
function startClearAnimation(type) {
    // Get the right array and clearing flag based on type
    let circleArray;
    if (type === 'second') circleArray = secondsCircles;
    else if (type === 'minute') circleArray = minuteCircles;
    else if (type === 'hour') circleArray = hourCircles;
    else return;
    
    if (!clearing[type] && circleArray.length > 0) {
        clearing[type] = true;
        
        // Shoot all circles upward
        for (let i = 0; i < circleArray.length; i++) {
            circleArray[i].velocityY = -circleArray[i].getRadius() * 0.5; // Shoot up (scaled)
            circleArray[i].gravityMultiplier = 0.25; // Reduced gravity so they float up
        }
        
        // Clear the array after delay
        setTimeout(() => {
            if (type === 'second') secondsCircles = [];
            else if (type === 'minute') minuteCircles = [];
            else if (type === 'hour') hourCircles = [];
            clearing[type] = false;
        }, 100);
    }
}

// Function to boost circles upward without despawning (fun interaction)
function boostCircles(type) {
    let circleArray;
    if (type === 'second') circleArray = secondsCircles;
    else if (type === 'minute') circleArray = minuteCircles;
    else if (type === 'hour') circleArray = hourCircles;
    else return;
    
    for (let i = 0; i < circleArray.length; i++) {
        circleArray[i].velocityY = -circleArray[i].getRadius() * 0.5; // Boost up
        circleArray[i].gravityMultiplier = 0.4; // Temporary reduced gravity
    }
    
    // Restore normal gravity after a moment
    setTimeout(() => {
        for (let i = 0; i < circleArray.length; i++) {
            // Restore to original gravity based on type
            if (type === 'second') circleArray[i].gravityMultiplier = 1.0;
            else if (type === 'minute') circleArray[i].gravityMultiplier = 0.55;
            else if (type === 'hour') circleArray[i].gravityMultiplier = 0.9;
        }
    }, 500);
}

// Track number key presses for debug spawning
let keyHeld = 0; // 0 = none, 1 = seconds, 2 = minutes, 3 = hours

function keyPressed() {
    // Tab key - reload page
    if (keyCode === 9) { // Tab
        location.reload();
        return false; // Prevent default tab behavior
    }
    
    // Space key - PARTY! Boost all circles
    if (keyCode === 32) { // Space
        boostCircles('second');
        boostCircles('minute');
        boostCircles('hour');
        return false; // Prevent page scroll
    }
    
    // Use keyCode for number keys (49=1, 50=2, 51=3) to work with shift held
    let isKey1 = keyCode === 49;
    let isKey2 = keyCode === 50;
    let isKey3 = keyCode === 51;
    
    // Shift + number keys for clearing specific circle types
    if (keyIsDown(SHIFT)) {
        if (isKey1) startClearAnimation('second');
        if (isKey2) startClearAnimation('minute');
        if (isKey3) startClearAnimation('hour');
    } else {
        // Number keys 1, 2, 3 - boost circles and enable spawn mode
        if (isKey1) { boostCircles('second'); keyHeld = 1; }
        if (isKey2) { boostCircles('minute'); keyHeld = 2; }
        if (isKey3) { boostCircles('hour'); keyHeld = 3; }
    }
}

function keyReleased() {
    // keyCode 49=1, 50=2, 51=3
    if (keyCode === 49 || keyCode === 50 || keyCode === 51) {
        keyHeld = 0;
    }
}

// Touch handler for mobile devices
function touchStarted() {
    // Request gyroscope permission on iOS (requires user gesture)
    if (gyroSupported === 'needs-permission') {
        requestGyroPermission();
    }
    return true; // Prevent default
}

// Spawn circle on click while holding 1, 2, or 3
function mousePressed() {
    // Request gyroscope permission on iOS (requires user gesture)
    if (gyroSupported === 'needs-permission') {
        requestGyroPermission();
    }
    
    // Check toolbar clicks first
    if (handleToolbarClick(mouseX, mouseY)) {
        return; // Click was handled by toolbar
    }
    
    // Otherwise handle key+click spawning
    if (keyHeld === 1) {
        let dims = getDonutDims(second_outer_scale, second_inner_scale);
        let spawnX = windowWidth / 2 + random(-dims.innerRadius * 0.25, dims.innerRadius * 0.25);
        let spawnY = dims.donutY - random(dims.innerRadius * 0.5, dims.innerRadius * 0.75);
        secondsCircles.push(new Circle(spawnX, spawnY, second_inner_scale, [100, 150, 200], 1.0));
    } else if (keyHeld === 2) {
        let dims = getDonutDims(minute_outer_scale, minute_inner_scale);
        let spawnX = windowWidth / 2 + random(-dims.innerRadius * 0.25, dims.innerRadius * 0.25);
        let spawnY = dims.donutY - random(dims.innerRadius * 0.75, dims.innerRadius * 0.9);
        minuteCircles.push(new Circle(spawnX, spawnY, minute_inner_scale, [200, 100, 100], 0.55));
    } else if (keyHeld === 3) {
        let dims = getDonutDims(hour_outer_scale, hour_inner_scale);
        let spawnX = windowWidth / 2 + random(-dims.innerRadius * 0.25, dims.innerRadius * 0.25);
        let spawnY = dims.donutY - random(dims.innerRadius * 0.75, dims.innerRadius * 0.9);
        hourCircles.push(new Circle(spawnX, spawnY, hour_inner_scale, [255, 200, 0], 0.9));
    }
}

// Function to draw a donut arc with specified scales
function drawDonut(outerScale, innerScale, r = 100, g = 150, b = 200) {
    let donutX = windowWidth / 2;
    let donutY = windowHeight / 2;
    let outerRadius = windowWidth / outerScale;
    let innerRadius = windowWidth / innerScale;
    let ringThickness = outerRadius - innerRadius;
    
    push();
    noFill();
    stroke(r, g, b);
    strokeWeight(ringThickness);
    arc(donutX, donutY, (outerRadius + innerRadius), (outerRadius + innerRadius), 0, TWO_PI);
    pop();
    
    return { donutX, donutY, outerRadius, innerRadius, ringThickness };
}

// Reset clock to current time without reloading
function resetClock() {
    // Clear all circles
    secondsCircles = [];
    minuteCircles = [];
    hourCircles = [];
    
    // Respawn based on current time
    let currentSecond = 0;
    let currentMinute = 0;
    let currentHour = 0;
    let donutX = windowWidth / 2;
    let donutY = windowHeight / 2;
    let secondInnerRadius = windowWidth / second_inner_scale;
    let secondOuterRadius = windowWidth / second_outer_scale;
    let minuteInnerRadius = windowWidth / minute_inner_scale;
    let minuteOuterRadius = windowWidth / minute_outer_scale;
    let hourInnerRadius = windowWidth / hour_inner_scale;
    
    // Spawn seconds along arc inside seconds ring
    let secondArcRadius = secondInnerRadius / 2;
    for (let i = 0; i < currentSecond; i++) {
        let angle = random(TWO_PI);
        let spawnX = donutX + cos(angle) * secondArcRadius;
        let spawnY = donutY + sin(angle) * secondArcRadius;
        secondsCircles.push(new Circle(spawnX, spawnY, second_inner_scale, [100, 150, 200], 1.0));
    }
    
    // Spawn minutes along arc
    let minuteArcRadius = (secondOuterRadius + minuteInnerRadius) / 2;
    for (let i = 0; i < currentMinute; i++) {
        let angle = random(TWO_PI);
        let spawnX = donutX + cos(angle) * minuteArcRadius;
        let spawnY = donutY + sin(angle) * minuteArcRadius;
        minuteCircles.push(new Circle(spawnX, spawnY, minute_inner_scale, [200, 100, 100], 0.55));
    }
    
    // Spawn hours along arc
    let hourArcRadius = (minuteOuterRadius + hourInnerRadius) / 2;
    for (let i = 0; i < currentHour; i++) {
        let angle = random(TWO_PI);
        let spawnX = donutX + cos(angle) * hourArcRadius;
        let spawnY = donutY + sin(angle) * hourArcRadius;
        hourCircles.push(new Circle(spawnX, spawnY, hour_inner_scale, [255, 200, 0], 0.9));
    }
    
    // Reset tracking
    lastSecond = currentSecond;
    lastMinute = currentMinute;
    lastHour = currentHour;
    clearing = { second: false, minute: false, hour: false };
}

// Draw gravity direction indicator in corner
function drawGravityIndicator() {
    let indicatorX = 50;
    let indicatorY = windowHeight - 50;
    let arrowLength = 25;
    let isDark = currentBg < 128;
    
    push();
    translate(indicatorX, indicatorY);
    
    // Draw circle background
    noStroke();
    fill(isDark ? 60 : 200, 150);
    ellipse(0, 0, 60, 60);
    
    // Draw arrow pointing in gravity direction
    stroke(isDark ? 220 : 40);
    strokeWeight(3);
    let endX = Math.cos(gravityAngle) * arrowLength;
    let endY = Math.sin(gravityAngle) * arrowLength;
    line(0, 0, endX, endY);
    
    // Draw arrowhead
    let headAngle = 0.5;
    let headLength = 8;
    line(endX, endY, 
         endX - Math.cos(gravityAngle - headAngle) * headLength,
         endY - Math.sin(gravityAngle - headAngle) * headLength);
    line(endX, endY,
         endX - Math.cos(gravityAngle + headAngle) * headLength,
         endY - Math.sin(gravityAngle + headAngle) * headLength);
    
    // Label
    noStroke();
    fill(isDark ? 150 : 100);
    textAlign(CENTER, TOP);
    textSize(9);
    text("GRAVITY", 0, 35);
    
    pop();
}

// Draw AM/PM indicator circle on clock edge
function drawAMPMIndicator(isPM, hour_dims) {
    let indicatorAngle = PI; // Bottom of clock
    let indicatorRadius = hour_dims.outerRadius + 15;
    let indicatorX = hour_dims.donutX + cos(indicatorAngle) * indicatorRadius;
    let indicatorY = hour_dims.donutY - sin(indicatorAngle) * indicatorRadius;
    
    push();
    noStroke();
    fill(isPM ? 30 : 225); // Dark for PM, light for AM
    ellipse(indicatorX, indicatorY, 20, 20);
    // Add border for visibility
    stroke(isPM ? 225 : 30);
    strokeWeight(2);
    noFill();
    ellipse(indicatorX, indicatorY, 20, 20);
    pop();
}

// Draw circle counts inside each ring
function drawCircleCounts(second_dims, minute_dims, hour_dims) {
    let countAngle = PI / 2; // Top of each ring (aligned with circle tops)
    
    push();
    textAlign(CENTER, CENTER);
    textSize(16);
    
    // Seconds count - at top of seconds ring
    let secX = second_dims.donutX + cos(countAngle) * (second_dims.innerRadius * 0.6);
    let secY = second_dims.donutY - sin(countAngle) * (second_dims.innerRadius * 0.6);
    fill(100, 150, 200);
    text(secondsCircles.length, secX, secY);
    
    // Minutes count - at top between seconds outer and minutes inner
    let minRadius = (second_dims.outerRadius + minute_dims.innerRadius) / 2;
    let minX = minute_dims.donutX + cos(countAngle) * minRadius;
    let minY = minute_dims.donutY - sin(countAngle) * minRadius;
    fill(200, 100, 100);
    text(minuteCircles.length, minX, minY);
    
    // Hours count - at top between minutes outer and hours inner
    let hrRadius = (minute_dims.outerRadius + hour_dims.innerRadius) / 2;
    let hrX = hour_dims.donutX + cos(countAngle) * hrRadius;
    let hrY = hour_dims.donutY - sin(countAngle) * hrRadius;
    fill(255, 200, 0);
    text(hourCircles.length, hrX, hrY);
    
    pop();
}

// Toolbar button definitions
let toolbarButtons = [];

function initToolbar() {
    let btnWidth = 100;
    let btnHeight = 30;
    let smallBtnWidth = 25;
    let gap = 10;
    // Calculate total toolbar height
    let totalHeight = (btnHeight + gap) * 7.5 + btnHeight;
    let startX = windowWidth * 0.82;
    let startY = windowHeight / 2 - totalHeight / 2;
    
    toolbarButtons = [
        { x: startX, y: startY, w: btnWidth, h: btnHeight, label: showNumbers ? "Hide #s" : "Show #s", action: 'toggleNumbers' },
        { x: startX, y: startY + (btnHeight + gap), w: btnWidth, h: btnHeight, label: 'Light Mode', action: 'lightMode' },
        { x: startX, y: startY + (btnHeight + gap) * 2, w: btnWidth, h: btnHeight, label: 'Dark Mode', action: 'darkMode' },
        { x: startX, y: startY + (btnHeight + gap) * 3, w: btnWidth, h: btnHeight, label: 'Auto Mode', action: 'autoMode' },
        // Circle controls: "- label +"
        { x: startX, y: startY + (btnHeight + gap) * 4.5, w: smallBtnWidth, h: btnHeight, label: '−', action: 'clearSec', type: 'minus' },
        { x: startX + btnWidth - smallBtnWidth, y: startY + (btnHeight + gap) * 4.5, w: smallBtnWidth, h: btnHeight, label: '+', action: 'addSec', type: 'plus' },
        { x: startX, y: startY + (btnHeight + gap) * 5.5, w: smallBtnWidth, h: btnHeight, label: '−', action: 'clearMin', type: 'minus' },
        { x: startX + btnWidth - smallBtnWidth, y: startY + (btnHeight + gap) * 5.5, w: smallBtnWidth, h: btnHeight, label: '+', action: 'addMin', type: 'plus' },
        { x: startX, y: startY + (btnHeight + gap) * 6.5, w: smallBtnWidth, h: btnHeight, label: '−', action: 'clearHr', type: 'minus' },
        { x: startX + btnWidth - smallBtnWidth, y: startY + (btnHeight + gap) * 6.5, w: smallBtnWidth, h: btnHeight, label: '+', action: 'addHr', type: 'plus' },
        { x: startX, y: startY + (btnHeight + gap) * 8, w: btnWidth, h: btnHeight, label: 'Restart', action: 'reset' },
    ];
    
    // Store row info for drawing labels
    toolbarRows = [
        { y: startY + (btnHeight + gap) * 4.5, label: 'second', color: [100, 150, 200] },
        { y: startY + (btnHeight + gap) * 5.5, label: 'minute', color: [200, 100, 100] },
        { y: startY + (btnHeight + gap) * 6.5, label: 'hour', color: [255, 200, 0] },
    ];
}

// Store row info globally
let toolbarRows = [];

function drawToolbar() {
    // Reinitialize toolbar positions each frame (handles resize)
    initToolbar();
    
    let isDark = currentBg < 128;
    let btnHeight = 30;
    let btnWidth = 100;
    let startX = toolbarButtons[0].x;
    
    push();
    textAlign(CENTER, CENTER);
    textSize(12);
    
    for (let btn of toolbarButtons) {
        // Button background
        if (btn.type === 'minus') {
            fill(isDark ? 80 : 180);
        } else if (btn.type === 'plus') {
            fill(isDark ? 80 : 180);
        } else {
            fill(isDark ? 60 : 200);
        }
        stroke(isDark ? 120 : 100);
        strokeWeight(1);
        rect(btn.x, btn.y, btn.w, btn.h, 5);
        
        // Button label
        noStroke();
        fill(isDark ? 220 : 40);
        
        // Update label for toggle button
        let label = btn.label;
        if (btn.action === 'toggleNumbers') {
            label = showNumbers ? "Hide #s" : "Show #s";
        }
        
        text(label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }
    
    // Draw row labels (second, minute, hour) in the middle
    for (let row of toolbarRows) {
        fill(row.color[0], row.color[1], row.color[2]);
        text(row.label, startX + btnWidth / 2, row.y + btnHeight / 2);
    }
    
    // Draw mode indicator
    textSize(10);
    fill(isDark ? 150 : 100);
    let modeText = darkMode === null ? "Mode: Auto" : (darkMode ? "Mode: Dark" : "Mode: Light");
    text(modeText, toolbarButtons[0].x + btnWidth / 2, toolbarButtons[0].y - 15);
    
    pop();
}

function handleToolbarClick(mx, my) {
    for (let btn of toolbarButtons) {
        if (mx > btn.x && mx < btn.x + btn.w && my > btn.y && my < btn.y + btn.h) {
            switch (btn.action) {
                case 'toggleNumbers':
                    showNumbers = !showNumbers;
                    break;
                case 'lightMode':
                    darkMode = false;
                    break;
                case 'darkMode':
                    darkMode = true;
                    break;
                case 'autoMode':
                    darkMode = null;
                    break;
                case 'clearSec':
                    startClearAnimation('second');
                    break;
                case 'clearMin':
                    startClearAnimation('minute');
                    break;
                case 'clearHr':
                    startClearAnimation('hour');
                    break;
                case 'addSec':
                    // Spawn a second circle
                    let sDims = getDonutDims(second_outer_scale, second_inner_scale);
                    let sX = windowWidth / 2 + random(-sDims.innerRadius * 0.25, sDims.innerRadius * 0.25);
                    let sY = sDims.donutY - random(sDims.innerRadius * 0.5, sDims.innerRadius * 0.75);
                    secondsCircles.push(new Circle(sX, sY, second_inner_scale, [100, 150, 200], 1.0));
                    break;
                case 'addMin':
                    // Spawn a minute circle
                    let mDims = getDonutDims(minute_outer_scale, minute_inner_scale);
                    let mX = windowWidth / 2 + random(-mDims.innerRadius * 0.25, mDims.innerRadius * 0.25);
                    let mY = mDims.donutY - random(mDims.innerRadius * 0.75, mDims.innerRadius * 0.9);
                    minuteCircles.push(new Circle(mX, mY, minute_inner_scale, [200, 100, 100], 0.55));
                    break;
                case 'addHr':
                    // Spawn an hour circle
                    let hDims = getDonutDims(hour_outer_scale, hour_inner_scale);
                    let hX = windowWidth / 2 + random(-hDims.innerRadius * 0.25, hDims.innerRadius * 0.25);
                    let hY = hDims.donutY - random(hDims.innerRadius * 0.75, hDims.innerRadius * 0.9);
                    hourCircles.push(new Circle(hX, hY, hour_inner_scale, [255, 200, 0], 0.9));
                    break;
                case 'reset':
                    resetClock();
                    break;
            }
            return true; // Click was handled
        }
    }
    return false; // Click not on toolbar
}

// draw() is called 60 times per second
function draw() {
    let hr = hour();
    let min = minute();
    let sec = second();
    let isPM = hr >= 12;

    // Determine target background based on mode
    if (darkMode === null) {
        // Auto mode - follows AM/PM
        targetBg = isPM ? 30 : 225;
    } else {
        // Manual mode
        targetBg = darkMode ? 30 : 225;
    }
    
    // Smooth transition to target background
    currentBg = lerp(currentBg, targetBg, bgTransitionSpeed);
    background(currentBg);
    
    // Clear rings from previous frame and register all rings for collision
    clearRings();
    registerRing(second_outer_scale, second_inner_scale);
    registerRing(minute_outer_scale, minute_inner_scale);
    registerRing(hour_outer_scale, hour_inner_scale);
    
    // Draw the rings
    second_dims = drawDonut(second_outer_scale, second_inner_scale);
    minute_dims = drawDonut(minute_outer_scale, minute_inner_scale, 200, 100, 100);
    hour_dims = drawDonut(hour_outer_scale, hour_inner_scale, 255, 200, 0);
    /*// Draw a donut (circle with transparent center)
    let donutX = windowWidth / 2;
    let donutY = windowHeight / 2;
    let outerRadius = windowWidth / second_outer_scale;  // ≈ windowWidth / 7.77
    let innerRadius = windowWidth / second_inner_scale;  // ≈ windowWidth / 8.77
    let ringThickness = outerRadius - innerRadius;

    
    // Draw the donut using arc with thick stroke
    
    push(); // Save current drawing state
    noFill();
    stroke(100, 150, 200);
    strokeWeight(ringThickness); // Set stroke weight for this arc only
    arc(donutX, donutY, (outerRadius + innerRadius), (outerRadius + innerRadius), 0, TWO_PI);
    pop(); // Restore previous drawing state (strokeWeight, stroke, fill, etc.)
    */

    
    
    // Create a new circle every second (only if not clearing)
    if (sec !== lastSecond && !clearing.second) {
        // Spawn circle at top center with slight random horizontal offset
        let spawnX = windowWidth / 2 + random(-second_dims.innerRadius * 0.25, second_dims.innerRadius * 0.25);
        let spawnY = second_dims.donutY - random(second_dims.innerRadius * 0.5, second_dims.innerRadius * 0.75);
        
        secondsCircles.push(new Circle(spawnX, spawnY, second_inner_scale, [100, 150, 200], 1.0));
        lastSecond = sec;
    }

    
    if(min !== lastMinute) {already_spawned.minute = false;}
    // Create a new circle every minute (only if not clearing)
    if (secondsCircles.length === 60 && !clearing.minute && !already_spawned.minute) {
        // Spawn circle at top center with slight random horizontal offset
        let spawnX = windowWidth / 2 + random(-minute_dims.innerRadius * 0.25, minute_dims.innerRadius * 0.25);
        let spawnY = minute_dims.donutY - random(minute_dims.innerRadius * 0.5, minute_dims.innerRadius * 0.75);
        minuteCircles.push(new Circle(spawnX, spawnY, minute_inner_scale, [200, 100, 100], 0.55));
        lastMinute = min;
        already_spawned.minute = true;
    }

    // Create a new circle every hour (only if not clearing)
    
    
    let hr12 = hr % 12;
    if(hr12 !== lastHour) {already_spawned.hour = false;}
    // Use 12-hour format
    if (minuteCircles.length === 60 && !clearing.hour && !already_spawned.hour) {
        // Spawn circle at top center with slight random horizontal offset
        let spawnX = windowWidth / 2 + random(-hour_dims.innerRadius * 0.25, hour_dims.innerRadius * 0.25);
        let spawnY = hour_dims.donutY - random(hour_dims.innerRadius * 0.75, hour_dims.innerRadius * 0.9);
        hourCircles.push(new Circle(spawnX, spawnY, hour_inner_scale, [255, 200, 0], 0.9));
        lastHour = hr12;
        already_spawned.hour = true;
    }
    
    
    // At start of minute, trigger clear animation for seconds
    if(min !== lastMinute) {already_spawned.minute = false;}
    if (secondsCircles.length === 60) {
        startClearAnimation('second');
        lastSecond = 0;
        console.log(`minute(): ${min}`);
    }

    // At start of hour, trigger clear animation for minutes
    if (minuteCircles.length === 60) {
        startClearAnimation('minute');
        lastMinute = minuteCircles.length;
    }

    // At start of 12-hour cycle (midnight/noon), trigger clear animation for hours
    if (hourCircles.length === 12) {
        already_cleared = true;
        if (!already_cleared) {
            startClearAnimation('hour');
            lastHour = hr12;
            already_cleared = true;
        }
    } else {
        already_cleared = false;
    }
    
    // Update and display all circles
    for (let i = secondsCircles.length - 1; i >= 0; i--) {
        secondsCircles[i].update(secondsCircles);
        secondsCircles[i].display();
    }
    for (let i = minuteCircles.length - 1; i >= 0; i--) {
        minuteCircles[i].update(minuteCircles);
        minuteCircles[i].display();
    }
    for (let i = hourCircles.length - 1; i >= 0; i--) {
        hourCircles[i].update(hourCircles);
        hourCircles[i].display();
    }
    /*
    // Display time (optional - you can remove if you want)
    textSize(32);
    fill(180);
    text(hr, 10, 30);
    fill(100);
    text(min, 10, 60);
    fill(0);
    text(sec, 10, 90);*/
    
    // Draw AM/PM indicator circle on clock edge
    drawAMPMIndicator(isPM, hour_dims);
    
    // Draw gravity direction indicator (small arrow in corner)
    if (gyroSupported === true) {
        drawGravityIndicator();
    }
    
    // Draw circle counts inside rings if enabled
    if (showNumbers) {
        drawCircleCounts(second_dims, minute_dims, hour_dims);
    }
    
    // Only show toolbar and title if window is wide enough
    if (windowWidth > 800) {
        // Draw toolbar
        drawToolbar();
        
        // Title and attribution text (top left)
        push();
        let isDark = currentBg < 128;
        textAlign(LEFT, TOP);
        
        // Title
        textSize(20);
        fill(isDark ? 220 : 40);
        text("Digital Stopwatch", 15, 15);
        
        // Subtitle lines
        textSize(11);
        fill(isDark ? 140 : 120);
        text("Bryan Ammons", 15, 42);
        text("Made for Keyski", 15, 58);
        text("press space for a party", 15, 74);
        pop();
    }
}