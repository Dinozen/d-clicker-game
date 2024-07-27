console.log("Game script loaded");

const BACKEND_URL = 'https://dino-game-backend-913ad8a618a0.herokuapp.com';

// Oyun değişkenleri
let saveInterval;
let tokens = 0;
let completedTasks = [];
let level = 1;
let energy = 3;
let maxEnergy = 3;
let lastEnergyRefillTime = Date.now();
let clicksRemaining = 300;
let telegramId = 'default';
let boostAvailable = true;
const boostCooldown = 3 * 60 * 60 * 1000; // 3 saat
let dailyStreak = 0;
let lastLoginDate = null;
let lastSessionCloseTime = 0;
let lastGiftTime = 0;
let lastEnergyBoostTime = 0;
let referralCount = 0;
let isDoubleTokensActive = false;
let autoBotActive = false;
let autoBotPurchased = false;
let autoBotTokens = 0;
let energyRefillRate = 1 / 3; // Başlangıçta 3 saniyede 1
let autoBotPurchaseTime = 0;
let lastAutoBotCheckTime = 0;
let lastPlayerActivityTime = Date.now();
let autoBotShownThisSession = false;

// Level gereksinimleri
const levelRequirements = [0, 30000, 80000, 300000, 1000000];
const clickLimits = [300, 500, 1000, 1500, 2000];

// DOM elementleri
let canvas, ctx, earnButton, tasksButton, boostButton, dailyRewardsButton, menuModal, dailyRewardDisplay, boostersModal, tasksModal, rewardTableModal;
let autoBotSuccessModal, autoBotEarningsModal, loginStreakModal, loginStreakMessage, claimRewardButton, autoBotTokensCollected, claimAutoBotTokens;

// Dinozor resimleri
const dinoImages = [];

let currentDinoImage;
let dinoX, dinoY, dinoWidth, dinoHeight;
let isClicking = false;
let clickScale = 1;

let lastTime = 0;
let resizeTimeout;
let lastClickIncreaseTime = 0;
let lastCooldownUpdateTime = 0;
let cachedTokens = 0;

let lastDrawTime = 0;
const FRAME_RATE = 30; // Saniyede 30 kare

let lastAutoCheckTime = 0;
const AUTO_CHECK_INTERVAL = 5000; // 5 saniye

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
console.log("Is mobile device:", isMobile);

