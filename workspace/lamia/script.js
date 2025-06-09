
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game State and Score
let gameState = 'playing'; // 'playing', 'game_over'
let score = 0; // Initialize score

// Car properties
let carX = canvas.width / 2 - 15; // Center the car initially
let carY = canvas.height - 70; // Position near the bottom
const carWidth = 30;
const carHeight = 50;
const carSpeed = 8; // Speed for both horizontal and vertical movement
const carVerticalBoundsPadding = 10; // Padding from top/bottom edges

// Obstacle properties
let obstacles = [];
const obstacleWidth = 40;
const obstacleHeight = 40;
const obstacleSpeed = 3; // Obstacles move downwards relative to the static car position
const obstacleSpawnInterval = 1200; // milliseconds between new obstacles (slightly faster)
let lastObstacleTime = 0; // To manage obstacle spawning based on time

// Animation variables
let pulse = 0;
let pulseDirection = 1;

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Function to create obstacles
function createObstacle() {
    // Random x position across the entire canvas width
    const obstacleX = Math.random() * (canvas.width - obstacleWidth);
    const obstacleY = -obstacleHeight; // Start above the canvas
    obstacles.push({ x: obstacleX, y: obstacleY, width: obstacleWidth, height: obstacleHeight, color: `hsl(${Math.random() * 360}, 100%, 50%)` }); // Add random color
}

// Update game state
function update(deltaTime) {
    if (gameState === 'playing') {
        // Handle horizontal movement
        if (keys['ArrowLeft']) {
            carX -= carSpeed;
        }
        if (keys['ArrowRight']) {
            carX += carSpeed;
        }

        // Handle vertical movement
        if (keys['ArrowUp']) {
            carY -= carSpeed;
        }
        if (keys['ArrowDown']) {
            carY += carSpeed;
        }

        // Keep car within horizontal bounds of the *canvas*
        if (carX < 0) carX = 0;
        if (carX > canvas.width - carWidth) carX = canvas.width - carWidth;

        // Keep car within vertical bounds of the *canvas*
        if (carY < carVerticalBoundsPadding) carY = carVerticalBoundsPadding;
        if (carY > canvas.height - carHeight - carVerticalBoundsPadding) carY = canvas.height - carHeight - carVerticalBoundsPadding;

        // Spawn obstacles periodically
        lastObstacleTime += deltaTime;
        if (lastObstacleTime > obstacleSpawnInterval) {
            createObstacle();
            lastObstacleTime = 0; // Reset timer
        }

        let newObstacles = [];
        // Update obstacle positions and check for collisions
        obstacles.forEach(obstacle => {
            obstacle.y += obstacleSpeed;

            // Check if obstacle went off screen without collision
            if (obstacle.y > canvas.height) {
                score += 10; // Increase score by 10 for each obstacle passed
            } else {
                 // Collision detection (AABB)
                if (carX < obstacle.x + obstacle.width &&
                    carX + carWidth > obstacle.x &&
                    carY < obstacle.y + obstacle.height &&
                    carY + carHeight > obstacle.y) {
                    // Collision detected!
                    console.log('Collision!');
                    gameState = 'game_over'; // Set game state to game over
                    // Do NOT add this obstacle to newObstacles
                } else {
                     // Keep obstacle if it's on screen and no collision
                    newObstacles.push(obstacle);
                }
            }
        });
        obstacles = newObstacles; // Update the obstacles array


        // Update pulse animation
        pulse += pulseDirection * 0.05; // Adjust speed based on deltaTime if needed
        if (pulse > 1 || pulse < 0) {
            pulseDirection *= -1;
        }
    }
}

// Function to draw the car with a more modern neon style and animation
function drawCar() {
    const baseColor = 'hsl(180, 100%, 50%)'; // Cyan
    const glowColor = `hsla(180, 100%, 70%, ${0.5 + pulse * 0.3})`; // Pulsing glow

    // Car body
    ctx.fillStyle = baseColor;
    ctx.fillRect(carX, carY, carWidth, carHeight);

    // Glow effect
    ctx.shadowBlur = 25; // Increased blur
    ctx.shadowColor = glowColor;
    ctx.fillStyle = `hsla(180, 100%, 90%, ${0.7 + pulse * 0.3})`; // Lighter center with pulse
    ctx.fillRect(carX + carWidth * 0.15, carY + carHeight * 0.15, carWidth * 0.7, carHeight * 0.7);
    ctx.shadowBlur = 0; // Reset shadow

    // Car outline for sharper neon look
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3; // Thicker outline
    ctx.strokeRect(carX, carY, carWidth, carHeight);

    // Simple windows
    ctx.fillStyle = 'rgba(0, 0, 50, 0.8)'; // Dark blue
    ctx.fillRect(carX + carWidth * 0.2, carY + carHeight * 0.2, carWidth * 0.6, carHeight * 0.2); // Front window
    ctx.fillRect(carX + carWidth * 0.2, carY + carHeight * 0.6, carWidth * 0.6, carHeight * 0.2); // Back window
}

