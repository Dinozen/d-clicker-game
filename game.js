console.log("Game script loaded");

// Oyun değişkenleri
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

// Level gereksinimleri
const levelRequirements = [0, 3000, 8000, 20000, 40000];
const clickLimits = [300, 500, 1000, 1500, 2000];

// DOM elementleri
let canvas, ctx, earnButton, tasksButton, boostButton, dailyRewardsButton, menuModal, dailyRewardDisplay, boostersModal, tasksModal, rewardTableModal;
let autoBotSuccessModal, autoBotEarningsModal; 

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

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    if (currentTime - lastDrawTime > 1000 / FRAME_RATE) {
        // Oyun mantığı
        if (currentTime - lastClickIncreaseTime > 1000) {
            increaseClicks();
            lastClickIncreaseTime = currentTime;
        }
        
        if (currentTime - lastCooldownUpdateTime > 1000) {
            updateGiftCooldownDisplay();
            updateEnergyBoostCooldownDisplay();
            lastCooldownUpdateTime = currentTime;
        }
        
        // AutoBot kontrolünü daha az sıklıkta yap
        if (currentTime - lastAutoCheckTime > AUTO_CHECK_INTERVAL) {
            checkAutoBot();
            lastAutoCheckTime = currentTime;
        }

        animateDino();
        updateUI();
        
        // Çizim işlemleri
        drawDino();

        lastDrawTime = currentTime;
    }
}

function startGame() {
    console.log("Starting game");
    logToOverlay("Game started");
    initializeDOM();
    loadUserData();
    loadDinoImages();
    resizeCanvas();
    setupClickHandler();
    setupResizeHandler();
    preloadImages();

    checkDailyLogin();
    updateTaskButtons();
    
    requestAnimationFrame(gameLoop);
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

    earnButton.addEventListener('click', toggleMenu);
    tasksButton.addEventListener('click', showTasks);
    boostButton.addEventListener('click', toggleBoosters);
    dailyRewardsButton.addEventListener('click', showDailyStreaks);

    document.getElementById('nextRewardPage').addEventListener('click', toggleRewardPage);
    document.getElementById('prevRewardPage').addEventListener('click', toggleRewardPage);
    document.getElementById('closeRewardTableButton').addEventListener('click', () => {
        rewardTableModal.style.display = 'none';
    });
    document.getElementById('followUsButton').addEventListener('click', () => startTask('followX'));
    document.getElementById('visitWebsiteButton').addEventListener('click', () => startTask('visitWebsite'));
    document.getElementById('closeTasksModal').addEventListener('click', () => {
        tasksModal.style.display = 'none';
    });

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('click', handleClick);
}

function loadUserData() {
    logToOverlay("Loading user data for telegramId: " + telegramId);
    const savedData = localStorage.getItem(telegramId);
    if (savedData) {
        const data = JSON.parse(savedData);
        tokens = data.tokens || 0;
        level = data.level || 1;
        completedTasks = data.completedTasks || [];
        energy = data.energy || 3;
        maxEnergy = data.maxEnergy || level + 2;
        lastEnergyRefillTime = new Date(data.lastEnergyRefillTime).getTime() || Date.now();
        clicksRemaining = data.clicksRemaining || 300;
        boostAvailable = data.boostAvailable !== undefined ? data.boostAvailable : true;
        dailyStreak = data.dailyStreak || 0;
        lastLoginDate = data.lastLoginDate ? new Date(data.lastLoginDate) : null;
        lastGiftTime = data.lastGiftTime || 0;
        lastEnergyBoostTime = data.lastEnergyBoostTime || 0;
        referralCount = data.referralCount || 0;
        autoBotActive = data.autoBotActive || false;
        autoBotPurchased = data.autoBotPurchased || false;
        autoBotTokens = data.autoBotTokens || 0;
        autoBotPurchaseTime = data.autoBotPurchaseTime || 0;
        lastAutoBotCheckTime = data.lastAutoBotCheckTime || 0;
        logToOverlay("User data loaded: " + JSON.stringify(data));
    } else {
        logToOverlay("No saved data found for this user");
    }
    updateDinoImage();
}