async function loadUserData() {
    try {
        console.log("Loading user data for Telegram ID:", telegramId);
        const response = await fetch(`${BACKEND_URL}/api/player/${telegramId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Loaded user data:", data);
        // Oyuncu verilerini güncelle
        tokens = data.tokens || 0;
        level = data.level || 1;
        energy = data.energy || 3;
        maxEnergy = data.maxEnergy || 3;
        clicksRemaining = data.clicksRemaining || getMaxClicksForLevel();
        lastEnergyRefillTime = new Date(data.lastEnergyRefillTime || Date.now());
        dailyStreak = data.dailyStreak || 0;
        lastLoginDate = data.lastLoginDate ? new Date(data.lastLoginDate) : null;
        completedTasks = data.completedTasks || [];
        referralCount = data.referralCount || 0;
        autoBotActive = data.autoBotActive || false;
        autoBotPurchased = data.autoBotPurchased || false;
        autoBotTokens = data.autoBotTokens || 0;
        lastAutoBotCheckTime = data.lastAutoBotCheckTime ? new Date(data.lastAutoBotCheckTime) : null;
        lastGiftTime = data.lastGiftTime || 0;
        updateUI();
    } catch (error) {
        console.error('Error loading user data:', error);
        showMessage('Failed to load user data. Please try refreshing the page. Error: ' + error.message);
    }
}

async function saveUserData() {
    try {
        console.log("Saving user data for Telegram ID:", telegramId);
        const response = await fetch(`${BACKEND_URL}/api/update/${telegramId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId,
                tokens,
                level,
                energy,
                maxEnergy,
                clicksRemaining,
                lastEnergyRefillTime,
                dailyStreak,
                lastLoginDate,
                completedTasks,
                referralCount,
                autoBotActive,
                autoBotPurchased,
                autoBotTokens,
                lastAutoBotCheckTime,
                lastGiftTime
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Data saved:', data);
    } catch (error) {
        console.error('Error saving user data:', error);
        showMessage('Failed to save game progress. Please check your internet connection.');
    }
}

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    if (currentTime - lastDrawTime > 1000 / FRAME_RATE) {
        if (currentTime - lastClickIncreaseTime > 1000) {
            increaseClicks();
            lastClickIncreaseTime = currentTime;
        }
        
        if (currentTime - lastCooldownUpdateTime > 1000) {
            updateGiftCooldownDisplay();
            updateEnergyBoostCooldownDisplay();
            lastCooldownUpdateTime = currentTime;
        }
        
        if (currentTime - lastAutoCheckTime > AUTO_CHECK_INTERVAL) {
            checkAutoBot();
            lastAutoCheckTime = currentTime;
        }

        animateDino();
        updateUI();
        drawDino();

        lastDrawTime = currentTime;
    }
}

function startGame() {
    console.log("Starting game");
    showLoading();
    initializeDOM();
    loadUserData().then(() => {
        loadDinoImages();
        resizeCanvas();
        setupClickHandler();
        setupResizeHandler();
        preloadImages();
        checkDailyLogin();
        checkAutoBotOnStartup();
        updateTaskButtons();
        updateEnergyRefillRate();
        
        setInterval(increaseEnergy, 60 * 1000); // Her dakika enerji kontrolü
        saveInterval = setInterval(saveUserData, 5000); // Her 5 saniyede bir verileri kaydet
        
        requestAnimationFrame(gameLoop);
        console.log("Game loop started");
        hideLoading();
    }).catch(error => {
        console.error("Error starting game:", error);
        hideLoading();
        showMessage("Failed to start the game. Please try refreshing the page.");
    });
}

function showLoading() {
    document.getElementById('loading-screen').style.display = 'flex';
}
  
function hideLoading() {
    document.getElementById('loading-screen').style.display = 'none';
}

function initializeDOM() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    earnButton = document.getElementById('earnButton');
    tasksButton = document.getElementById('tasksButton');
    boostButton = document.getElementById('boostButton');
    dailyRewardsButton = document.getElementById('dailyRewardsButton');
    menuModal = document.getElementById('menuModal');
    dailyRewardDisplay = document.getElementById('dailyRewardDisplay');
    boostersModal = document.getElementById('boostersModal');
    tasksModal = document.getElementById('tasksModal');
    rewardTableModal = document.getElementById('rewardTableModal');
    autoBotSuccessModal = document.getElementById('autoBotSuccessModal');
    autoBotEarningsModal = document.getElementById('autoBotEarningsModal');
    loginStreakModal = document.getElementById('loginStreakModal');
    loginStreakMessage = document.getElementById('loginStreakMessage');
    claimRewardButton = document.getElementById('claimDailyReward');
    autoBotTokensCollected = document.getElementById('autoBotTokensCollected');
    claimAutoBotTokens = document.getElementById('claimAutoBotTokens');

    if (earnButton) {
        earnButton.addEventListener('click', toggleMenu);
    }
    if (tasksButton) {
        tasksButton.addEventListener('click', showTasks);
    }
    if (boostButton) {
        boostButton.addEventListener('click', toggleBoosters);
    }
    if (dailyRewardsButton) {
        dailyRewardsButton.addEventListener('click', showDailyStreaks);
    }
    if (document.getElementById('nextRewardPage')) {
        document.getElementById('nextRewardPage').addEventListener('click', toggleRewardPage);
    }
    if (document.getElementById('prevRewardPage')) {
        document.getElementById('prevRewardPage').addEventListener('click', toggleRewardPage);
    }
    if (document.getElementById('closeRewardTableButton')) {
        document.getElementById('closeRewardTableButton').addEventListener('click', () => {
            rewardTableModal.style.display = 'none';
        });
    }
    if (document.getElementById('followUsButton')) {
        document.getElementById('followUsButton').addEventListener('click', () => startTask('followX'));
    }
    if (document.getElementById('visitWebsiteButton')) {
        document.getElementById('visitWebsiteButton').addEventListener('click', () => startTask('visitWebsite'));
    }
    if (document.getElementById('closeTasksModal')) {
        document.getElementById('closeTasksModal').addEventListener('click', () => {
            tasksModal.style.display = 'none';
        });
    }

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('click', handleClick);

    if (document.getElementById('closeBoostersModal')) {
        document.getElementById('closeBoostersModal').addEventListener('click', () => {
            boostersModal.style.display = 'none';
        });
    }
    if (document.getElementById('closeAutoBotSuccessModal')) {
        document.getElementById('closeAutoBotSuccessModal').addEventListener('click', () => {
            autoBotSuccessModal.style.display = 'none';
        });
    }
    if (document.getElementById('closeAutoBotEarningsModal')) {
        document.getElementById('closeAutoBotEarningsModal').addEventListener('click', () => {
            autoBotEarningsModal.style.display = 'none';
        });
    }
    if (document.getElementById('closeMessageModal')) {
        document.getElementById('closeMessageModal').addEventListener('click', () => {
            document.getElementById('messageModal').style.display = 'none';
        });
    }
    if (document.getElementById('closeLevelUpModal')) {
        document.getElementById('closeLevelUpModal').addEventListener('click', () => {
            document.getElementById('levelUpModal').style.display = 'none';
        });
    }
    if (document.getElementById('closeLoginStreakModal')) {
        document.getElementById('closeLoginStreakModal').addEventListener('click', () => {
            loginStreakModal.style.display = 'none';
        });
    }
    if (document.getElementById('closeRandomGiftResultModal')) {
        document.getElementById('closeRandomGiftResultModal').addEventListener('click', () => {
            document.getElementById('randomGiftResultModal').style.display = 'none';
        });
    }

    document.addEventListener('click', () => {
        lastPlayerActivityTime = Date.now();
    });

    document.addEventListener('keydown', () => {
        lastPlayerActivityTime = Date.now();
    });

    document.addEventListener('mousemove', () => {
        lastPlayerActivityTime = Date.now();
    });
}

