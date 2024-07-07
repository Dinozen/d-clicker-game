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

// Dinozor resmi
const dinoImage = new Image();
dinoImage.src = 'dino1.png';

function startGame() {
    console.log("Starting game");
    loadUserData();
    resizeCanvas();
    dinoImage.onload = drawDino;
    setupClickHandler();
    setupGameUI();
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawDino();
}

function drawDino() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dinoImage.complete && dinoImage.naturalWidth > 0) {
        const scale = Math.min(canvas.width / dinoImage.naturalWidth, canvas.height / dinoImage.naturalHeight) * 0.8;
        const width = Math.round(dinoImage.naturalWidth * scale);
        const height = Math.round(dinoImage.naturalHeight * scale);
        const x = Math.round((canvas.width - width) / 2);
        const y = Math.round((canvas.height - height) / 2);
        
        // Geçici canvas oluştur
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width * 2;
        tempCanvas.height = height * 2;
        
        // Resmi geçici canvas'a büyük boyutta çiz
        tempCtx.drawImage(dinoImage, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Geçici canvas'ı ana canvas'a küçülterek çiz
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(tempCanvas, x, y, width, height);
        
        console.log("Dino drawn at:", x, y, width, height);
    } else {
        console.log("Dino image not ready, drawing placeholder");
        ctx.fillStyle = 'green';
        ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
    }
}

function setupClickHandler() {
    let lastClickTime = 0;
    const clickCooldown = 1; // 1 milisaniye

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