// Function to draw the track and background with modern feel
function drawTrack() {
    // Draw background (dark gradient for depth)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 30, 1)'); // Dark blue/purple
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Black
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const trackWidth = 250; // Wider track visual
    const leftLane = canvas.width / 2 - trackWidth / 2;
    const rightLane = canvas.width / 2 + trackWidth / 2;

    // Outer track lines (brighter, more defined neon)
    ctx.strokeStyle = 'hsl(120, 100%, 60%)'; // Brighter Neon green
    ctx.lineWidth = 10; // Even thicker lines
    ctx.shadowBlur = 15; // Increased Glow effect
    ctx.shadowColor = 'hsl(120, 100%, 60%)';

    ctx.beginPath();
    ctx.moveTo(leftLane, 0);
    ctx.lineTo(leftLane, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightLane, 0);
    ctx.lineTo(rightLane, canvas.height);
    ctx.stroke();

    ctx.shadowBlur = 0; // Reset shadow

    // Dashed center line (pulsing)
    const dashLength = 30;
    const gapLength = 30;
    ctx.strokeStyle = `hsla(60, 100%, 70%, ${0.6 + pulse * 0.4})`; // Pulsing Neon yellow
    ctx.lineWidth = 5;
    ctx.setLineDash([dashLength, gapLength]);
    ctx.lineDashOffset = (performance.now() / 50) % (dashLength + gapLength); // Animate dash movement based on time
    ctx.shadowBlur = 10; // Glow
    ctx.shadowColor = `hsla(60, 100%, 70%, ${0.6 + pulse * 0.4})`;

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash
    ctx.shadowBlur = 0; // Reset shadow
    ctx.lineDashOffset = 0; // Reset line dash offset
}

// Function to draw obstacles with improved look
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color; // Use random color
        ctx.shadowBlur = 12; // Glow effect
        ctx.shadowColor = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.shadowBlur = 0; // Reset shadow

        // Optional: Add a small white center for more glow effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(obstacle.x + obstacle.width * 0.2, obstacle.y + obstacle.height * 0.2, obstacle.width * 0.6, obstacle.height * 0.6);
    });
}

// Function to draw the score
function drawScore() {
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 5; // Add a small shadow for readability
    ctx.shadowColor = 'cyan';
    ctx.fillText('Score: ' + score, 10, 40); // Position the score in the top-left corner
    ctx.shadowBlur = 0; // Reset shadow
}


// Function to draw game over screen
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '60px Arial';
    ctx.fillStyle = 'red'; // Game Over text color
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'red';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40); // Adjust position
    ctx.shadowBlur = 0; // Reset shadow

    // Display final score
    ctx.font = '40px Arial';
    ctx.fillStyle = 'yellow';
     ctx.shadowBlur = 15;
    ctx.shadowColor = 'yellow';
    ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 20); // Position below Game Over text
    ctx.shadowBlur = 0; // Reset shadow


    ctx.font = '30px Arial';
    ctx.fillStyle = 'white'; // Instruction text color
    ctx.fillText('Refresh to Play Again', canvas.width / 2, canvas.height / 2 + 80); // Adjust position
}


// Game loop
let lastTime = 0;
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Draw background and track first
    drawTrack();

    if (gameState === 'playing') {
        // Update game state (car movement, obstacle movement, collisions, animations, scoring)
        update(deltaTime);

        // Draw game elements
        drawCar();
        drawObstacles();
        drawScore(); // Draw the score while playing

        // Request next frame if playing
        requestAnimationFrame(gameLoop);
    } else if (gameState === 'game_over') {
        // Draw final frame elements (car, obstacles before game over)
        // This might not be necessary if drawGameOver covers everything, but keeps final state visible
        drawCar();
        drawObstacles();
        // Draw game over screen, which now includes the final score
        drawGameOver();
        // Do NOT request next frame, stopping the loop
    }
}

// Start the game loop
gameLoop(0);
