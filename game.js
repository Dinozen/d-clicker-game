// game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let score = 0;
let tokens = 0;
let level = 1;

// Images for different levels
const images = [
    'https://github.com/Dinozen/d-clicker-game/main/dino1.png', // level 1
    'https://github.com/Dinozen/d-clicker-game/main/dino2.png', // level 2
    'https://github.com/Dinozen/d-clicker-game/main/dino3.png', // level 3
    'https://github.com/Dinozen/d-clicker-game/main/dino4.png', // level 4
    'https://github.com/Dinozen/d-clicker-game/main/dino5.png'  // level 5
];

// Load images
const imageObjects = [];
for (let i = 0; i < images.length; i++) {
    const img = new Image();
    img.src = images[i];
    imageObjects.push(img);
}

// Initial draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw level image
    if (level <= images.length) {
        ctx.drawImage(imageObjects[level - 1], 50, 50, 100, 100);
    }

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 20, 40);
}

// Update function (game logic)
function update() {
    // Update game logic here (if any)
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// Boost button functionality
document.getElementById('boostButton').addEventListener('click', function() {
    if (tokens > 0) {
        score += 1; // Each click increases score by 1
        tokens -= 1; // Each boost consumes 1 token
        document.getElementById('tokenCount').textContent = tokens;
    }
});

// Token increment function (simulate earning tokens over time)
function earnToken() {
    tokens += level; // Increase tokens based on current level
    document.getElementById('tokenCount').textContent = tokens;
    setTimeout(earnToken, 1000); // Earn tokens every 1 second
}

// Start earning tokens
earnToken();
