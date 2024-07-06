console.log("Game script loaded");

// Oyun değişkenleri
let tokens = 0;
let level = 1;
let energy = 3;
let maxEnergy = 3;
let lastEnergyRefillTime = Date.now();
let clicksRemaining = 300;
let telegramId = 'default';
let boostAvailable = true;
const boostCooldown = 3 * 60 * 60 * 1000; // 3 saat

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boostButton = document.getElementById('boostButton');
const boostTimer = document.getElementById('boostTimer');

// Dinozor ve gölge resimleri
const dinoImage = new Image();
dinoImage.src = 'dino1.png';
const shadowImage = new Image();
shadowImage.src = 'shadow.png';

function startGame() {
    console.log("Starting game");
    loadUserData();
    resizeCanvas();
    dinoImage.onload = drawGame;
    shadowImage.onload = drawGame;
    setupClickHandler();
    setupGameUI();
    gameLoop();
    boostButton.addEventListener('click', handleBoost);
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

function resizeCanvas() {
    const scale = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(scale, scale);
    drawGame();
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShadow();
    drawDino();
}

function drawDino() {
    if (dinoImage.complete && dinoImage.naturalWidth > 0) {
        const scale = Math.min(canvas.width / dinoImage.width, canvas.height / dinoImage.height) * 0.8;
        const width = Math.round(dinoImage.width * scale);
        const height = Math.round(dinoImage.height * scale);
        const x = Math.round((canvas.width - width) / 2);
        const y = Math.round((canvas.height - height) / 2);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(dinoImage, x, y, width, height);
        console.log("Dino drawn at:", x, y, width, height);
    } else {
        console.log("Dino image not ready, drawing placeholder");
        ctx.fillStyle = 'green';
        ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
    }
}

function drawShadow() {
    if (shadowImage.complete && shadowImage.naturalWidth > 0) {
        const dinoScale = Math.min(canvas.width / dinoImage.width, canvas.height / dinoImage.height) * 0.8;
        const dinoWidth = Math.round(dinoImage.width * dinoScale);
        const dinoHeight = Math.round(dinoImage.height * dinoScale);
        const dinoX = Math.round((canvas.width - dinoWidth) / 2);
        const dinoY = Math.round((canvas.height - dinoHeight) / 2);

        const shadowWidth = dinoWidth;
        const shadowHeight = Math.round(shadowImage.height * (shadowWidth / shadowImage.width));
        const shadowX = dinoX;
        const shadowY = dinoY + dinoHeight - shadowHeight / 2;

        ctx.drawImage(shadowImage, shadowX, shadowY, shadowWidth, shadowHeight);
        console.log("Shadow drawn at:", shadowX, shadowY, shadowWidth, shadowHeight);
    } else {
        console.log("Shadow image not ready");
    }
}

function setupClickHandler() {
    let lastClickTime = 0;
    const clickCooldown = 10; // 10 milisaniye

    canvas.addEventListener('click', (event) => {
        const currentTime = Date.now();
        if (currentTime - lastClickTime >= clickCooldown) {
            handleClick(event);
            lastClickTime = currentTime;
        }
    });
}

function handleClick(event) {
    if (energy > 0) {
        if (clicksRemaining <= 0) {
            energy--;
            clicksRemaining = 300;
        }
        tokens++;
        clicksRemaining--;
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

function setupGameUI() {
    updateUI();
}

function gameLoop() {
    drawGame();
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    const elements = ['tokenDisplay', 'energyDisplay', 'clicksDisplay', 'levelDisplay'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.color = 'white';
            element.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        }
    });

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

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const userTelegramId = urlParams.get('id');
    if (userTelegramId) {
        telegramId = userTelegramId;
    }
    startGame();
};