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
let lastAutoBotClaimTime = 0;

// Level gereksinimleri
const levelRequirements = [0, 3000, 8000, 20000, 40000];
const clickLimits = [300, 500, 1000, 1500, 2000];

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const earnButton = document.getElementById('earnButton');
const dailyRewardsButton = document.getElementById('dailyRewardsButton');
const menuModal = document.getElementById('menuModal');
const dailyRewardDisplay = document.getElementById('dailyRewardDisplay');
const boostButton = document.getElementById('boostButton');
const boostersModal = document.getElementById('boostersModal');
const levelUpModal = document.createElement('div');
const autoBotModal = document.createElement('div');
const autoBotSuccessModal = document.getElementById('autoBotSuccessModal');
const autoBotEarningsModal = document.getElementById('autoBotEarningsModal');

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
    leaderboardButton.addEventListener('click', showDailyStreaks);
    animateDino();
    checkDailyLogin();
    setInterval(increaseClicks, 1000); // Her saniye kontrol et
    setInterval(updateGiftCooldownDisplay, 1000); // Her saniye sayacı güncelle
    setInterval(updateEnergyBoostCooldownDisplay, 1000); // Her saniye enerji boost sayacını güncelle
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
        lastEnergyBoostTime = data.lastEnergyBoostTime || 0;
        referralCount = data.referralCount || 0;
        autoBotActive = data.autoBotActive || false;
        autoBotPurchased = data.autoBotPurchased || false;
        autoBotTokens = data.autoBotTokens || 0;
        lastAutoBotClaimTime = data.lastAutoBotClaimTime || 0;
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
        lastEnergyBoostTime,
        referralCount,
        autoBotActive,
        autoBotPurchased,
        autoBotTokens,
        lastAutoBotClaimTime
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
        let tokenGain = 1 * getLevelMultiplier();
        if (isDoubleTokensActive) {
            tokenGain *= 2;
        }
        
        // Her zaman efekti göster ve dino'yu hareket ettir
        createClickEffect(event.clientX || event.touches[0].clientX, event.clientY || event.touches[0].clientY, tokenGain);
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

function setupGameUI() {
    updateUI();
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
    document.getElementById('tokenDisplay').textContent = formatNumber(tokens);
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
        drawDino();
    }
    requestAnimationFrame(animateDino);
}

function checkLevelUp() {
    const newLevel = levelRequirements.findIndex(req => tokens < req);
    if (newLevel > level && newLevel <= 5) {
        while (level < newLevel) {
            levelUp();
        }
    }
}

function updateDinoImage() {
    const dinoIndex = Math.min(level - 1, 4); // Maksimum 5. seviye için
    currentDinoImage = dinoImages[dinoIndex];
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
        updateBoostersModalContent();
        document.getElementById('closeBoostersModal').addEventListener('click', toggleBoosters);
    } else {
        boostersModal.style.display = 'none';
    }
}