function setupResizeHandler() {
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            resizeCanvas();
            drawDino();
        }, 250);
    });
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
    
    if (currentDinoImage && currentDinoImage.complete && currentDinoImage.naturalWidth > 0) {
        const scale = Math.min(window.innerWidth / currentDinoImage.naturalWidth, window.innerHeight / currentDinoImage.naturalHeight) * 0.4;
        dinoWidth = Math.round(currentDinoImage.naturalWidth * scale * clickScale);
        dinoHeight = Math.round(currentDinoImage.naturalHeight * scale * clickScale);
        dinoX = Math.round((window.innerWidth - dinoWidth) / 2);
        dinoY = Math.round((window.innerHeight - dinoHeight) / 2);
        
        const centerX = dinoX + dinoWidth / 2;
        const centerY = dinoY + dinoHeight / 2;
        const circleRadius = Math.max(dinoWidth, dinoHeight) / 2 + 5;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, circleRadius);
        gradient.addColorStop(0, 'rgba(137, 207, 240, 0.8)');
        gradient.addColorStop(1, 'rgba(100, 149, 237, 0.6)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(25, 25, 112, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.drawImage(currentDinoImage, dinoX, dinoY, dinoWidth, dinoHeight);
    } else {
        ctx.fillStyle = 'green';
        ctx.fillRect(window.innerWidth / 2 - 50, window.innerHeight / 2 - 50, 100, 100);
    }
}

function setupClickHandler() {
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('click', handleClick);
}

function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    handleClick({ clientX: touch.clientX, clientY: touch.clientY });
}

function handleTouchEnd(event) {
    event.preventDefault();
    isClicking = false;
}

function handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    handleClick({ clientX: touch.clientX, clientY: touch.clientY });
}

function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x >= dinoX && x <= dinoX + dinoWidth &&
        y >= dinoY && y <= dinoY + dinoHeight) {
        let tokenGain = 1 * getLevelMultiplier();
        if (isDoubleTokensActive) {
            tokenGain *= 2;
        }

        createClickEffect(event.clientX, event.clientY, tokenGain);
        isClicking = true;
        clickScale = 1.1;
        requestAnimationFrame(animateDino);

        if (clicksRemaining > 0) {
            tokens += tokenGain;
            clicksRemaining--;
            updateUI();
            checkLevelUp();
            saveUserData();
        } else if (energy > 0) {
            energy--;
            clicksRemaining = getMaxClicksForLevel();
            updateUI();
            saveUserData();
        }
    }
}

function createClickEffect(x, y, amount) {
    const clickEffect = document.createElement('div');
    clickEffect.className = 'clickEffect';
    clickEffect.style.left = `${x}px`;
    clickEffect.style.top = `${y}px`;
    clickEffect.textContent = `+${amount}`;
    document.body.appendChild(clickEffect);

    setTimeout(() => {
        clickEffect.remove();
    }, 1000);
}

function formatNumber(number) {
    if (number >= 10000) {
        return (number / 1000).toFixed(1) + 'k';
    } else if (number >= 1000) {
        return number.toFixed(0);
    }
    return number.toFixed(0);
}

function formatClicks(number) {
    if (number === Infinity) {
        return '∞';
    }
    return number.toFixed(2).slice(0, 6);
}

function updateLevelInfo() {
    const currentLevelElement = document.getElementById('currentLevel');
    const nextLevelElement = document.getElementById('nextLevel');
    const nextLevelTokensElement = document.getElementById('nextLevelTokens');

    if (currentLevelElement) {
        currentLevelElement.textContent = `Current Level: ${level}`;
    }
  
    if (level < 5) {
        const nextLevel = level + 1;
        const tokensNeeded = Math.max(0, levelRequirements[nextLevel - 1] - tokens);
        if (nextLevelElement) {
            nextLevelElement.innerHTML = `Next Level: <img src="token.png" alt="token"> <span id="nextLevelTokens">${formatNumber(tokensNeeded)}</span>`;
        }
    } else {
        if (nextLevelElement) {
            nextLevelElement.innerHTML = 'Max Level Reached!';
        }
    }
}

function updateUI() {
    if (tokens !== cachedTokens) {
        const tokenDisplay = document.getElementById('tokenDisplay');
        if (tokenDisplay) {
            tokenDisplay.textContent = formatNumber(tokens);
        }
        cachedTokens = tokens;
    }

    const energyDisplay = document.getElementById('energyDisplay');
    if (energyDisplay) {
        energyDisplay.textContent = `${energy}/${maxEnergy}`;
    }

    const clicksDisplay = document.getElementById('clicksDisplay');
    if (clicksDisplay) {
        clicksDisplay.textContent = formatClicks(clicksRemaining);
    }

    const levelDisplay = document.getElementById('levelDisplay');
    if (levelDisplay) {
        levelDisplay.textContent = `${level}`;
    }

    updateDailyRewardDisplay();
    updateGiftCooldownDisplay();
    updateLevelInfo();
}

function updateGiftCooldownDisplay() {
    const now = Date.now();
    const timeRemaining = Math.max(0, lastGiftTime + boostCooldown - now);
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    const cooldownDisplay = document.getElementById('giftCooldownDisplay');
    const randomGiftButton = document.getElementById('randomGiftButton');
    if (cooldownDisplay && randomGiftButton) {
        if (timeRemaining > 0) {
            cooldownDisplay.textContent = `Available in ${hours}h ${minutes}m ${seconds}s`;
            randomGiftButton.disabled = true;
            randomGiftButton.classList.add('disabled');
        } else {
            cooldownDisplay.textContent = 'Random Gift available!';
            randomGiftButton.disabled = false;
            randomGiftButton.classList.remove('disabled');
        }
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
        requestAnimationFrame(animateDino);
    }
}

