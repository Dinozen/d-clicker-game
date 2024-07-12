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
const boostCooldown = 12 * 60 * 60 * 1000; // 12 saat
let dailyStreak = 0;
let lastLoginDate = null;
let lastGiftTime = 0;
let referralCount = 0;
let isDoubleTokensActive = false;
let autoBotActive = false;
let autoBotPurchased = false;
let autoBotTokens = 0;

// Level gereksinimleri
const levelRequirements = [0, 2000, 5000, 10000, 20000];
const clickLimits = [300, 500, 1000, 1500, 2000];

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuButton = document.getElementById('menuButton');
const menuModal = document.getElementById('menuModal');
const dailyRewardDisplay = document.getElementById('dailyRewardDisplay');
const boostersButton = document.getElementById('boostersButton');
const boostersModal = document.getElementById('boostersModal');
const levelUpModal = document.createElement('div');
const autoBotModal = document.createElement('div');

// Modal stilleri
levelUpModal.classList.add('modal');
autoBotModal.classList.add('modal');
document.body.appendChild(levelUpModal);
document.body.appendChild(autoBotModal);

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
    menuButton.addEventListener('click', toggleMenu);
    boostersButton.addEventListener('click', toggleBoosters);
    animateDino();
    checkDailyLogin();
    setInterval(increaseClicks, 6000); // Her 6 saniyede bir click hakkı artır
}

function loadUserData() {
    console.log("Loading user data for telegramId:", telegramId);
    const savedData = localStorage.getItem(telegramId);
    if (savedData) {
        const data = JSON.parse(savedData);
        tokens = data.tokens;
        level = data.level;
        energy = data.energy;
        maxEnergy = data.maxEnergy || level + 2;
        lastEnergyRefillTime = new Date(data.lastEnergyRefillTime).getTime();
        clicksRemaining = data.clicksRemaining;
        boostAvailable = data.boostAvailable;
        dailyStreak = data.dailyStreak || 0;
        lastLoginDate = data.lastLoginDate ? new Date(data.lastLoginDate) : null;
        lastGiftTime = data.lastGiftTime || 0;
        referralCount = data.referralCount || 0;
        autoBotActive = data.autoBotActive || false;
        autoBotPurchased = data.autoBotPurchased || false;
        console.log("User data loaded:", data);
    } else {
        console.log("No saved data found for this user");
    }
    updateUI();
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
        referralCount,
        autoBotActive,
        autoBotPurchased
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
        const scale = Math.min(window.innerWidth / currentDinoImage.naturalWidth, window.innerHeight / currentDinoImage.naturalHeight) * 0.4;
        dinoWidth = Math.round(currentDinoImage.naturalWidth * scale * clickScale);
        dinoHeight = Math.round(currentDinoImage.naturalHeight * scale * clickScale);
        dinoX = Math.round((window.innerWidth - dinoWidth) / 2);
        dinoY = Math.round((window.innerHeight - dinoHeight) / 2);
        
        // Arka plan dairesi çiz
        const centerX = dinoX + dinoWidth / 2;
        const centerY = dinoY + dinoHeight / 2;
        const circleRadius = Math.max(dinoWidth, dinoHeight) / 2 + 5;
        
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
    canvas.addEventListener('touchstart', handleMultiTouch, { passive: false });
    canvas.addEventListener('touchend', handleMultiTouch, { passive: false });
    canvas.addEventListener('click', handleClick);
}

function handleMultiTouch(event) {
    event.preventDefault();
    for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        handleClick(touch);
    }
}

