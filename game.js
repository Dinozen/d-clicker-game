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

// Dinozor resimleri
const dinoImages = [];
const dinoImagePaths = ["dino1.png", "dino2.png", "dino3.png", "dino4.png", "dino5.png"];

function loadImages() {
    console.log("Loading images...");
    dinoImagePaths.forEach((path, index) => {
        const img = new Image();
        img.onload = () => {
            console.log(`Image loaded successfully: ${path}`);
            dinoImages[index] = img;
            if (index === 0) drawDino(); // İlk resim yüklendiğinde çiz
        };
        img.onerror = (e) => console.error(`Error loading image: ${path}`, e);
        img.src = path;
    });
}

function loadUserData() {
    console.log("Loading user data for telegramId:", telegramId);
    const savedData = localStorage.getItem(telegramId);
    if (savedData) {
        const data = JSON.parse(savedData);
        tokens = data.tokens;
        level = data.level;
        energy = data.energy;
        lastEnergyRefillTime = new Date(data.lastEnergyRefillTime).getTime();
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
    const data = { tokens, level, energy, lastEnergyRefillTime, clicksRemaining, boostAvailable };
    localStorage.setItem(telegramId, JSON.stringify(data));
}

function startGame(userTelegramId) {
    console.log("Starting game for telegramId:", userTelegramId);
    telegramId = userTelegramId;
    loadUserData();
    loadImages();
    resizeCanvas();
    setupGameUI();
    boostButton.addEventListener('click', handleBoost);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawDino();
}

function setupGameUI() {
    updateUI();
    canvas.addEventListener('click', handleClick);
}

function handleClick(event) {
    if (energy > 0 && clicksRemaining > 0) {
        tokens++;
        clicksRemaining--;
        if (clicksRemaining % 100 === 0) energy--;
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
    setTimeout(() => clickEffect.remove(), 1000);
}

function drawDino() {
    if (dinoImages[level - 1] && dinoImages[level - 1].complete) {
        const img = dinoImages[level - 1];
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, x, y, width, height);
        
        console.log("Dino drawn at:", x, y, width, height);
    } else {
        console.log("Dino image not ready or not found");
    }
}

function updateUI() {
    document.getElementById('tokenDisplay').textContent = `Tokens: ${tokens}`;
    document.getElementById('energyDisplay').textContent = `Energy: ${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = `Clicks: ${clicksRemaining}`;
    document.getElementById('levelDisplay').textContent = `Level: ${level}`;
}

function handleBoost() {
    if (boostAvailable && energy < maxEnergy) {
        energy = maxEnergy;
        boostAvailable = false;
        lastEnergyRefillTime = Date.now();
        updateBoostButton();
        saveUserData();
        updateUI();
    }
}

function updateBoostButton() {
    if (boostAvailable) {
        boostButton.classList.remove('disabled');
        boostButton.textContent = 'Boost';
    } else {
        boostButton.classList.add('disabled');
        boostButton.textContent = 'Boost Unavailable';
    }
}

function updateBoostTimer() {
    const timeElapsed = Date.now() - lastEnergyRefillTime;
    const timeRemaining = boostCooldown - timeElapsed;
    if (timeRemaining <= 0) {
        boostAvailable = true;
        updateBoostButton();
        boostTimer.textContent = '';
    } else {
        const hours = Math.floor(timeRemaining / 3600000);
        const minutes = Math.floor((timeRemaining % 3600000) / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        boostTimer.textContent = `Boost available in: ${hours}:${minutes}:${seconds}`;
    }
}

window.addEventListener('resize', resizeCanvas);

setInterval(() => {
    updateBoostTimer();
    saveUserData();
}, 1000);

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userTelegramId = urlParams.get('id');
    if (userTelegramId) {
        startGame(userTelegramId);
    } else {
        console.error("No Telegram ID provided");
    }
});