function checkLevelUp() {
    const newLevel = levelRequirements.findIndex(req => tokens < req);
    if (newLevel > level && newLevel <= 5) {
        while (level < newLevel) {
            levelUp();
        }
    }
}

function loadDinoImages() {
    console.log("Loading dino images...");
    const loadPromises = [];

    function loadSingleImage(index) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = `dino${index}.png`;
            console.log(`Loading image: ${img.src}`);
            img.onload = () => {
                console.log(`Dino image ${index} loaded successfully`);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`Failed to load dino image ${index}:`, error);
                reject(error);
            };
        });
    }

    for (let i = 1; i <= 5; i++) {
        loadPromises.push(loadSingleImage(i));
    }

    Promise.all(loadPromises)
        .then(loadedImages => {
            dinoImages.length = 0;
            dinoImages.push(...loadedImages);
            console.log(`All dino images loaded. Total: ${dinoImages.length}`);
            updateDinoImage();
            drawDino();
        })
        .catch(error => {
            console.error(`Error loading dino images:`, error);
        });
}

function updateDinoImage() {
    const dinoIndex = Math.min(level - 1, 4);
    currentDinoImage = dinoImages[dinoIndex];
    if (currentDinoImage) {
        drawDino();
    } else {
        console.log(`Dino image not found for index: ${dinoIndex}`);
    }
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

function toggleMenu() {
    if (menuModal.style.display === 'none' || menuModal.style.display === '') {
        menuModal.style.display = 'block';
        updateMenuContent();
    } else {
        menuModal.style.display = 'none';
    }
}

function toggleBoosters() {
    if (boostersModal.style.display === 'none' || boostersModal.style.display === '') {
        boostersModal.style.display = 'block';
        updateBoostersModalContent();
    } else {
        boostersModal.style.display = 'none';
    }
}

function updateBoostersModalContent() {
    if (!boostersModal) {
        console.log('Boosters modal not found');
        return;
    }
    boostersModal.innerHTML = `
        <div class="modal-content">
            <h3>Boosters</h3>
            <div id="energyBoostContainer" style="display: flex; flex-direction: column; align-items: center;">
                <h3>🚀Energy Filler</h3>
                <button id="energyBoostButton" class="button">Restore Full Energy</button>
                <div id="energyBoostCooldownDisplay"></div>
            </div>
            <div id="autoBotContainer" style="display: flex; flex-direction: column; align-items: center;">
                <img src="autobot.png" alt="AutoBot" id="autoBotImage" style="width: 100px; height: 100px;">
                <div id="autoBotInfo">
                    <h3>AutoBot</h3>
                    <p>(200,000 tokens)</p>
                </div>
                <button id="autoBotButton" class="button">Activate AutoBot</button>
            </div>
            <button id="closeBoostersModal" class="close-btn">X</button>
        </div>
    `;

    const energyBoostButton = document.getElementById('energyBoostButton');
    const autoBotButton = document.getElementById('autoBotButton');
    const closeBoostersModalButton = document.getElementById('closeBoostersModal');

    if (energyBoostButton) {
        energyBoostButton.addEventListener('click', activateEnergyBoost);
    }
    if (autoBotButton) {
        autoBotButton.addEventListener('click', activateAutoBot);
    }
    if (closeBoostersModalButton) {
        closeBoostersModalButton.addEventListener('click', toggleBoosters);
    }

    updateEnergyBoostCooldownDisplay();
}

function activateEnergyBoost() {
    const now = Date.now();
    if (now - lastEnergyBoostTime >= boostCooldown) {
        energy = maxEnergy;
        lastEnergyBoostTime = now;
        updateUI();
        saveUserData();
        showMessage('Energy fully restored!');
        updateEnergyBoostCooldownDisplay();
    } else {
        showMessage('Energy Boost is not available yet.');
    }
    toggleBoosters();
}

function activateAutoBot() {
    if (tokens >= 200000 && !autoBotPurchased) {
        tokens -= 200000;
        autoBotActive = true;
        autoBotPurchased = true;
        autoBotPurchaseTime = Date.now();
        lastAutoBotCheckTime = Date.now();
        saveUserData();
        updateUI();
        showAutoBotSuccessMessage();
        const autoBotButton = document.getElementById('autoBotButton');
        if (autoBotButton) {
            autoBotButton.textContent = 'AutoBot Activated';
            autoBotButton.disabled = true;
        }
        console.log("AutoBot activated");
        checkAutoBot();
    } else if (autoBotPurchased) {
        showMessage('AutoBot is already purchased.');
    } else {
        showMessage('Not enough tokens to activate AutoBot.');
    }
    toggleBoosters();
}

function showAutoBotSuccessMessage() {
    if (autoBotSuccessModal) {
        autoBotSuccessModal.style.display = 'block';
    }
}

function updateEnergyBoostCooldownDisplay() {
    const now = Date.now();
    const timeRemaining = Math.max(0, lastEnergyBoostTime + boostCooldown - now);
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    localStorage.setItem('lastEnergyBoostTime', lastEnergyBoostTime);

    const cooldownDisplay = document.getElementById('energyBoostCooldownDisplay');
    const energyBoostButton = document.getElementById('energyBoostButton');
    if (cooldownDisplay && energyBoostButton) {
        if (timeRemaining > 0) {
            cooldownDisplay.textContent = `Available in ${hours}h ${minutes}m ${seconds}s`;
            energyBoostButton.disabled = true;
            energyBoostButton.classList.add('disabled');
        } else {
            cooldownDisplay.textContent = 'Energy Boost available!';
            energyBoostButton.disabled = false;
            energyBoostButton.classList.remove('disabled');
        }
    }
}

function showMessage(message) {
    const messageModal = document.getElementById('messageModal');
    const messageModalText = document.getElementById('messageModalText');
    if (messageModalText) {
        messageModalText.textContent = message;
    }
    if (messageModal) {
        messageModal.style.display = 'block';
    }
}

function updateMenuContent() {
    const now = Date.now();
    const giftAvailable = now - lastGiftTime >= boostCooldown;

    if (menuModal) {
        menuModal.innerHTML = `
            <div class="modal-content">
                <h2>Menu</h2>
                <button id="randomGiftButton" class="button" ${giftAvailable ? '' : 'disabled'}>
                    <img src="gift-box.png" alt="Gift">
                    Random Gift
                </button>
                <div id="giftCooldownDisplay"></div>
                <button id="referralButton" class="button">Invite Friends</button>
                <p>Your Referrals: ${referralCount}</p>
                <button id="closeMenuButton" class="button close-btn">X</button>
            </div>
        `;
    }

    const randomGiftButton = document.getElementById('randomGiftButton');
    if (randomGiftButton) {
        randomGiftButton.addEventListener('click', function () {
            if (giftAvailable) {
                const rewards = ['Clicks', 'Tokens', 'Double Tokens'];
                const reward = rewards[Math.floor(Math.random() * rewards.length)];
                let amount;

                switch (reward) {
                    case 'Clicks':
                        amount = Math.floor(Math.random() * (1200 - 600 + 1)) + 600;
                        clicksRemaining += amount;
                        break;
                    case 'Tokens':
                        amount = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
                        tokens += amount * getLevelMultiplier();
                        break;
                    case 'Double Tokens':
                        activateDoubleTokens();
                        amount = null;
                        break;
                }

                updateUI();
                saveUserData();
                showRandomGiftResult(reward, amount);
                lastGiftTime = now;
                updateGiftCooldownDisplay();
            }
        });
    }

    const referralButton = document.getElementById('referralButton');
    if (referralButton) {
        referralButton.addEventListener('click', showReferralLink);
    }

    const closeMenuButton = document.getElementById('closeMenuButton');
    if (closeMenuButton) {
        closeMenuButton.addEventListener('click', toggleMenu);
    }

    updateGiftCooldownDisplay();
}

function showReferralLink() {
    const referralModal = document.getElementById('referralModal');
    if (referralModal) {
        referralModal.style.display = 'block';
    }

    const referralLink = document.getElementById('referralLink');
    if (referralLink) {
        referralLink.value = `https://t.me/Dinozen_bot?start=${telegramId}`;
        console.log("Generated referral link:", referralLink.value);
    }

    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.onclick = function () {
            if (referralLink) {
                referralLink.select();
                document.execCommand('copy');
                this.textContent = 'Copied!';
                setTimeout(() => {
                    this.textContent = 'Copy Link';
                }, 2000);
            }
        };
    }

    const closeReferralModal = document.getElementById('closeReferralModal');
    if (closeReferralModal) {
        closeReferralModal.onclick = function () {
            referralModal.style.display = 'none';
        };
    }
}