function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio;
    const x = (event.clientX || event.touches[0].clientX - rect.left) * scale;
    const y = (event.clientY || event.touches[0].clientY - rect.top) * scale;

    console.log(`Click at: (${x}, ${y})`);
    console.log(`Dino bounds: x=${dinoX * scale}, y=${dinoY * scale}, width=${dinoWidth * scale}, height=${dinoHeight * scale}`);

    if (x >= dinoX * scale && x <= (dinoX + dinoWidth) * scale && 
        y >= dinoY * scale && y <= (dinoY + dinoHeight) * scale) {
        console.log("Dino clicked!");
        if (energy > 0) {
            if (clicksRemaining <= 0) {
                energy--;
                clicksRemaining = getMaxClicksForLevel();
            }
            let tokenGain = 1 * getLevelMultiplier();
            if (isDoubleTokensActive) {
                tokenGain *= 2;
            }
            tokens += tokenGain;
            clicksRemaining--;
            createClickEffect(event.clientX || event.touches[0].clientX, event.clientY || event.touches[0].clientY, tokenGain);
            isClicking = true;
            clickScale = 1.1;
            updateUI();
            checkLevelUp();
            saveUserData();
        } else {
            clicksRemaining = 0;
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

function setupGameUI() {
    updateUI();
}

function formatNumber(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'K';
    }
    return number;
}

function updateUI() {
    document.getElementById('tokenDisplay').textContent = formatNumber(tokens);
    document.getElementById('energyDisplay').textContent = `${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = formatNumber(clicksRemaining);
    document.getElementById('levelDisplay').textContent = `${level}`;
    updateDailyRewardDisplay();
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
    if (newLevel > level) {
        while (level < newLevel) {
            levelUp();
        }
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
        document.getElementById('autoBotButton').addEventListener('click', activateAutoBot);
        document.getElementById('closeBoostersModal').addEventListener('click', toggleBoosters);
    } else {
        boostersModal.style.display = 'none';
    }
}

function activateAutoBot() {
    if (tokens >= 10000 && !autoBotPurchased) {
        tokens -= 10000;
        autoBotActive = true;
        autoBotPurchased = true;
        saveUserData();
        updateUI();
        showAutoBotModal();
        boostersModal.style.display = 'none'; // Boosters modalını kapat
        document.getElementById('autoBotButton').textContent = 'AutoBot Activated';
        document.getElementById('autoBotButton').disabled = true;
    } else if (autoBotPurchased) {
        showErrorMessage('AutoBot is already purchased.');
    } else {
        showErrorMessage('Not enough tokens to activate AutoBot.');
    }
}

function showAutoBotModal() {
    autoBotModal.innerHTML = `
        <div class="modal-content">
            <h3>AutoBot Activated!</h3>
            <p>Congratulations! AutoBot is now active and will farm tokens while you are inactive.</p>
            <p><b>How it works:</b> AutoBot will collect tokens automatically when you are not playing the game. The collected tokens will be added to your account the next time you log in.</p>
            <button id="closeAutoBotModal" class="close-btn">Close</button>
        </div>
    `;
    autoBotModal.style.display = 'block';

    document.getElementById('closeAutoBotModal').onclick = function() {
        autoBotModal.style.display = 'none';
    };
}

function showErrorMessage(message) {
    const errorModal = document.createElement('div');
    errorModal.className = 'modal';
    errorModal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            <button id="closeErrorModal" class="close-btn">Close</button>
        </div>
    `;
    document.body.appendChild(errorModal);
    errorModal.style.display = 'block';
    document.getElementById('closeErrorModal').onclick = function() {
        errorModal.style.display = 'none';
        document.body.removeChild(errorModal);
    };
}

function updateMenuContent() {
    const now = Date.now();
    const giftAvailable = now - lastGiftTime >= boostCooldown;
    const randomGiftButtonText = giftAvailable ? 'Random Gift' : 'Random Gift (Available in 12h)';

    menuModal.innerHTML = `
        <div class="modal-content">
            <h2>Menu</h2>
            <button id="randomGiftButton" class="button" ${giftAvailable ? '' : 'disabled'}>
                <img src="gift-box.png" alt="Gift">
                ${randomGiftButtonText}
            </button>
            <button id="referralButton" class="button">Invite Friends</button>
            <p>Your Referrals: ${referralCount}</p>
            <button id="closeMenuButton" class="button close-btn">Close</button>
        </div>
    `;

    document.getElementById('randomGiftButton').addEventListener('click', function() {
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
            updateMenuContent();
        }
    });

    document.getElementById('referralButton').addEventListener('click', showReferralLink);
    document.getElementById('closeMenuButton').addEventListener('click', toggleMenu);
}

function showReferralLink() {
    const referralModal = document.getElementById('referralModal');
    referralModal.style.display = 'block';

    const referralLink = document.getElementById('referralLink');
    referralLink.value = `https://t.me/Dinozen_bot?start=${telegramId}`;

    document.getElementById('copyButton').onclick = function() {
        referralLink.select();
        document.execCommand('copy');
        this.textContent = 'Copied!';
        setTimeout(() => {
            this.textContent = 'Copy Link';
        }, 2000);
    };

    document.getElementById('closeReferralModal').onclick = function() {
        referralModal.style.display = 'none';
    };
}

function getLevelMultiplier() {
    return 1 + (level - 1) * 0.25; // Her seviye için %25 artış
}

function activateDoubleTokens() {
    const duration = 20000; // 20 saniye
    isDoubleTokensActive = true;
    const originalClicksRemaining = clicksRemaining;
    clicksRemaining = Infinity; // Sınırsız tıklama
    setTimeout(() => {
        isDoubleTokensActive = false;
        clicksRemaining = originalClicksRemaining; // Orijinal tıklama sayısını geri yükle
        updateUI();
    }, duration);
    alert('Double Tokens activated for 20 seconds! Click as fast as you can!');
}

function levelUp() {
    const previousLevel = level;
    level++;
    maxEnergy = level + 2; // Örnek enerji hesaplama
    updateDinoImage();
    checkLevelUp();
    saveUserData();
    updateUI();
    createLevelUpEffect();
    showLevelUpModal(previousLevel, level);
}

