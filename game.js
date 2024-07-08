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

// Level gereksinimleri
const levelRequirements = [0, 2000, 5000, 10000, 20000];

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boostButton = document.getElementById('boostButton');
const boostTimer = document.getElementById('boostTimer');

// Dinozor resimleri
const dinoImages = [];
for (let i = 1; i <= 5; i++) {
    const img = new Image();
    img.src = `dino${i}.png`;
    dinoImages.push(img);
}

let currentDinoImage = dinoImages[0];
let dinoX, dinoY, dinoWidth, dinoHeight;
let isClicking = false;
let clickScale = 1;

function startGame() {
    console.log("Starting game");
    loadUserData();
    resizeCanvas();
    if (currentDinoImage.complete) {
        console.log("Dino image already loaded");
        drawDino();
        setupClickHandler();
    } else {
        console.log("Waiting for dino image to load");
        currentDinoImage.onload = () => {
            console.log("Dino image loaded");
            drawDino();
            setupClickHandler();
        };
        currentDinoImage.onerror = () => {
            console.error("Failed to load dino image");
        };
    }
    setupGameUI();
    boostButton.addEventListener('click', handleBoost);
    animateDino();
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
    updateDinoImage();
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
    const scale = window.devicePixelRatio;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(scale, scale);
    drawDino();
}

function drawDino() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (currentDinoImage.complete && currentDinoImage.naturalWidth > 0) {
        const scale = Math.min(window.innerWidth / currentDinoImage.naturalWidth, window.innerHeight / currentDinoImage.naturalHeight) * 0.56;
        dinoWidth = Math.round(currentDinoImage.naturalWidth * scale * clickScale);
        dinoHeight = Math.round(currentDinoImage.naturalHeight * scale * clickScale);
        dinoX = Math.round((window.innerWidth - dinoWidth) / 2);
        dinoY = Math.round((window.innerHeight - dinoHeight) / 2);
        
        // Arka plan dairesi çiz
        const centerX = dinoX + dinoWidth / 2;
        const centerY = dinoY + dinoHeight / 2;
        const circleRadius = Math.max(dinoWidth, dinoHeight) / 2 + 10;
        
        // Gradient oluştur
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, circleRadius);
        gradient.addColorStop(0, 'rgba(137, 207, 240, 0.8)');
        gradient.addColorStop(1, 'rgba(100, 149, 237, 0.6)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Daha kontrastlı kenarlık
        ctx.strokeStyle = 'rgba(25, 25, 112, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.drawImage(currentDinoImage, dinoX, dinoY, dinoWidth, dinoHeight);
        
        console.log("Dino drawn at:", dinoX, dinoY, dinoWidth, dinoHeight);
    } else {
        console.log("Dino image not ready, drawing placeholder");
        ctx.fillStyle = 'green';
        ctx.fillRect(window.innerWidth / 2 - 50, window.innerHeight / 2 - 50, 100, 100);
    }
}

function setupClickHandler() {
    canvas.addEventListener('click', (event) => {
        console.log("Canvas clicked");
        handleClick(event);
    });
}

function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio;
    const x = (event.clientX - rect.left) * scale;
    const y = (event.clientY - rect.top) * scale;

    console.log(`Click at: (${x}, ${y})`);
    console.log(`Dino bounds: x=${dinoX * scale}, y=${dinoY * scale}, width=${dinoWidth * scale}, height=${dinoHeight * scale}`);

    if (x >= dinoX * scale && x <= (dinoX + dinoWidth) * scale && 
        y >= dinoY * scale && y <= (dinoY + dinoHeight) * scale) {
        console.log("Dino clicked!");
        if (energy > 0) {
            if (clicksRemaining <= 0) {
                energy--;
                clicksRemaining = 300;
            }
            tokens++;
            clicksRemaining--;
            createClickEffect(event.clientX, event.clientY);
            isClicking = true;
            clickScale = 1.1;
            updateUI();
            checkLevelUp();
            saveUserData();
        }
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

function animateDino() {
    if (isClicking) {
        clickScale -= 0.005;
        if (clickScale <= 1) {
            clickScale = 1;
            isClicking = false;
        }
        drawDino();
    }
    requestAnimationFrame(animateDino);
}

function checkLevelUp() {
    const newLevel = levelRequirements.findIndex(req => tokens < req);
    if (newLevel !== level) {
        level = newLevel;
        updateDinoImage();
        createLevelUpEffect();
    }
}

function updateDinoImage() {
    currentDinoImage = dinoImages[level - 1];
    drawDino();
}

function createLevelUpEffect() {
    const levelUpEffect = document.createElement('div');
    levelUpEffect.className = 'levelUpEffect';
    levelUpEffect.style.position = 'absolute';
    levelUpEffect.style.left = '50%';
    levelUpEffect.style.top = '50%';
    levelUpEffect.style.transform = 'translate(-50%, -50%)';
    levelUpEffect.style.fontSize = '48px';
    levelUpEffect.style.color = 'gold';
    levelUpEffect.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    levelUpEffect.style.zIndex = '1000';
    levelUpEffect.textContent = `Level Up! ${level}`;
    document.body.appendChild(levelUpEffect);

    setTimeout(() => {
        levelUpEffect.remove();
    }, 2000);
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