function getLevelMultiplier() {
    return 1 + (level - 1) * 0.25;
}

function activateDoubleTokens() {
    const duration = 20000;
    isDoubleTokensActive = true;
    const originalClicksRemaining = clicksRemaining;
    clicksRemaining = Infinity;

    showMessage('Double Tokens activated for 20 seconds! Click as fast as you can!');
    setTimeout(() => {
        document.getElementById('messageModal').style.display = 'none';
    }, 2000);

    const tapInterval = setInterval(() => {
        createTapEffect();
    }, 300);

    setTimeout(() => {
        isDoubleTokensActive = false;
        clicksRemaining = originalClicksRemaining;
        updateUI();
        clearInterval(tapInterval);
    }, duration);
}

function createTapEffect() {
    const tapEffect = document.createElement('div');
    tapEffect.className = 'tap-effect';
    tapEffect.textContent = 'TAP';
    tapEffect.style.left = `${dinoX + Math.random() * dinoWidth}px`;
    tapEffect.style.top = `${dinoY + Math.random() * dinoHeight}px`;
    document.body.appendChild(tapEffect);

    setTimeout(() => {
        tapEffect.remove();
    }, 500);
}

function levelUp() {
    const previousLevel = level;
    level++;
    maxEnergy = level + 2;
    updateDinoImage();
    updateEnergyRefillRate();
    checkLevelUp();
    saveUserData();
    updateUI();
    createLevelUpEffect();
    showLevelUpModal(previousLevel, level);
}