function saveUserData() {
    const data = {
        tokens,
        level,
        energy,
        maxEnergy,
        lastEnergyRefillTime,
        clicksRemaining,
        boostAvailable,
        dailyStreak,
        lastLoginDate,
        lastGiftTime,
        lastEnergyBoostTime,
        referralCount,
        autoBotActive,
        autoBotPurchased,
        autoBotTokens,
        autoBotPurchaseTime,
        lastAutoBotCheckTime,
        completedTasks
    };
    localStorage.setItem(telegramId, JSON.stringify(data));
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
    const scale = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawDino();
}

function drawDino() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentDinoImage && currentDinoImage.complete) {
        const canvasAspectRatio = canvas.width / canvas.height;
        const imageAspectRatio = currentDinoImage.naturalWidth / currentDinoImage.naturalHeight;
        let drawWidth, drawHeight;

        if (canvasAspectRatio > imageAspectRatio) {
            drawHeight = canvas.height * 0.4;
            drawWidth = drawHeight * imageAspectRatio;
        } else {
            drawWidth = canvas.width * 0.4;
            drawHeight = drawWidth / imageAspectRatio;
        }

        dinoWidth = Math.round(drawWidth * clickScale);
        dinoHeight = Math.round(drawHeight * clickScale);
        dinoX = Math.round((canvas.width - dinoWidth) / 2);
        dinoY = Math.round((canvas.height - dinoHeight) / 2);

        // Daire çizimi
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const circleRadius = Math.max(dinoWidth, dinoHeight) / 2 + 10;

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
        logToOverlay("Dino clicked!");
        let tokenGain = 1 * getLevelMultiplier();
        if (isDoubleTokensActive) {
            tokenGain *= 2;
        }

        createClickEffect(event.clientX, event.clientY, tokenGain);
        isClicking = true;
        clickScale = 1.1;

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
    return number.toFixed(2).slice(0, 5);  // En fazla 5 karakter göster
}

function updateUI() {
    if (tokens !== cachedTokens) {
        document.getElementById('tokenDisplay').textContent = formatNumber(tokens);
        cachedTokens = tokens;
    }

    document.getElementById('energyDisplay').textContent = `${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = formatClicks(clicksRemaining);
    document.getElementById('levelDisplay').textContent = `${level}`;

    updateDailyRewardDisplay();
    updateGiftCooldownDisplay();
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
    function loadSingleImage(index) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = `dino${index}.png`;
            img.onload = () => {
                logToOverlay(`Dino image ${index} loaded successfully`);
                resolve(img);
            };
            img.onerror = (error) => {
                logToOverlay(`Failed to load dino image ${index}: ${error}`);
                reject(error);
            };
        });
    }

    const promises = [];
    for (let i = 1; i <= 5; i++) {
        promises.push(loadSingleImage(i));
    }

    Promise.all(promises)
        .then((loadedImages) => {
            dinoImages.push(...loadedImages);
            logToOverlay(`All dino images loaded. Total: ${dinoImages.length}`);
            updateDinoImage();
            drawDino(); // Resimleri yükledikten hemen sonra çiz
        })
        .catch((error) => {
            logToOverlay(`Error loading dino images: ${error}`);
        });
}

function updateDinoImage() {
    const dinoIndex = Math.min(level - 1, 4);
    currentDinoImage = dinoImages[dinoIndex];
    logToOverlay(`Updating dino image for level: ${level}`);
    logToOverlay(`Dino index: ${dinoIndex}`);
    if (currentDinoImage) {
        logToOverlay(`Current dino image src: ${currentDinoImage.src}`);
        drawDino();
    } else {
        logToOverlay(`Dino image not found for index: ${dinoIndex}`);
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
        logToOverlay('Boosters modal not found');
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
                    <p>(10,000 tokens)</p>
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
    if (tokens >= 10000 && !autoBotPurchased) {
        tokens -= 10000;
        autoBotActive = true;
        autoBotPurchased = true;
        autoBotPurchaseTime = Date.now();
        lastAutoBotCheckTime = Date.now();
        saveUserData();
        updateUI();
        showAutoBotSuccessMessage();
        document.getElementById('autoBotButton').textContent = 'AutoBot Activated';
        document.getElementById('autoBotButton').disabled = true;
    } else if (autoBotPurchased) {
        showMessage('AutoBot is already purchased.');
    } else {
        showMessage('Not enough tokens to activate AutoBot.');
    }
    toggleBoosters();
}

function showAutoBotSuccessMessage() {
    autoBotSuccessModal.style.display = 'block';
    document.getElementById('closeAutoBotSuccessModal').onclick = function () {
        autoBotSuccessModal.style.display = 'none';
    };
}

function updateEnergyBoostCooldownDisplay() {
    const now = Date.now();
    const timeRemaining = Math.max(0, lastEnergyBoostTime + boostCooldown - now);
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

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
    const messageModal = document.createElement('div');
    messageModal.className = 'modal';
    messageModal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            <button id="closeMessageModal" class="button">OK</button>
        </div>
    `;
    document.body.appendChild(messageModal);
    messageModal.style.display = 'block';
    
    const closeModal = () => {
        messageModal.style.display = 'none';
        document.body.removeChild(messageModal);
    };

    document.getElementById('closeMessageModal').onclick = closeModal;

    // 10 saniye sonra otomatik olarak kapat
    setTimeout(closeModal, 10000);
}