function showLevelUpModal(previousLevel, newLevel) {
    const previousClicks = clickLimits[previousLevel - 1];
    const newClicks = clickLimits[newLevel - 1];
    const previousEnergy = 3 + (previousLevel - 1); // Örnek enerji hesaplama
    const newEnergy = 3 + (newLevel - 1); // Örnek enerji hesaplama

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
            </table>
            <button id="closeLevelUpModal" class="close-btn">Close</button>
        </div>
    `;
    levelUpModal.style.display = 'block';

    document.getElementById('closeLevelUpModal').onclick = function() {
        levelUpModal.style.display = 'none';
    };
}

function calculateDailyReward(streak) {
    if (streak <= 10) {
        return 1000 * streak;
    } else if (streak <= 20) {
        return 10000 + (streak - 10) * 1500;
    } else if (streak <= 30) {
        return 25000 + (streak - 20) * 2000;
    } else {
        return 45000 + (streak - 30) * 2500;
    }
}

function showRewardTable() {
    let tableContent = '<h3>Daily Streak Rewards</h3><table><tr><th>Day</th><th>Reward</th></tr>';
    for (let i = 1; i <= 30; i++) {
        tableContent += `<tr><td>${i}</td><td>${formatNumber(calculateDailyReward(i))} tokens</td></tr>`;
    }
    tableContent += '</table>';

    const rewardTableModal = document.getElementById('rewardTableModal');
    rewardTableModal.innerHTML = `
        <div class="modal-content daily-streak" id="dailyStreak">
            <button class="close-btn" id="closeDailyStreak">&times;</button>
            ${tableContent}
        </div>
    `;
    rewardTableModal.style.display = 'block';

    document.getElementById('closeDailyStreak').onclick = function() {
        rewardTableModal.style.display = 'none';
    };
}

function checkDailyLogin() {
    const currentDate = new Date();
    const offset = 3 * 60 * 60 * 1000; // UTC 03:00 offset
    currentDate.setUTCHours(3, 0, 0, 0);
    const currentTime = new Date(Date.now() + offset);

    if (!lastLoginDate || lastLoginDate < currentDate) {
        dailyStreak++;
        lastLoginDate = currentDate;
        const reward = calculateDailyReward(dailyStreak);
        tokens += reward;

        if (dailyStreak === 1) {
            const loginStreakModal = document.getElementById('loginStreakModal');
            const loginStreakMessage = document.getElementById('loginStreakMessage');

            loginStreakMessage.textContent = `Daily login reward: ${formatNumber(reward)} tokens! Streak: ${dailyStreak} days`;
            loginStreakModal.style.display = 'block';

            document.getElementById('closeLoginStreakModal').onclick = function() {
                loginStreakModal.style.display = 'none';
                saveUserData();
                updateUI();
                showRewardTable(); // Ödül tablosunu göster
            };
        }
    }

    checkAutoBot();
}

function updateDailyRewardDisplay() {
    dailyRewardDisplay.textContent = `Daily Streak: ${dailyStreak} days`;
}

function increaseClicks() {
    const maxClicks = getMaxClicksForLevel();
    if (clicksRemaining < maxClicks) {
        clicksRemaining++;
        updateUI();
    }
}

function getMaxClicksForLevel() {
    return clickLimits[level - 1] || clickLimits[clickLimits.length - 1];
}

function checkAutoBot() {
    if (autoBotActive) {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - lastLoginDate) / 1000; // Saniye cinsinden geçen süre
        autoBotTokens = Math.floor(elapsedTime * (level * 0.1)); // Her saniye için level * 0.1 token
        
        showAutoBotEarningsModal();
    }
}

function showAutoBotEarningsModal() {
    const autoBotEarningsModal = document.createElement('div');
    autoBotEarningsModal.className = 'modal';
    autoBotEarningsModal.innerHTML = `
        <div class="modal-content">
            <h3>AutoBot Earnings</h3>
            <table>
                <tr><td>Tokens Collected:</td><td>${formatNumber(autoBotTokens)}</td></tr>
                <tr><td>Time Active:</td><td>${formatTime((Date.now() - lastLoginDate) / 1000)}</td></tr>
            </table>
            <button id="claimAutoBotTokens" class="button">Claim Tokens</button>
        </div>
    `;
    document.body.appendChild(autoBotEarningsModal);

    document.getElementById('claimAutoBotTokens').addEventListener('click', function() {
        tokens += autoBotTokens;
        autoBotTokens = 0;
        updateUI();
        saveUserData();
        autoBotEarningsModal.style.display = 'none';
    });
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
            <p>You won: ${reward} (${formatNumber(amount)})</p>
            <button id="closeRandomGiftModal" class="close-btn">Close</button>
        </div>
    `;
    document.body.appendChild(randomGiftModal);
    randomGiftModal.style.display = 'block';

    document.getElementById('closeRandomGiftModal').onclick = function() {
        randomGiftModal.style.display = 'none';
        document.body.removeChild(randomGiftModal);
    };
}

window.addEventListener('resize', resizeCanvas);

setInterval(() => {
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
