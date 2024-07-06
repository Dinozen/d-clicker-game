console.log("Game script loaded");

// Oyun değişkenleri
let tokens = 0;
let level = 1;
let energy = 3;
let maxEnergy = 3;
let lastEnergyRefillTime = Date.now();
let clicksRemaining = 300;
let telegramId = '';
let boostAvailable = true;
const boostCooldown = 3 * 60 * 60 * 1000; // 3 saat

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boostButton = document.getElementById('boostButton');
const boostTimer = document.getElementById('boostTimer');

// Resimleri yükleme
let dinoImages = [];
let dinoImagePaths = ["dino1.png", "dino2.png", "dino3.png", "dino4.png", "dino5.png"];
let shadowImage = new Image();
shadowImage.src = 'shadow.png';

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
        boostAvailable = data.boostAvailable;
        console.log("User data loaded:", data);
    } else {
        console.log("No saved data found for this user");
    }
    updateUI();
    updateBoostButton();
}

function saveUserData() {
    const data = {
        tokens,
        level,
        energy,
        lastEnergyRefillTime,
        clicksRemaining,
        boostAvailable
    };
    localStorage.setItem(telegramId, JSON.stringify(data));
}

function startGame(userTelegramId) {
    console.log("Starting game for telegramId:", userTelegramId);
    telegramId = userTelegramId;
    loadUserData();
    loadImages().then(images => {
        dinoImages = images;
        resizeCanvas();
        setupGameUI();
        gameLoop();
        boostButton.addEventListener('click', handleBoost);
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
        // Resmin boyutunu ayarla
        const dinoImage = dinoImages[level - 1];
        const dinoWidth = Math.min(canvas.width * 0.5, dinoImage.width);
        const dinoHeight = dinoImage.height * (dinoWidth / dinoImage.width);
        const dinoX = (canvas.width - dinoWidth) / 2;
        const dinoY = (canvas.height - dinoHeight) / 2;
        ctx.drawImage(dinoImage, dinoX, dinoY, dinoWidth, dinoHeight);
        // Gölgeli resim ekle
        const shadowWidth = dinoWidth;
        const shadowHeight = dinoHeight * 0.1;
        ctx.drawImage(shadowImage, dinoX, dinoY + dinoHeight - shadowHeight / 2, shadowWidth, shadowHeight);
    }
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('tokenDisplay').textContent = `Tokens: ${tokens}`;
    document.getElementById('energyDisplay').textContent = `Energy: ${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = `Clicks: ${clicksRemaining}`;
    document.getElementById('levelDisplay').textContent