function updateMenuContent() {
    const now = Date.now();
    const giftAvailable = now - lastGiftTime >= boostCooldown;

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

    document.getElementById('randomGiftButton').addEventListener('click', function () {
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
            lastGiftTime = Date.now();
            updateGiftCooldownDisplay();
        }
    });

    document.getElementById('referralButton').addEventListener('click', showReferralLink);
    document.getElementById('closeMenuButton').addEventListener('click', toggleMenu);
    updateGiftCooldownDisplay();
}

function showReferralLink() {
    const referralModal = document.getElementById('referralModal');
    referralModal.style.display = 'block';

    const referralLink = document.getElementById('referralLink');
    referralLink.value = `https://t.me/Dinozen_bot?start=${telegramId}`;

    document.getElementById('copyButton').onclick = function () {
        referralLink.select();
        document.execCommand('copy');
        this.textContent = 'Copied!';
        setTimeout(() => {
            this.textContent = 'Copy Link';
        }, 2000);
    };

    document.getElementById('closeReferralModal').onclick = function () {
        referralModal.style.display = 'none';
    };
}

function getLevelMultiplier() {
    return 1 + (level - 1) * 0.25;
}

function activateDoubleTokens() {
    const duration = 20000;
    isDoubleTokensActive = true;
    const originalClicksRemaining = clicksRemaining;
    clicksRemaining = Infinity;
    setTimeout(() => {
        isDoubleTokensActive = false;
        clicksRemaining = originalClicksRemaining;
        updateUI();
    }, duration);
    showMessage('Double Tokens activated for 20 seconds! Click as fast as you can!');
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

    const levelUpModal = document.createElement('div');
    levelUpModal.className = 'modal';
    levelUpModal.innerHTML = `
        <div class="modal-content">
            <h3>Level Up!</h3>
            <p>Congratulations! Your Dino reached Level ${newLevel}!</p>
            <p>Here are your updated stats:</p>
            <table>
                <tr>
                    <th>Stat</th>
                    <th>Previous</th>
                    <th></th>
                    <th>New</th>
                </tr>
                <tr>
                    <td>Clicks</td>
                    <td>${previousClicks}</td>
                    <td>→</td>
                    <td>${newClicks}</td>
                </tr>
                <tr>
                    <td>Energy</td>
                    <td>${previousEnergy}</td>
                    <td>→</td>
                    <td>${newEnergy}</td>
                </tr>
                <tr>
                    <td>Energy Refill Rate</td>
                    <td>${previousRefillRate.toFixed(2)}/s</td>
                    <td>→</td>
                    <td>${newRefillRate.toFixed(2)}/s</td>
                </tr>
            </table>
            <button id="closeLevelUpModal" class="close-btn">X</button>
        </div>
    `;
    document.body.appendChild(levelUpModal);
    levelUpModal.style.display = 'block';

    document.getElementById('closeLevelUpModal').onclick = function () {
        levelUpModal.style.display = 'none';
        document.body.removeChild(levelUpModal);
    };
}

