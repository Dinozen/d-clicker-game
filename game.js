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
let spinAvailable = true;
let lastSpinTime = Date.now();
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
const boostButton = document.getElementById('boostButton');
const boostTimer = document.getElementById('boostTimer');
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

const wheelSegments = [
    { name: 'Energy', chance: 25, color: '#FF6384' },
    { name: 'Clicks', chance: 25, color: '#36A2EB' },
    { name: 'Tokens', chance: 29, color: '#FFCE56' },
    { name: 'Double Tokens', chance: 20, color: '#4BC0C0' },
    { name: 'Dino Level Up', chance: 1, color: '#9966FF' }
];

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
        spinAvailable = data.spinAvailable !== undefined ? data.spinAvailable : true;
        lastSpinTime = data.lastSpinTime || Date.now();
        referralCount = data.referralCount || 0;
        autoBotActive = data.autoBotActive || false;
        autoBotPurchased = data.autoBotPurchased || false;
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
        maxEnergy,
        lastEnergyRefillTime,
        clicksRemaining,
        boostAvailable,
        dailyStreak,
        lastLoginDate,
        spinAvailable,
        lastSpinTime,
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
            <button id="closeAutoBotModal">Close</button>
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
            <button id="closeErrorModal">Close</button>
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
    menuModal.innerHTML = `
        <h2>Menu</h2>
        <canvas id="wheelCanvas" width="300" height="300"></canvas>
        <button id="spinButton" class="button">Spin the Wheel</button>
        <button id="referralButton" class="button">Invite Friends</button>
        <p>Your Referrals: ${referralCount}</p>
        <button id="closeMenuButton" class="button">Close</button>
    `;
    
    const wheelCanvas = document.getElementById('wheelCanvas');
    drawWheel(wheelCanvas);
    
    const spinButton = document.getElementById('spinButton');
    if (!spinAvailable) {
        const timeRemaining = 24 * 60 * 60 * 1000 - (Date.now() - lastSpinTime);
        const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
        const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
        spinButton.textContent = `Spin in ${hoursRemaining}h ${minutesRemaining}m`;
        spinButton.disabled = true;
    } else {
        spinButton.textContent = 'Spin the Wheel';
        spinButton.disabled = false;
    }
    
    document.getElementById('spinButton').addEventListener('click', spinWheel);
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

