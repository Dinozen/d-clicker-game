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

// Level gereksinimleri
const levelRequirements = [0, 2000, 5000, 10000, 20000];

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boostButton = document.getElementById('boostButton');
const boostTimer = document.getElementById('boostTimer');
const menuButton = document.getElementById('menuButton');
const menuModal = document.getElementById('menuModal');
const dailyRewardDisplay = document.getElementById('dailyRewardDisplay');

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
    animateDino();
    checkDailyLogin();
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
        dailyStreak = data.dailyStreak || 0;
        lastLoginDate = data.lastLoginDate ? new Date(data.lastLoginDate) : null;
        spinAvailable = data.spinAvailable !== undefined ? data.spinAvailable : true;
        lastSpinTime = data.lastSpinTime || Date.now();
        referralCount = data.referralCount || 0;
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
        boostAvailable,
        dailyStreak,
        lastLoginDate,
        spinAvailable,
        lastSpinTime,
        referralCount
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
                clicksRemaining = 300;
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

function updateUI() {
    document.getElementById('tokenDisplay').textContent = `Tokens: ${tokens}`;
    document.getElementById('energyDisplay').textContent = `Energy: ${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = `Clicks: ${clicksRemaining}`;
    document.getElementById('levelDisplay').textContent = `Level: ${level}`;
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

function updateMenuContent() {
    menuModal.innerHTML = `
        <h2>Menu</h2>
        <canvas id="wheelCanvas" width="200" height="200"></canvas>
        <button id="spinButton">Spin the Wheel</button>
        <button id="referralButton">Invite Friends</button>
        <p>Your Referrals: ${referralCount}</p>
        <button id="closeMenuButton">Close</button>
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
    const referralLink = document.getElementById('referralLink');
    const copyButton = document.getElementById('copyButton');
    const closeButton = document.getElementById('closeReferralModal');
    
    referralLink.value = `https://t.me/YourBotName?start=${telegramId}`;
    referralModal.style.display = 'block';
    
    copyButton.onclick = function() {
        referralLink.select();
        document.execCommand('copy');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy';
        }, 2000);
    };
    
    closeButton.onclick = function() {
        referralModal.style.display = 'none';
    };
}

function drawWheel(wheelCanvas) {
    const wheelCtx = wheelCanvas.getContext('2d');
    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    let startAngle = 0;
    for (let segment of wheelSegments) {
        const angle = (segment.chance / 100) * 2 * Math.PI;
        
        wheelCtx.beginPath();
        wheelCtx.moveTo(centerX, centerY);
        wheelCtx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
        wheelCtx.closePath();

        wheelCtx.fillStyle = segment.color;
        wheelCtx.fill();

        wheelCtx.save();
        wheelCtx.translate(centerX, centerY);
        wheelCtx.rotate(startAngle + angle / 2);
        wheelCtx.textAlign = 'right';
        wheelCtx.fillStyle = '#fff';
        wheelCtx.font = '10px Arial';
        let displayName = segment.name;
        if (segment.name === 'Double Tokens') displayName = '2x Tokens';
        if (segment.name === 'Dino Level Up') displayName = 'Level Up';
        wheelCtx.fillText(displayName, radius - 15, 0);
        wheelCtx.restore();

        startAngle += angle;
    }

    // Statik işaretçi
    wheelCtx.save();
    wheelCtx.translate(centerX, centerY);
    wheelCtx.rotate(-Math.PI / 2); // İşaretçiyi üste yerleştir
    wheelCtx.beginPath();
    wheelCtx.moveTo(radius, 0);
    wheelCtx.lineTo(radius + 20, -10);
    wheelCtx.lineTo(radius + 20, 10);
    wheelCtx.closePath();
    wheelCtx.fillStyle = 'red';
    wheelCtx.fill();
    wheelCtx.restore();
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

function showWheelResult(reward, amount) {
    const wheelResultModal = document.getElementById('wheelResultModal');
    const wheelResultMessage = document.getElementById('wheelResultMessage');
    const closeButton = document.getElementById('closeWheelResultModal');
    
    let message = `You won: ${reward}`;
    if (amount) {
        message += ` (${amount})`;
    }
    wheelResultMessage.textContent = message;
    
    wheelResultModal.style.display = 'block';
    
    closeButton.onclick = function() {
        wheelResultModal.style.display = 'none';
    };
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
    const duration = 10000; // 10 saniye
    isDoubleTokensActive = true;
    const originalClicksRemaining = clicksRemaining;
    clicksRemaining = Infinity; // Sınırsız tıklama
    setTimeout(() => {
        isDoubleTokensActive = false;
        clicksRemaining = originalClicksRemaining; // Orijinal tıklama sayısını geri yükle
        updateUI();
    }, duration);
    alert('Double Tokens activated for 10 seconds! Click as fast as you can!');
}

function levelUp() {
    level++;
    updateDinoImage();
    checkLevelUp(); // Diğer özellikleri güncelle
    saveUserData(); // Verileri kaydet
    updateUI(); // Arayüzü güncelle
    
    // Level up efekti ve bildirimi
    createLevelUpEffect();
    
    // Yeni seviye için gerekli token miktarını göster
    const nextLevelRequirement = levelRequirements[level] || "Max Level";
    alert(`Congratulations! Your Dino leveled up to Level ${level}!\nNext level at: ${nextLevelRequirement} tokens`);
}

function calculateDailyReward(streak) {
    if (streak <= 10) {
        return 50 * streak;
    } else if (streak < 15) {
        return 500 + (streak - 10) * 100;
    } else if (streak === 15) {
        return 1000;
    } else {
        return 1000 + (streak - 15) * 50; // 15. günden sonra her gün için 50 token
    }
}

function showRewardTable() {
    let tableContent = '<h3>Daily Streak Rewards</h3><table><tr><th>Day</th><th>Reward</th></tr>';
    for (let i = 1; i <= 15; i++) {
        tableContent += `<tr><td>${i}</td><td>${calculateDailyReward(i)} tokens</td></tr>`;
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
    currentDate.setHours(0, 0, 0, 0);

    if (!lastLoginDate || lastLoginDate < currentDate) {
        dailyStreak++;
        lastLoginDate = currentDate;
        const reward = calculateDailyReward(dailyStreak);
        tokens += reward;
        
        const loginStreakModal = document.getElementById('loginStreakModal');
        const loginStreakMessage = document.getElementById('loginStreakMessage');
        const closeLoginStreakModal = document.getElementById('closeLoginStreakModal');
        
        loginStreakMessage.textContent = `Daily login reward: ${reward} tokens! Streak: ${dailyStreak} days`;
        loginStreakModal.style.display = 'block';
        
        closeLoginStreakModal.onclick = function() {
            loginStreakModal.style.display = 'none';
            saveUserData();
            updateUI();
            showRewardTable(); // Ödül tablosunu göster
        };
    } else {
        showRewardTable(); // Her giriş yapıldığında ödül tablosunu göster
    }

    // Spin hakkını kontrol et
    const timeElapsed = Date.now() - lastSpinTime;
    if (timeElapsed >= 24 * 60 * 60 * 1000) { // 24 saat geçmiş mi?
        spinAvailable = true;
    }
}

function updateDailyRewardDisplay() {
    dailyRewardDisplay.textContent = `Daily Streak: ${dailyStreak} days`;
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