function updateBoostersModalContent() {
    boostersModal.innerHTML = `
        <div class="modal-content">
            <h3>Boosters</h3>
            <div id="energyBoostContainer" style="display: flex; flex-direction: column; align-items: center;">
                <h3>🚀 Energy Boost</h3>
                <button id="energyBoostButton" class="button">Activate Energy Boost</button>
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
    document.getElementById('energyBoostButton').addEventListener('click', activateEnergyBoost);
    document.getElementById('autoBotButton').addEventListener('click', activateAutoBot);
    document.getElementById('closeBoostersModal').addEventListener('click', toggleBoosters);
}

function activateEnergyBoost() {
    const now = Date.now();
    if (now - lastEnergyBoostTime >= boostCooldown) {
        energy = maxEnergy;
        lastEnergyBoostTime = now;
        updateUI();
        saveUserData();
        showMessage('Energy fully restored!');
        updateEnergyBoostCooldownDisplay(); // Sayacı hemen güncelle
    } else {
        showMessage('Energy Boost is not available yet.');
    }
    toggleBoosters(); // Boosters modalını kapat
}

function activateAutoBot() {
    if (tokens >= 10000 && !autoBotPurchased) {
        tokens -= 10000;
        autoBotActive = true;
        autoBotPurchased = true;
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
    toggleBoosters(); // Boosters modalını kapat
}

function showAutoBotSuccessMessage() {
    autoBotSuccessModal.style.display = 'block';
    document.getElementById('closeAutoBotSuccessModal').onclick = function() {
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
            <button id="closeMessageModal" class="close-btn">X</button>
        </div>
    `;
    document.body.appendChild(messageModal);
    messageModal.style.display = 'block';
    document.getElementById('closeMessageModal').onclick = function() {
        messageModal.style.display = 'none';
        document.body.removeChild(messageModal);
    };
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
    const previousEnergy = 3 + (previousLevel - 1); // Örnek enerji hesaplama
    const newEnergy = 3 + (newLevel - 1); // Örnek enerji hesaplama
    const previousRefillRate = previousLevel === 1 ? 0.33 : previousLevel === 2 ? 0.5 : previousLevel === 3 ? 0.67 : previousLevel === 4 ? 1 : 2;
    const newRefillRate = newLevel === 1 ? 0.33 : newLevel === 2 ? 0.5 : newLevel === 3 ? 0.67 : newLevel === 4 ? 1 : 2;

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

const rewardData = [
    { day: 1, tokens: 1000 }, { day: 2, tokens: 2000 }, { day: 3, tokens: 3000 },
    { day: 4, tokens: 4000 }, { day: 5, tokens: 5000 }, { day: 6, tokens: 6000 },
    { day: 7, tokens: 7000 }, { day: 8, tokens: 8000 }, { day: 9, tokens: 9000 },
    { day: 10, tokens: 10000 }, { day: 11, tokens: 11000 }, { day: 12, tokens: 12000 },
    { day: 13, tokens: 13000 }, { day: 14, tokens: 14000 }, { day: 15, tokens: 15000 },
    { day: 16, tokens: 16000 }, { day: 17, tokens: 17000 }, { day: 18, tokens: 18000 },
    { day: 19, tokens: 19000 }, { day: 20, tokens: 20000 }, { day: 21, tokens: 21000 },
    { day: 22, tokens: 22000 }, { day: 23, tokens: 23000 }, { day: 24, tokens: 24000 },
    { day: 25, tokens: 25000 }, { day: 26, tokens: 26000 }, { day: 27, tokens: 27000 },
    { day: 28, tokens: 28000 }, { day: 29, tokens: 29000 }, { day: 30, tokens: 30000 }
];

function createRewardItem(day, tokens, isClaimable) {
    return `
        <div class="reward-item ${isClaimable ? 'claimable' : ''}" data-day="${day}">
            <span>Day ${day}: <img src="token.png" alt="token" style="width: 16px; height: 16px;"> ${tokens} tokens</span>
        </div>
    `;
}


function populateRewardPages() {
    const page1 = document.getElementById('rewardPage1');
    const page2 = document.getElementById('rewardPage2');
    
    page1.innerHTML = rewardData.slice(0, 15).map(r => createRewardItem(r.day, r.tokens, r.day <= dailyStreak)).join('');
    page2.innerHTML = rewardData.slice(15).map(r => createRewardItem(r.day, r.tokens, r.day <= dailyStreak)).join('');
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

function showDailyStreaks() {
    populateRewardPages();
    document.getElementById('rewardTableModal').style.display = 'block';
}


document.getElementById('nextRewardPage').addEventListener('click', toggleRewardPage);
document.getElementById('prevRewardPage').addEventListener('click', toggleRewardPage);

document.getElementById('closeRewardTableButton').addEventListener('click', function() {
    document.getElementById('rewardTableModal').style.display = 'none';
});

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
        clicksRemaining = Math.min(clicksRemaining + energyRefillRate, maxClicks);
        updateUI();
    }
}

function getMaxClicksForLevel() {
    return clickLimits[level - 1] || clickLimits[clickLimits.length - 1];
}

function updateEnergyRefillRate() {
    switch(level) {
        case 1:
            energyRefillRate = 1/3;
            break;
        case 2:
            energyRefillRate = 1/2;
            break;
        case 3:
            energyRefillRate = 2/3;
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
        const elapsedTime = (currentTime - Math.max(lastAutoBotClaimTime, lastLoginDate)) / 1000; // Saniye cinsinden geçen süre
        autoBotTokens = Math.floor(elapsedTime * (level * 0.1)); // Her saniye için level * 0.1 token
        
        showAutoBotEarnings();
    }
}