function showLevelUpModal(previousLevel, newLevel) {
    const previousClicks = clickLimits[previousLevel - 1];
    const newClicks = clickLimits[newLevel - 1];
    const previousEnergy = 3 + (previousLevel - 1);
    const newEnergy = 3 + (newLevel - 1);
    const previousRefillRate = previousLevel === 1 ? 0.33 : previousLevel === 2 ? 0.5 : previousLevel === 3 ? 0.67 : previousLevel === 4 ? 1 : 2;
    const newRefillRate = newLevel === 1 ? 0.33 : newLevel === 2 ? 0.5 : newLevel === 3 ? 0.67 : newLevel === 4 ? 1 : 2;

    const levelUpModal = document.getElementById('levelUpModal');
    const levelUpTable = document.getElementById('levelUpTable');

    if (levelUpTable) {
        levelUpTable.innerHTML = `
            <tr>
                <th>Stat</th>
                <th>Previous</th>
                <th>New</th>
            </tr>
            <tr>
                <td>Clicks</td>
                <td>${previousClicks}</td>
                <td>${newClicks}</td>
            </tr>
            <tr>
                <td>Energy</td>
                <td>${previousEnergy}</td>
                <td>${newEnergy}</td>
            </tr>
            <tr>
                <td>Energy Refill Rate</td>
                <td>${previousRefillRate.toFixed(2)}/s</td>
                <td>${newRefillRate.toFixed(2)}/s</td>
            </tr>
        `;
    }

    if (levelUpModal) {
        levelUpModal.style.display = 'block';
    }

    const closeLevelUpModal = document.getElementById('closeLevelUpModal');
    if (closeLevelUpModal) {
        closeLevelUpModal.onclick = function () {
            levelUpModal.style.display = 'none';
        };
    }
}

function checkDailyLogin() {
    console.log("Checking daily login...");
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    console.log("Current date:", currentDate);
    console.log("Last login date:", lastLoginDate);

    if (!lastLoginDate || new Date(lastLoginDate) < currentDate) {
        const reward = calculateDailyReward(dailyStreak + 1);
        console.log(`Daily reward calculated: ${reward} tokens, Streak: ${dailyStreak + 1}`);

        showLoginStreakModal(reward);
    } else {
        console.log("Same day, no reward.");
    }
}

function calculateDailyReward(streak) {
    const rewardTable = [
        1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
        11500, 13000, 14500, 16000, 17500, 19000, 20500, 22000, 23500, 25000,
        27000, 29000, 31000, 33000, 35000, 37000, 39000, 41000, 43000, 45000
    ];
    return rewardTable[Math.min(streak - 1, rewardTable.length - 1)];
}

function showLoginStreakModal(reward) {
    if (loginStreakMessage) {
        loginStreakMessage.textContent = `Daily login reward: ${formatNumber(reward)} tokens! Streak: ${dailyStreak} days`;
    }
    if (loginStreakModal) {
        loginStreakModal.style.display = 'block';
    }
    
    const claimRewardButton = document.getElementById('claimDailyReward');
    if (claimRewardButton) {
        claimRewardButton.disabled = false;
        claimRewardButton.textContent = 'Claim Reward';
        claimRewardButton.onclick = async function() {
            try {
                const response = await fetch(`${BACKEND_URL}/api/claimDailyReward`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ telegramId, reward }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                tokens += reward;
                dailyStreak += 1;
                lastLoginDate = new Date();
                updateUI();
                saveUserData();
                showMessage(`You claimed your daily reward of ${formatNumber(reward)} tokens!`);
                loginStreakModal.style.display = 'none';
                this.disabled = true;
                this.textContent = 'Claimed';
            } catch (error) {
                console.error('Error claiming daily reward:', error);
                showMessage('Failed to claim daily reward. Please try again later.');
            }
        };
    }
}

function updateDailyRewardDisplay() {
    if (dailyRewardDisplay) {
        dailyRewardDisplay.textContent = `Daily Streak: ${dailyStreak} days`;
    }
}

function increaseClicks() {
    const maxClicks = getMaxClicksForLevel();
    if (clicksRemaining < maxClicks) {
        const increase = getClickIncreaseRate();
        clicksRemaining = Math.min(clicksRemaining + increase, maxClicks);
        console.log(`Clicks increased by ${increase}. New value: ${clicksRemaining}`);
        updateUI();
    }
}

function getClickIncreaseRate() {
    switch (level) {
        case 1: return 1 / 3; // Saniyede 0.33 click
        case 2: return 1 / 2; // Saniyede 0.5 click
        case 3: return 2 / 3; // Saniyede 0.67 click
        case 4: return 1;     // Saniyede 1 click
        default: return 2;    // Saniyede 2 click (level 5 ve üstü için)
    }
}

function getMaxClicksForLevel() {
    const clickLimits = [300, 500, 1000, 1500, 2000];
    return clickLimits[level - 1] || clickLimits[clickLimits.length - 1];
}

function updateEnergyRefillRate() {
    switch (level) {
        case 1: energyRefillRate = 1 / 3; break;
        case 2: energyRefillRate = 1 / 2; break;
        case 3: energyRefillRate = 2 / 3; break;
        case 4: energyRefillRate = 1; break;
        default: energyRefillRate = 2;
    }
    console.log(`Energy refill rate updated: ${energyRefillRate.toFixed(2)}/s`);
}