function checkDailyLogin() {
    const currentDate = new Date();
    const offset = 3 * 60 * 60 * 1000; // 3 saat offset (UTC+3)
    currentDate.setTime(currentDate.getTime() + offset);
    currentDate.setUTCHours(0, 0, 0, 0); // Günün başlangıcı (UTC+3'e göre)

    if (!lastLoginDate || new Date(lastLoginDate) < currentDate) {
        dailyStreak++;
        if (dailyStreak > 30) dailyStreak = 1;
        lastLoginDate = currentDate.toISOString();

        const reward = calculateDailyReward(dailyStreak);

        const loginStreakModal = document.getElementById('loginStreakModal');
        const loginStreakMessage = document.getElementById('loginStreakMessage');
        const claimRewardButton = document.getElementById('claimDailyReward');

        loginStreakMessage.textContent = `Daily login reward: ${formatNumber(reward)} tokens! Streak: ${dailyStreak} days`;
        loginStreakModal.style.display = 'block';

        claimRewardButton.onclick = function () {
            tokens += reward;
            updateUI();
            saveUserData();
            loginStreakModal.style.display = 'none';
        };
    }
}

function calculateDailyReward(streak) {
    const rewardTable = [
        1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
        11500, 13000, 14500, 16000, 17500, 19000, 20500, 22000, 23500, 25000,
        27000, 29000, 31000, 33000, 35000, 37000, 39000, 41000, 43000, 45000
    ];
    return rewardTable[streak - 1] || rewardTable[rewardTable.length - 1];
}

function updateDailyRewardDisplay() {
    if (dailyRewardDisplay) {
        dailyRewardDisplay.textContent = `Daily Streak: ${dailyStreak} days`;
    }
}

function increaseClicks() {
    const maxClicks = getMaxClicksForLevel();
    if (clicksRemaining < maxClicks) {
        clicksRemaining = Math.min(clicksRemaining + energyRefillRate, maxClicks);
        updateUI();
    }
}

function getMaxClicksForLevel() {
    return clickLimits[level - 1] || clickLimits[clickLimits.length - 1];
}

function updateEnergyRefillRate() {
    switch (level) {
        case 1:
            energyRefillRate = 1 / 3;
            break;
        case 2:
            energyRefillRate = 1 / 2;
            break;
        case 3:
            energyRefillRate = 2 / 3;
            break;
        case 4:
            energyRefillRate = 1;
            break;
        case 5:
            energyRefillRate = 2;
            break;
        default:
            energyRefillRate = 2;
    }
}

function checkAutoBot() {
    if (autoBotActive) {
        const currentTime = Date.now();
        const elapsedTime = Math.min((currentTime - lastAutoBotCheckTime) / 1000, 4 * 60 * 60); // Maximum 4 hours
        const tokensPerSecond = level * 0.1;
        const newTokens = Math.floor(elapsedTime * tokensPerSecond);
        autoBotTokens += newTokens;
        lastAutoBotCheckTime = currentTime;
        saveUserData();

        if (autoBotTokens > 0) {
            showAutoBotEarnings();
        }
    }
}