function showAutoBotEarnings() {
    document.getElementById('autoBotTokensCollected').textContent = formatNumber(autoBotTokens);
    document.getElementById('autoBotActiveTime').textContent = formatTime((Date.now() - Math.max(lastAutoBotClaimTime, lastLoginDate)) / 1000);
    autoBotEarningsModal.style.display = 'block';

    document.getElementById('claimAutoBotTokens').addEventListener('click', function() {
        tokens += autoBotTokens;
        autoBotTokens = 0;
        lastAutoBotClaimTime = Date.now();
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
            <p>You won: ${reward} ${amount ? `(${formatNumber(amount)})` : ''}</p>
            <button id="closeRandomGiftModal" class="close-btn">X</button>
        </div>
    `;
    document.body.appendChild(randomGiftModal);
    randomGiftModal.style.display = 'block';

    document.getElementById('closeRandomGiftModal').onclick = function() {
        randomGiftModal.style.display = 'none';
        document.body.removeChild(randomGiftModal);
    };
}

function showLeaderboard() {
    const leaderboardModal = document.createElement('div');
    leaderboardModal.className = 'modal';
    leaderboardModal.innerHTML = `
        <div class="modal-content">
            <h3>Leaderboard</h3>
            <table>
                <tr><th>Rank</th><th>Player</th><th>Tokens</th></tr>
                <tr><td>1</td><td>Player1</td><td>100,000</td></tr>
                <tr><td>2</td><td>Player2</td><td>90,000</td></tr>
                <tr><td>3</td><td>Player3</td><td>80,000</td></tr>
            </table>
            <button id="closeLeaderboardModal" class="close-btn">X</button>
        </div>
    `;
    document.body.appendChild(leaderboardModal);
    leaderboardModal.style.display = 'block';

    document.getElementById('closeLeaderboardModal').onclick = function() {
        leaderboardModal.style.display = 'none';
        document.body.removeChild(leaderboardModal);
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
    
    document.getElementById('nextRewardPage').addEventListener('click', toggleRewardPage);
    document.getElementById('prevRewardPage').addEventListener('click', toggleRewardPage);

    document.getElementById('closeRewardTableButton').addEventListener('click', function() {
        document.getElementById('rewardTableModal').style.display = 'none';
    });
};

const tasksButton = document.getElementById('tasksButton');
const tasksModal = document.getElementById('tasksModal');
const task1Start = document.getElementById('task1Start');
const task1Claim = document.getElementById('task1Claim');
const task2Start = document.getElementById('task2Start');
const task2Claim = document.getElementById('task2Claim');
const closeTasksModal = document.getElementById('closeTasksModal');

// Buton olayları
earnButton.addEventListener('click', () => {
    // EARN butonunun işlevi
    alert("EARN button clicked! Functionality not yet implemented.");
});

boostButton.addEventListener('click', () => {
    // BOOST butonunun işlevi
    alert("BOOST button clicked! Functionality not yet implemented.");
});

earnButton.addEventListener('click', () => {
    // EARN butonunun işlevi
});

dailyRewardsButton.addEventListener('click', () => {
    showDailyStreaks();
});

tasksButton.addEventListener('click', () => {
    tasksModal.style.display = 'block';
});

task1Start.addEventListener('click', () => {
    window.open('https://x.com/dinozenofficial', '_blank');
    setTimeout(() => {
        task1Start.style.display = 'none';
        task1Claim.style.display = 'block';
    }, 5000);
});

task1Claim.addEventListener('click', () => {
    // Kullanıcıyı ödüllendirme
    tokens += 1000;
    updateUI();
});

task2Start.addEventListener('click', () => {
    window.open('https://www.dinozen.online/', '_blank');
    setTimeout(() => {
        task2Start.style.display = 'none';
        task2Claim.style.display = 'block';
    }, 5000);
});

task2Claim.addEventListener('click', () => {
    // Kullanıcıyı ödüllendirme
    tokens += 1000;
    updateUI();
});

closeTasksModal.addEventListener('click', () => {
    tasksModal.style.display = 'none';
});

// Güncellenmiş referans ödülleri
const referralRewards = [
    { referrals: 1, tokens: 3000 },
    { referrals: 5, tokens: 15000 },
    { referrals: 10, tokens: 30000 },
    { referrals: 20, tokens: 75000 },
    { referrals: 50, tokens: 300000 },
    { referrals: 100, tokens: 600000 },
    { referrals: 500, tokens: 1500000 },
    { referrals: 1000, tokens: 3000000 },
];

// UI güncellemeleri
function updateUI() {
    document.getElementById('tokenDisplay').textContent = formatNumber(tokens);
    document.getElementById('energyDisplay').textContent = `${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = formatClicks(clicksRemaining);
    document.getElementById('levelDisplay').textContent = `${level}`;
    updateDailyRewardDisplay();
    updateGiftCooldownDisplay();
    updateReferralRewards();
}

function updateReferralRewards() {
    const referralRewardsTable = document.querySelector('#referralRewards table');
    referralRewardsTable.innerHTML = referralRewards.map(reward => `
        <tr><td>${reward.referrals} Referrals:</td><td>${formatNumber(reward.tokens)} tokens</td></tr>
    `).join('');
}