function drawWheel(wheelCanvas) {
    const wheelCtx = wheelCanvas.getContext('2d');
    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    // Arka plan çemberi
    wheelCtx.beginPath();
    wheelCtx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    wheelCtx.fillStyle = '#333';
    wheelCtx.fill();

    let startAngle = 0;
    for (let i = 0; i < wheelSegments.length; i++) {
        const segment = wheelSegments[i];
        const angle = (segment.chance / 100) * 2 * Math.PI;
        
        wheelCtx.beginPath();
        wheelCtx.moveTo(centerX, centerY);
        wheelCtx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
        wheelCtx.closePath();

        // Gradient oluştur
        const gradient = wheelCtx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, lightenColor(segment.color, 30));
        gradient.addColorStop(1, segment.color);

        wheelCtx.fillStyle = gradient;
        wheelCtx.fill();

        // Bölüm sınırları
        wheelCtx.strokeStyle = '#fff';
        wheelCtx.lineWidth = 2;
        wheelCtx.stroke();

        // Metin
        wheelCtx.save();
        wheelCtx.translate(centerX, centerY);
        wheelCtx.rotate(startAngle + angle / 2);
        wheelCtx.textAlign = 'right';
        wheelCtx.fillStyle = '#fff';
        wheelCtx.font = 'bold 12px Arial';
        let displayName = segment.name;
        if (segment.name === 'Double Tokens') displayName = '2x Tokens';
        if (segment.name === 'Dino Level Up') displayName = 'Level Up';
        wheelCtx.fillText(displayName, radius - 25, 5);
        wheelCtx.restore();

        startAngle += angle;
    }

    // Orta nokta
    wheelCtx.beginPath();
    wheelCtx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    wheelCtx.fillStyle = '#fff';
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#333';
    wheelCtx.lineWidth = 2;
    wheelCtx.stroke();

    // Pointer'ı çiz (aşağı doğru kırmızı üçgen)
    const pointerSize = 20;
    wheelCtx.beginPath();
    wheelCtx.moveTo(centerX, centerY + radius);
    wheelCtx.lineTo(centerX - pointerSize / 2, centerY + radius - pointerSize);
    wheelCtx.lineTo(centerX + pointerSize / 2, centerY + radius - pointerSize);
    wheelCtx.closePath();
    wheelCtx.fillStyle = '#ff0000';
    wheelCtx.fill();
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) + amt,
          G = (num >> 8 & 0x00FF) + amt,
          B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
                  (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
                  (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function spinWheel() {
    if (spinAvailable) {
        const wheelCanvas = document.getElementById('wheelCanvas');
        rotateWheel(wheelCanvas, (winningSegment) => {
            let reward = wheelSegments[winningSegment].name;
            let amount;
            
            switch (reward) {
                case 'Energy':
                    amount = 300;
                    energy = Math.min(maxEnergy, energy + amount);
                    break;
                case 'Clicks':
                    amount = 300;
                    clicksRemaining += amount;
                    break;
                case 'Tokens':
                    amount = Math.floor(Math.random() * 101) + 200; // 200-300 arası
                    tokens += amount * getLevelMultiplier();
                    break;
                case 'Double Tokens':
                    activateDoubleTokens();
                    break;
                case 'Dino Level Up':
                    amount = levelRequirements[level] - tokens; // Bir sonraki seviye için gereken token miktarı
                    tokens += amount;
                    checkLevelUp(); // Level kontrolü yap
                    break;
            }

            spinAvailable = false;
            lastSpinTime = Date.now();
            updateUI();
            saveUserData();
            showWheelResult(reward, amount);
        });
    } else {
        alert('You can spin the wheel once every 24 hours.');
    }
}

function rotateWheel(wheelCanvas, callback) {
    const wheelCtx = wheelCanvas.getContext('2d');
    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const spinDuration = 5000; // 5 seconds
    const startAngle = 0;
    const totalRotation = 5 * 2 * Math.PI + Math.random() * 2 * Math.PI; // 5 full rotations + random additional rotation
    const startTime = Date.now();

    function animate() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / spinDuration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        const currentRotation = startAngle + easedProgress * totalRotation;

        wheelCtx.save();
        wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
        wheelCtx.translate(centerX, centerY);
        wheelCtx.rotate(currentRotation);
        wheelCtx.translate(-centerX, -centerY);
        drawWheel(wheelCanvas);
        wheelCtx.restore();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            const segmentAngle = (2 * Math.PI) / wheelSegments.length;
            const finalAngle = currentRotation % (2 * Math.PI);
            const winningSegment = Math.floor(finalAngle / segmentAngle);
            callback(winningSegment);
        }
    }

    animate();
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
    energy = maxEnergy; // Enerjiyi maksimum yap
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
            <button id="closeLevelUpModal">Close</button>
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
        <div class="modal-content">
            ${tableContent}
            <button id="closeRewardTableButton">Close</button>
        </div>
    `;
    rewardTableModal.style.display = 'block';

    document.getElementById('closeRewardTableButton').onclick = function() {
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
    } else if (lastLoginDate.toDateString() !== currentTime.toDateString()) {
        showRewardTable(); // Her giriş yapıldığında ödül tablosunu göster
    }

    // Spin hakkını kontrol et
    const timeElapsed = Date.now() - lastSpinTime;
    if (timeElapsed >= 24 * 60 * 60 * 1000) { // 24 saat geçmiş mi?
        spinAvailable = true;
    }

    checkAutoBot();
}

function updateDailyRewardDisplay() {
    dailyRewardDisplay.textContent = `Daily Streaks: ${dailyStreak} days`;
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

function showWheelResult(reward, amount) {
    const wheelResultModal = document.getElementById('wheelResultModal');
    const wheelResultMessage = document.getElementById('wheelResultMessage');
    
    let message = `You won: ${reward}`;
    if (amount) {
        message += ` (${formatNumber(amount)})`;
    }
    wheelResultMessage.textContent = message;
    
    wheelResultModal.style.display = 'block';
    
    document.getElementById('closeWheelResultModal').onclick = function() {
        wheelResultModal.style.display = 'none';
    };
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