console.log("Game script loaded");

// Oyun değişkenleri
let tokens = 0;
let level = 1;
let energy = 3;
let maxEnergy = 3;
let lastEnergyRefillTime = Date.now();
let clicksRemaining = 300;
let telegramId = '';

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const backgroundCanvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');
const bgCtx = backgroundCanvas.getContext('2d');

// Resimleri yükleme
let dinoImages = [];
let dinoImagePaths = ["dino1.png", "dino2.png", "dino3.png", "dino4.png", "dino5.png"];

function loadImages() {
    console.log("Loading images...");
    return Promise.all(dinoImagePaths.map(path => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                console.log(`Image loaded successfully: ${path}`);
                resolve(img);
            };
            img.onerror = (e) => {
                console.error(`Error loading image: ${path}`, e);
                resolve(new Image()); // Boş bir resim objesi döndür
            };
            img.src = path;
        });
    }));
}

function loadUserData() {
    console.log("Loading user data for telegramId:", telegramId);
    const savedData = localStorage.getItem(telegramId);
    if (savedData) {
        const data = JSON.parse(savedData);
        tokens = data.tokens;
        level = data.level;
        energy = data.energy;
        lastEnergyRefillTime = new Date(data.lastEnergyRefillTime);
        clicksRemaining = data.clicksRemaining;
        console.log("User data loaded:", data);
    } else {
        console.log("No saved data found for this user");
    }
    updateUI();
}

function saveUserData() {
    const data = {
        tokens,
        level,
        energy,
        lastEnergyRefillTime,
        clicksRemaining
    };
    localStorage.setItem(telegramId, JSON.stringify(data));
}

function startGame(userTelegramId) {
    console.log("Starting game for telegramId:", userTelegramId);
    telegramId = userTelegramId;
    loadUserData();
    resizeCanvas();
    setupGameUI();
    gameLoop();
    animateBackground();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;
}

function setupGameUI() {
    const gameInfo = document.getElementById('gameInfo');
    gameInfo.innerHTML = `
        <span id="tokenDisplay">Tokens: ${tokens}</span>
        <span id="energyDisplay">Energy: ${energy}/${maxEnergy}</span>
        <span id="clicksDisplay">Clicks: ${clicksRemaining}</span>
        <span id="levelDisplay">Level: ${level}</span>
    `;
    canvas.addEventListener('click', handleClick);
}

function handleClick(event) {
    if (energy > 0 && clicksRemaining > 0) {
        tokens++;
        clicksRemaining--;
        if (clicksRemaining % 100 === 0) {
            energy--;
        }
        createClickEffect(event.clientX, event.clientY);
        updateUI();
        saveUserData();
    }
}

function createClickEffect(x, y) {
    const clickEffect = document.createElement('div');
    clickEffect.className = 'clickEffect';
    clickEffect.style.left = `${x}px`;
    clickEffect.style.top = `${y}px`;
    clickEffect.textContent = '+1';
    document.body.appendChild(clickEffect);

    setTimeout(() => {
        clickEffect.remove();
    }, 1000);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dinoImages.length > 0) {
        const dinoImage = dinoImages[level - 1];
        const dinoWidth = Math.min(canvas.width * 0.5, dinoImage.width);
        const dinoHeight = dinoImage.height * (dinoWidth / dinoImage.width);
        const dinoX = (canvas.width - dinoWidth) / 2;
        const dinoY = (canvas.height - dinoHeight) / 2;
        ctx.drawImage(dinoImage, dinoX, dinoY, dinoWidth, dinoHeight);
    }
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('tokenDisplay').textContent = `Tokens: ${tokens}`;
    document.getElementById('energyDisplay').textContent = `Energy: ${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = `Clicks: ${clicksRemaining}`;
    document.getElementById('levelDisplay').textContent = `Level: ${level}`;
}

window.addEventListener('resize', resizeCanvas);

// Arkaplan animasyonu için yıldızlar
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.5,
        speed: Math.random() * 0.5 + 0.2
    });
}

function animateBackground() {
    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    bgCtx.fillStyle = '#ffffff';
    stars.forEach(star => {
        bgCtx.beginPath();
        bgCtx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
        bgCtx.fill();
        star.y += star.speed;
        if (star.y > window.innerHeight) {
            star.y = 0;
        }
    });
    requestAnimationFrame(animateBackground);
}

console.log("Initializing game...");
loadImages().then(loadedImages => {
    console.log("Images loading process completed");
   