function showAutoBotEarnings() {
    document.getElementById('autoBotTokensCollected').textContent = formatNumber(autoBotTokens);
    autoBotEarningsModal.style.display = 'block';

    document.getElementById('claimAutoBotTokens').onclick = function () {
        tokens += autoBotTokens;
        autoBotTokens = 0;
        updateUI();
        saveUserData();
        autoBotEarningsModal.style.display = 'none';
    };

    document.getElementById('closeAutoBotEarningsModal').onclick = function () {
        autoBotEarningsModal.style.display = 'none';
    };
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function showRandomGiftResult(reward, amount) {
    const randomGiftModal = document.createElement('div');
    randomGiftModal.className = 'modal';
    randomGiftModal.innerHTML = `
        <div class="modal-content">
            <h3>Random Gift</h3>
            <p>You won: ${reward} ${amount ? `(${formatNumber(amount)})` : ''}</p>
            <button id="closeRandomGiftModal" class="close-btn">X</button>
        </div>
    `;
    document.body.appendChild(randomGiftModal);
    randomGiftModal.style.display = 'block';

    document.getElementById('closeRandomGiftModal').onclick = function () {
        randomGiftModal.style.display = 'none';
        document.body.removeChild(randomGiftModal);
    };
}

function showTasks() {
    tasksModal.style.display = 'block';
    updateTaskButtons();
}

function updateTaskButtons() {
    const followUsButton = document.getElementById('followUsButton');
    const visitWebsiteButton = document.getElementById('visitWebsiteButton');

    if (completedTasks.includes('followX')) {
        followUsButton.textContent = 'COMPLETED';
        followUsButton.disabled = true;
    } else {
        followUsButton.textContent = 'START';
        followUsButton.disabled = false;
    }

    if (completedTasks.includes('visitWebsite')) {
        visitWebsiteButton.textContent = 'COMPLETED';
        visitWebsiteButton.disabled = true;
    } else {
        visitWebsiteButton.textContent = 'START';
        visitWebsiteButton.disabled = false;
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
    button.textContent = 'CHECKING...';
    button.disabled = true;

    setTimeout(() => {
        if (taskWindow && !taskWindow.closed) {
            completeTask(taskType);
            taskWindow.close();
        } else {
            button.textContent = 'START';
            button.disabled = false;
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
    document.getElementById('rewardTableModal').style.display = 'block';
}

function populateRewardPages() {
    const page1 = document.getElementById('rewardPage1');
    const page2 = document.getElementById('rewardPage2');

    page1.innerHTML = rewardData.slice(0, 15).map(r => createRewardItem(r.day, r.tokens, r.day <= dailyStreak)).join('');
    page2.innerHTML = rewardData.slice(15).map(r => createRewardItem(r.day, r.tokens, r.day <= dailyStreak)).join('');
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

window.addEventListener('resize', resizeCanvas);

setInterval(() => {
    saveUserData();
}, 1000);

window.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userTelegramId = urlParams.get('id');
    if (userTelegramId) {
        telegramId = userTelegramId;
    }
    loadDinoImages();
    startGame();
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

document.getElementById('closeWheelResultModal').onclick = function () {
    document.getElementById('wheelResultModal').style.display = 'none';
};

const MAX_LOG_LINES = 50;

function logToOverlay(message) {
    const debugOverlay = document.getElementById('debugOverlay');
    if (debugOverlay) {
        const lines = debugOverlay.innerHTML.split('<br>');
        if (lines.length > MAX_LOG_LINES) {
            lines.splice(0, lines.length - MAX_LOG_LINES);
        }
        lines.push(message);
        debugOverlay.innerHTML = lines.join('<br>');
        debugOverlay.scrollTop = debugOverlay.scrollHeight;
    }
    console.log(message);
}

function preloadImages() {
    const images = ['dino1.png', 'dino2.png', 'dino3.png', 'dino4.png', 'dino5.png', 'token.png', 'gift-box.png', 'autobot.png'];
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Debug overlay'i görünür yap
document.getElementById('debugOverlay').style.display = 'block';