function checkAutoBot() {
    console.log("Checking AutoBot...");
    const currentTime = Date.now();
    const inactiveTime = (currentTime - lastPlayerActivityTime) / 1000; // saniye cinsinden

    if (autoBotActive && autoBotPurchased && inactiveTime >= 60) { // Oyuncu en az 1 dakika inaktif olmalı
        const timeSinceLastCheck = (currentTime - lastAutoBotCheckTime) / 1000; // saniye cinsinden
        const maxEarningTime = 4 * 60 * 60; // 4 saat saniye cinsinden

        if (timeSinceLastCheck > 0) {
            const earningTime = Math.min(timeSinceLastCheck, maxEarningTime);
            const tokensPerSecond = level * 0.1;
            const newTokens = Math.floor(earningTime * tokensPerSecond);
            
            autoBotTokens += newTokens;
            lastAutoBotCheckTime = currentTime;
            
            console.log(`AutoBot earned ${newTokens} tokens. Total: ${autoBotTokens}`);
            console.log(`Time since last check: ${timeSinceLastCheck} seconds`);
            console.log(`Earning time: ${earningTime} seconds`);
            
            saveUserData();

            if (autoBotTokens > 0 && !autoBotShownThisSession) {
                showAutoBotEarnings();
                autoBotShownThisSession = true;
            }
        } else {
            console.log("No time has passed since last check.");
        }
    } else {
        console.log("AutoBot is not active, not purchased, or player is active.");
    }
}

function checkAutoBotOnStartup() {
    console.log("Checking AutoBot on startup...");
    if (autoBotPurchased) {
        const currentTime = Date.now();
        const timeSinceLastCheck = (currentTime - lastAutoBotCheckTime) / 1000; // saniye cinsinden
        const maxEarningTime = 4 * 60 * 60; // 4 saat saniye cinsinden

        const earningTime = Math.min(timeSinceLastCheck, maxEarningTime);
        const tokensPerSecond = level * 0.1;
        const newTokens = Math.floor(earningTime * tokensPerSecond);
        
        if (newTokens > 0) {
            autoBotTokens += newTokens;
            lastAutoBotCheckTime = currentTime;
            
            console.log(`AutoBot earned ${newTokens} tokens. Total: ${autoBotTokens}`);
            saveUserData();
            showAutoBotEarnings();
        } else {
            console.log("No new tokens earned by AutoBot.");
        }
    } else {
        console.log("AutoBot is not purchased.");
    }
}

function showAutoBotEarnings() {
    if (autoBotTokensCollected) {
        autoBotTokensCollected.textContent = formatNumber(autoBotTokens);
    }
    if (autoBotEarningsModal) {
        autoBotEarningsModal.style.display = 'block';
    }

    if (claimAutoBotTokens) {
        claimAutoBotTokens.onclick = function () {
            tokens += autoBotTokens;
            showMessage(`You claimed ${formatNumber(autoBotTokens)} tokens from AutoBot!`);
            autoBotTokens = 0;
            updateUI();
            saveUserData();
            if (autoBotEarningsModal) {
                autoBotEarningsModal.style.display = 'none';
            }
        };
    }

    const closeAutoBotEarningsModal = document.getElementById('closeAutoBotEarningsModal');
    if (closeAutoBotEarningsModal) {
        closeAutoBotEarningsModal.onclick = function () {
            if (autoBotEarningsModal) {
                autoBotEarningsModal.style.display = 'none';
            }
        };
    }
}

function showRandomGiftResult(reward, amount) {
    const randomGiftModal = document.getElementById('randomGiftResultModal');
    const randomGiftResultMessage = document.getElementById('randomGiftResultMessage');
    if (randomGiftResultMessage) {
        randomGiftResultMessage.textContent = `You won: ${reward} ${amount ? `(${formatNumber(amount)})` : ''}`;
    }
    if (randomGiftModal) {
        randomGiftModal.style.display = 'block';
    }

    const closeRandomGiftResultModal = document.getElementById('closeRandomGiftResultModal');
    if (closeRandomGiftResultModal) {
        closeRandomGiftResultModal.onclick = function () {
            randomGiftModal.style.display = 'none';
        };
    }
}

function showTasks() {
    if (tasksModal) {
        tasksModal.style.display = 'block';
    }
    updateTaskButtons();
}

function updateTaskButtons() {
    const followUsButton = document.getElementById('followUsButton');
    const visitWebsiteButton = document.getElementById('visitWebsiteButton');

    if (followUsButton) {
        if (completedTasks.includes('followX')) {
            followUsButton.textContent = 'COMPLETED';
            followUsButton.disabled = true;
        } else {
            followUsButton.textContent = 'START';
            followUsButton.disabled = false;
        }
    }

    if (visitWebsiteButton) {
        if (completedTasks.includes('visitWebsite')) {
            visitWebsiteButton.textContent = 'COMPLETED';
            visitWebsiteButton.disabled = true;
        } else {
            visitWebsiteButton.textContent = 'START';
            visitWebsiteButton.disabled = false;
        }
    }
}

function startTask(taskType) {
    if (completedTasks.includes(taskType)) {
        showMessage('You have already completed this task!');
        return;
    }

    let url, buttonId;

    if (taskType === 'followX') {
        url = 'https://x.com/dinozenofficial';
        buttonId = 'followUsButton';
    } else if (taskType === 'visitWebsite') {
        url = 'https://www.dinozen.online/';
        buttonId = 'visitWebsiteButton';
    }

    const taskWindow = window.open(url, '_blank');
    const button = document.getElementById(buttonId);
    if (button) {
        button.textContent = 'CHECKING...';
        button.disabled = true;
    }

    setTimeout(() => {
        if (taskWindow && !taskWindow.closed) {
            completeTask(taskType);
            taskWindow.close();
        } else {
            if (button) {
                button.textContent = 'START';
                button.disabled = false;
            }
            showMessage('Please keep the task window open for at least 5 seconds to complete the task.');
        }
    }, 5000);
}

function completeTask(taskType) {
    if (!completedTasks.includes(taskType)) {
        completedTasks.push(taskType);
        tokens += 1000;
        updateUI();
        saveUserData();
        showMessage('Task completed! You earned 1000 tokens.');
        updateTaskButtons();
    }
}

function showDailyStreaks() {
    populateRewardPages();
    if (rewardTableModal) {
        rewardTableModal.style.display = 'block';
    }
}

function populateRewardPages() {
    const page1 = document.getElementById('rewardPage1');
    const page2 = document.getElementById('rewardPage2');

    if (page1) {
        page1.innerHTML = rewardData.slice(0, 15).map(r => createRewardItem(r.day, r.tokens, r.day <= dailyStreak)).join('');
    }
    if (page2) {
        page2.innerHTML = rewardData.slice(15).map(r => createRewardItem(r.day, r.tokens, r.day <= dailyStreak)).join('');
    }
}

function createRewardItem(day, tokens, isClaimable) {
    return `
        <div class="reward-item ${isClaimable ? 'claimable' : ''}" data-day="${day}">
            <span>Day ${day}: <img src="token.png" alt="token" style="width: 16px; height: 16px;"> ${tokens} tokens</span>
        </div>
    `;
}

let currentPage = 1;

function toggleRewardPage() {
    const page1 = document.getElementById('rewardPage1');
    const page2 = document.getElementById('rewardPage2');
    const prevBtn = document.getElementById('prevRewardPage');
    const nextBtn = document.getElementById('nextRewardPage');

    if (page1 && page2 && prevBtn && nextBtn) {
        if (currentPage === 1) {
            page1.style.display = 'none';
            page2.style.display = 'block';
            prevBtn.disabled = false;
            nextBtn.disabled = true;
            currentPage = 2;
        } else {
            page1.style.display = 'block';
            page2.style.display = 'none';
            prevBtn.disabled = true;
            nextBtn.disabled = false;
            currentPage = 1;
        }
    }
}

function increaseEnergy() {
    const now = Date.now();
    const timePassed = now - lastEnergyRefillTime;
    const energyToAdd = Math.floor(timePassed / (5 * 60 * 1000)); // Her 5 dakikada 1 enerji

    if (energyToAdd > 0) {
        energy = Math.min(energy + energyToAdd, maxEnergy);
        lastEnergyRefillTime = now;
        saveUserData();
        updateUI();
    }
}

window.addEventListener('resize', resizeCanvas);

// Düzenli Veri Kaydetme (her saniye)
setInterval(saveUserData, 5000);

window.addEventListener('DOMContentLoaded', function () {
    showLoading(); // Sayfa yüklenirken yükleme ekranını göster
    const urlParams = new URLSearchParams(window.location.search);
    const userTelegramId = urlParams.get('id');
    if (userTelegramId) {
        telegramId = userTelegramId;
        console.log("Telegram ID set to:", telegramId);
        loadUserData()
            .then(() => {
                loadDinoImages();
                startGame();
            })
            .catch(error => {
                console.error("Error loading user data:", error);
                hideLoading(); // Hata durumunda yükleme ekranını gizle
                showMessage("Failed to load user data. Please refresh the page.");
            });
    } else {
        console.log("No Telegram ID found in URL");
        hideLoading(); // Telegram ID bulunamadığında yükleme ekranını gizle
        showMessage("No Telegram ID found. Please start the game from the Telegram bot.");
    }
});

window.addEventListener('DOMContentLoaded', function() {
    const savedLastEnergyBoostTime = localStorage.getItem('lastEnergyBoostTime');
    if (savedLastEnergyBoostTime) {
        lastEnergyBoostTime = parseInt(savedLastEnergyBoostTime);
        updateEnergyBoostCooldownDisplay();
    }
});

window.addEventListener('beforeunload', function() {
    clearInterval(saveInterval);
    saveUserData();
});

const rewardData = [
    { day: 1, tokens: 1000 }, { day: 2, tokens: 2000 }, { day: 3, tokens: 3000 },
    { day: 4, tokens: 4000 }, { day: 5, tokens: 5000 }, { day: 6, tokens: 6000 },
    { day: 7, tokens: 7000 }, { day: 8, tokens: 8000 }, { day: 9, tokens: 9000 },
    { day: 10, tokens: 10000 }, { day: 11, tokens: 11500 }, { day: 12, tokens: 13000 },
    { day: 13, tokens: 14500 }, { day: 14, tokens: 16000 }, { day: 15, tokens: 17500 },
    { day: 16, tokens: 19000 }, { day: 17, tokens: 20500 }, { day: 18, tokens: 22000 },
    { day: 19, tokens: 23500 }, { day: 20, tokens: 25000 }, { day: 21, tokens: 27000 },
    { day: 22, tokens: 29000 }, { day: 23, tokens: 31000 }, { day: 24, tokens: 33000 },
    { day: 25, tokens: 35000 }, { day: 26, tokens: 37000 }, { day: 27, tokens: 39000 },
    { day: 28, tokens: 41000 }, { day: 29, tokens: 43000 }, { day: 30, tokens: 45000 }
];

function preloadImages() {
    const images = ['dino1.png', 'dino2.png', 'dino3.png', 'dino4.png', 'dino5.png', 'token.png', 'gift-box.png', 'autobot.png', 'boost.png'];
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}
