// Import language manager
import languageManager from './language.js';

document.addEventListener('DOMContentLoaded', () => {
    // Game Configuration
    const GRID_SIZE = 10;
    const bones = [
        { name: 'T-Rex', size: 5 },
        { name: 'Stegosaurus', size: 4 },
        { name: 'Triceratops', size: 3 },
        { name: 'Velociraptor', size: 3 },
        { name: 'Compsognathus', size: 2 }
    ];
    
    // Game State
    let gameState = {
        isGameStarted: false,
        isPlayerTurn: true,
        playerBonesPlaced: [],
        computerBonesPlaced: [],
        selectedBone: null,
        orientation: 'horizontal',
        playerHits: 0,
        computerHits: 0,
        totalBoneSegments: bones.reduce((total, bone) => total + bone.size, 0),
        isAnimating: false, // Flag to prevent overlapping animations
    };
    
    // DOM elements
    const playerGrid = document.getElementById('player-grid');
    const computerGrid = document.getElementById('computer-grid');
    const playerBonesElement = document.getElementById('player-bones');
    const rotateBtn = document.getElementById('rotate-btn');
    const randomPlacementBtn = document.getElementById('random-placement-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const topResetBtn = document.getElementById('top-reset-btn');
    const statusMessageElement = document.getElementById('status-message');
    const startOverlay = document.getElementById('start-overlay');
    
    // Game over modal elements
    const gameOverModal = document.getElementById('game-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const closeModalBtn = document.querySelector('.close');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    // Start game modal elements
    const startGameModal = document.getElementById('start-game-modal');
    const confirmStartBtn = document.getElementById('confirm-start-btn');
    const cancelStartBtn = document.getElementById('cancel-start-btn');
    
    // Initialize Game
    function initGame() {
        createGrid(playerGrid, 'player');
        createGrid(computerGrid, 'computer');
        addEventListeners();
        setupBoneSelection();
        initTogglePlayerGridButton(); // Initialize toggle button right away
        
        // Force language update after all elements are created
        if (window.languageManager) {
            window.languageManager.updatePageLanguage();
        }
    }
    
    // Create the grid with cells
    function createGrid(gridElement, gridType) {
        gridElement.innerHTML = '';
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = Math.floor(i / GRID_SIZE);
            cell.dataset.col = i % GRID_SIZE;
            cell.dataset.index = i;
            
            if (gridType === 'player') {
                cell.classList.add('player-cell');
            } else {
                cell.classList.add('computer-cell');
                // Computer cells are clickable for digging
                cell.addEventListener('click', () => {
                    if (gameState.isGameStarted && gameState.isPlayerTurn && !gameState.isAnimating) {
                        handlePlayerDig(cell);
                    }
                });
            }
            gridElement.appendChild(cell);
        }
    }
    
    // Set up bone selection area
    function setupBoneSelection() {
        playerBonesElement.innerHTML = ''; // Clear existing bones
        
        // Create bone elements
        bones.forEach(bone => {
            const boneElement = document.createElement('div');
            boneElement.classList.add('bone', bone.name.toLowerCase());
            boneElement.dataset.size = bone.size;
            boneElement.dataset.name = bone.name;
            boneElement.dataset.boneName = bone.name;
            
            // Create a label element for the bone text - positioned absolutely to prevent rotation
            const labelElement = document.createElement('div');
            labelElement.classList.add('bone-label');
            // labelElement.textContent = `${bone.name} (${bone.size})`;
            labelElement.dataset.boneName = bone.name; // Add data attribute to help identify the label
            
            // Create an icon element for the bone if applicable
            const iconElement = document.createElement('div');
            iconElement.classList.add('bone-icon');
            
            const iconPath = getIconPathForBone(bone.name);
            if (iconPath) {
                const imgElement = document.createElement('img');
                imgElement.src = iconPath;
                imgElement.alt = bone.name;
                iconElement.appendChild(imgElement);
            }
            
            // Add the label and icon to the bone
            boneElement.appendChild(labelElement);
            boneElement.appendChild(iconElement);
            
            // Add event listener to select bone
            boneElement.addEventListener('click', () => {
                // Only allow selection if the bone hasn't been placed yet
                if (!boneElement.classList.contains('placed')) {
                    // Clear previous selection
                    const boneElements = playerBonesElement.querySelectorAll('.bone');
                    boneElements.forEach(b => b.classList.remove('selected'));
                    boneElement.classList.add('selected');
                    gameState.selectedBone = {
                        element: boneElement,
                        size: parseInt(boneElement.dataset.size),
                        name: bone.name
                    };
                }
            });
            
            playerBonesElement.appendChild(boneElement);
        });
    }
    
    // Helper function to get appropriate icon path for bones
    function getIconPathForBone(boneName) {
        switch(boneName) {
            case 'T-Rex':
                return '/assets/images/dinosaur-2-svgrepo-com.svg';
            case 'Stegosaurus':
                return '/assets/images/dinosaur-animal-old-old-age-svgrepo-com.svg';
            case 'Triceratops':
                return '/assets/images/parasaurolophus-svgrepo-com.svg';
            case 'Velociraptor':
                return '/assets/images/velociraptor-svgrepo-com.svg';
            case 'Compsognathus':
                return '/assets/images/dinosaur-shape-of-compsognathus-svgrepo-com.svg';
            default:
                return null;
        }
    }
    
    // Add event listeners
    function addEventListeners() {
        // Rotate button
        rotateBtn.addEventListener('click', () => {
            if (gameState.orientation === 'horizontal') {
                gameState.orientation = 'vertical';
            } else {
                gameState.orientation = 'horizontal';
            }
        });
        
        // Random placement button
        randomPlacementBtn.addEventListener('click', placeBonesRandomly);
        
        // Start game button - now shows modal
        startGameBtn.addEventListener('click', showStartGameModal);
        
        // Reset game button in top bar
        topResetBtn.addEventListener('click', resetGame);
        
        // Start game modal buttons
        confirmStartBtn.addEventListener('click', () => {
            startGameModal.style.display = 'none';
            startGame();
        });
        
        cancelStartBtn.addEventListener('click', () => {
            startGameModal.style.display = 'none';
        });
        
        // Player grid cell click for bone placement
        const playerCells = playerGrid.querySelectorAll('.cell');
        playerCells.forEach(cell => {
            cell.addEventListener('click', () => {
                if (!gameState.isGameStarted && gameState.selectedBone) {
                    placeBoneOnPlayerGrid(cell);
                }
            });
            
            // Preview bone placement on hover
            cell.addEventListener('mouseenter', () => {
                if (!gameState.isGameStarted && gameState.selectedBone) {
                    previewBonePlacement(cell);
                }
            });
            
            cell.addEventListener('mouseleave', () => {
                clearBonePreview();
            });
        });
        
        // Game over modal events
        closeModalBtn.addEventListener('click', () => {
            gameOverModal.style.display = 'none';
        });
        
        playAgainBtn.addEventListener('click', () => {
            gameOverModal.style.display = 'none';
            resetGame();
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === gameOverModal) {
                gameOverModal.style.display = 'none';
            }
            if (e.target === startGameModal) {
                startGameModal.style.display = 'none';
            }
        });
    }
    
    // Show/hide start game button in overlay
    function toggleStartOverlay(show) {
        if (show) {
            startOverlay.classList.add('visible');
            startGameBtn.disabled = false;
        } else {
            startOverlay.classList.remove('visible');
            startGameBtn.disabled = true;
        }
    }
    
    // Show the start game modal
    function showStartGameModal() {
        if (gameState.playerBonesPlaced.length === bones.length) {
            startGameModal.style.display = 'block';
            
            // Update modal text with language manager
            document.getElementById('start-modal-title').textContent = 
                languageManager.getText('modalReadyToDig');
            document.getElementById('start-modal-message').textContent = 
                languageManager.getText('modalAllBonesPlaced');
            confirmStartBtn.textContent = languageManager.getText('startModalButtons');
            cancelStartBtn.textContent = languageManager.getText('startModalCancel');
        } else {
            updateStatusMessage(languageManager.getText('needAllBones'));
        }
    }
    
    // Preview bone placement when hovering over cells
    function previewBonePlacement(cell) {
        clearBonePreview();
        
        if (!gameState.selectedBone) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const size = gameState.selectedBone.size;
        
        if (!canPlaceBone(row, col, size, gameState.orientation, gameState.playerBonesPlaced)) {
            return;
        }
        
        // Show preview
        const cells = getCellsForBonePlacement(row, col, size, gameState.orientation, 'player');
        cells.forEach(cell => {
            cell.style.backgroundColor = '#b8987a';
        });
    }
    
    // Clear bone placement preview
    function clearBonePreview() {
        const cells = playerGrid.querySelectorAll('.cell');
        cells.forEach(cell => {
            if (!cell.classList.contains('ship-placed')) {
                cell.style.backgroundColor = '';
            }
        });
    }
    
    // Get cells for bone placement
    function getCellsForBonePlacement(row, col, size, orientation, gridType) {
        const cells = [];
        const grid = gridType === 'player' ? playerGrid : computerGrid;
        
        for (let i = 0; i < size; i++) {
            let newRow = row;
            let newCol = col;
            
            if (orientation === 'horizontal') {
                newCol += i;
            } else {
                newRow += i;
            }
            
            if (newRow >= GRID_SIZE || newCol >= GRID_SIZE) {
                continue;
            }
            
            const cellIndex = newRow * GRID_SIZE + newCol;
            const cell = grid.children[cellIndex];
            if (cell) {
                cells.push(cell);
            }
        }
        
        return cells;
    }
    
    // Check if a bone can be placed at a specific position
    function canPlaceBone(row, col, size, orientation, placedBones) {
        // Check if the bone fits within the grid
        if (orientation === 'horizontal' && col + size > GRID_SIZE) {
            return false;
        }
        
        if (orientation === 'vertical' && row + size > GRID_SIZE) {
            return false;
        }
        
        // Check if it overlaps with other bones
        for (let i = 0; i < size; i++) {
            let checkRow = row;
            let checkCol = col;
            
            if (orientation === 'horizontal') {
                checkCol += i;
            } else {
                checkRow += i;
            }
            
            // Check if this position overlaps with any placed bones
            const isOverlapping = placedBones.some(bone => {
                return bone.positions.some(pos => {
                    return pos.row === checkRow && pos.col === checkCol;
                });
            });
            
            if (isOverlapping) {
                return false;
            }
        }
        
        return true;
    }
    
    // Place bone on player grid
    function placeBoneOnPlayerGrid(cell) {
        if (!gameState.selectedBone) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const size = gameState.selectedBone.size;
        
        if (!canPlaceBone(row, col, size, gameState.orientation, gameState.playerBonesPlaced)) {
            updateStatusMessage(languageManager.getText("cantPlaceBone"));
            return;
        }
        
        // Get all cells for this bone
        const boneCells = getCellsForBonePlacement(row, col, size, gameState.orientation, 'player');
        
        if (boneCells.length !== size) {
            updateStatusMessage(languageManager.getText("cantPlaceBone"));
            return;
        }
        
        // Mark cells as having a bone
        const bonePositions = [];
        boneCells.forEach(cell => {
            cell.classList.add('ship-placed');
            bonePositions.push({
                row: parseInt(cell.dataset.row),
                col: parseInt(cell.dataset.col)
            });
        });
        
        // Add bone to placed bones
        gameState.playerBonesPlaced.push({
            name: gameState.selectedBone.name,
            size,
            positions: bonePositions,
            hits: 0
        });
        
        // Mark the bone as placed
        gameState.selectedBone.element.classList.add('placed');
        
        // Clear selection
        gameState.selectedBone.element.classList.remove('selected');
        gameState.selectedBone = null;
        
        // Enable start button if all bones are placed
        if (gameState.playerBonesPlaced.length === bones.length) {
            toggleStartOverlay(true);
            updateStatusMessage(languageManager.getText('allBonesPlaced'));
            
            // Show the start game modal automatically when all bones are placed
            setTimeout(() => {
                showStartGameModal();
            }, 500);
        }
    }
    
    // Place bones randomly on player grid
    function placeBonesRandomly() {
        // Reset the player grid and bones
        resetPlayerGrid();
        
        // For each bone
        bones.forEach(bone => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!placed && attempts < maxAttempts) {
                // Random orientation
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                
                // Random position within grid boundaries
                let row, col;
                if (orientation === 'horizontal') {
                    row = Math.floor(Math.random() * GRID_SIZE);
                    col = Math.floor(Math.random() * (GRID_SIZE - bone.size + 1));
                } else {
                    row = Math.floor(Math.random() * (GRID_SIZE - bone.size + 1));
                    col = Math.floor(Math.random() * GRID_SIZE);
                }
                
                if (canPlaceBone(row, col, bone.size, orientation, gameState.playerBonesPlaced)) {
                    const bonePositions = [];
                    
                    // Mark cells as having a bone
                    for (let i = 0; i < bone.size; i++) {
                        let cellRow = row;
                        let cellCol = col;
                        
                        if (orientation === 'horizontal') {
                            cellCol += i;
                        } else {
                            cellRow += i;
                        }
                        
                        const cellIndex = cellRow * GRID_SIZE + cellCol;
                        const cell = playerGrid.children[cellIndex];
                        cell.classList.add('ship-placed');
                        
                        bonePositions.push({
                            row: cellRow,
                            col: cellCol
                        });
                    }
                    
                    // Add bone to placed bones
                    gameState.playerBonesPlaced.push({
                        name: bone.name,
                        size: bone.size,
                        positions: bonePositions,
                        hits: 0
                    });
                    
                    // Mark the bone as placed in the UI
                    const boneElement = document.querySelector(`.bone.${bone.name.toLowerCase()}`);
                    boneElement.classList.add('placed');
                    
                    placed = true;
                }
                
                attempts++;
            }
            
            if (!placed) {
                console.error(`Failed to place ${bone.name} randomly after ${maxAttempts} attempts`);
            }
        });
        
        // Enable start button if all bones are placed
        if (gameState.playerBonesPlaced.length === bones.length) {
            toggleStartOverlay(true);
            updateStatusMessage(languageManager.getText('allBonesPlacedRandom'));
            
            // Show the start game modal automatically when all bones are placed
            setTimeout(() => {
                showStartGameModal();
            }, 500);
        }
    }
    
    // Place computer bones randomly
    function placeComputerBones() {
        gameState.computerBonesPlaced = [];
        
        // For each bone
        bones.forEach(bone => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!placed && attempts < maxAttempts) {
                // Random orientation
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                
                // Random position within grid boundaries
                let row, col;
                if (orientation === 'horizontal') {
                    row = Math.floor(Math.random() * GRID_SIZE);
                    col = Math.floor(Math.random() * (GRID_SIZE - bone.size + 1));
                } else {
                    row = Math.floor(Math.random() * (GRID_SIZE - bone.size + 1));
                    col = Math.floor(Math.random() * GRID_SIZE);
                }
                
                if (canPlaceBone(row, col, bone.size, orientation, gameState.computerBonesPlaced)) {
                    const bonePositions = [];
                    
                    // Record positions for the bone
                    for (let i = 0; i < bone.size; i++) {
                        let cellRow = row;
                        let cellCol = col;
                        
                        if (orientation === 'horizontal') {
                            cellCol += i;
                        } else {
                            cellRow += i;
                        }
                        
                        bonePositions.push({
                            row: cellRow,
                            col: cellCol
                        });
                    }
                    
                    // Add bone to placed bones
                    gameState.computerBonesPlaced.push({
                        name: bone.name,
                        size: bone.size,
                        positions: bonePositions,
                        hits: 0
                    });
                    
                    placed = true;
                }
                
                attempts++;
            }
            
            if (!placed) {
                console.error(`Failed to place computer ${bone.name} randomly after ${maxAttempts} attempts`);
            }
        });
    }
    
    // Reset player grid
    function resetPlayerGrid() {
        // Clear the grid visually
        const cells = playerGrid.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('ship-placed', 'hit', 'miss');
            cell.style.backgroundColor = '';
        });
        
        // Reset bone selection
        const boneElements = playerBonesElement.querySelectorAll('.bone');
        boneElements.forEach(bone => {
            bone.classList.remove('placed', 'selected', 'vertical');
        });
        
        // Clear placed bones
        gameState.playerBonesPlaced = [];
        gameState.selectedBone = null;
        gameState.orientation = 'horizontal';
        
        // Hide the start overlay
        toggleStartOverlay(false);
        
        updateStatusMessage(languageManager.getText('statusPlaceBones'));
    }
    
    // Reset the entire game to initial state
    function resetGame() {
        // Reset game state
        gameState = {
            isGameStarted: false,
            isPlayerTurn: true,
            playerBonesPlaced: [],
            computerBonesPlaced: [],
            selectedBone: null,
            orientation: 'horizontal',
            playerHits: 0,
            computerHits: 0,
            totalBoneSegments: bones.reduce((total, bone) => total + bone.size, 0),
            isAnimating: false
        };
        
        // Reset visual elements
        resetPlayerGrid();
        
        // Clear computer grid
        const computerCells = computerGrid.querySelectorAll('.cell');
        computerCells.forEach(cell => {
            cell.classList.remove('hit', 'miss', 'bone-complete');
        });
        
        // Enable placement controls
        rotateBtn.disabled = false;
        randomPlacementBtn.disabled = false;
        
        // Remove game-started class from body
        document.body.classList.remove('game-started');
        
        // Reset visibility of grids for mobile
        const playerBoardContainer = document.querySelector('.board-container:first-child');
        const computerBoardContainer = document.querySelector('.board-container:last-child');
        
        if (window.innerWidth <= 768) {
            playerBoardContainer.classList.remove('visible');
            computerBoardContainer.style.display = 'block';
        } else {
            playerBoardContainer.style.display = 'block';
            computerBoardContainer.style.display = 'block';
        }
        
        // Reset toggle button
        const togglePlayerGridBtn = document.getElementById('toggle-player-grid-btn');
        if (togglePlayerGridBtn) {
            togglePlayerGridBtn.classList.remove('active');
            const icon = togglePlayerGridBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-eye';
            }
        }
        
        // Update status message
        updateStatusMessage(languageManager.getText('statusPlaceBones'));
    }
    
    // Start the game
    function startGame() {
        if (gameState.playerBonesPlaced.length < bones.length) {
            updateStatusMessage(languageManager.getText('needAllBones'));
            return;
        }
        
        // Add game-started class to body for CSS transitions
        document.body.classList.add('game-started');
        
        // Reset grids for gameplay
        gameState.isGameStarted = true;
        gameState.playerHits = 0;
        gameState.computerHits = 0;
        
        // Hide and disable bone selection controls
        rotateBtn.disabled = true;
        randomPlacementBtn.disabled = true;
        
        // Hide the start overlay
        toggleStartOverlay(false);
        
        // Place computer's bones randomly
        placeComputerBones();
        
        // Update toggle button visibility on game start
        const togglePlayerGridBtn = document.getElementById('toggle-player-grid-btn');
        const playerBoardContainer = document.querySelector('.board-container:first-child');
        const computerBoardContainer = document.querySelector('.board-container:last-child');
        
        // On mobile, make sure we're showing the computer grid by default at game start
        if (window.innerWidth <= 768) {
            playerBoardContainer.classList.remove('visible');
            computerBoardContainer.style.display = 'block';
            
            if (togglePlayerGridBtn) {
                const icon = togglePlayerGridBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-eye';
                }
                togglePlayerGridBtn.classList.remove('active');
            }
        }
        
        // Update status message
        updateStatusMessage(languageManager.getText('gameStarted'));
    }
    
    // Celebrate win with confetti animation
    function celebrateWin() {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        
        // Launch multiple waves of confetti
        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }
        
        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            
            const particleCount = 50 * (timeLeft / duration);
            
            // Since they're launched from different positions, 
            // these confetti particles will fall differently
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#3d1d94', '#57c26b', '#f2cd4a', '#ec5333', '#3d7aed']
            });
            
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#ed3dcc', '#c29d57', '#4af2d9', '#ec9e33', '#3ded7a']
            });
        }, 250);
    }
    
    // Handle player's dig attempt
    function handlePlayerDig(cell) {
        if (!gameState.isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss') || gameState.isAnimating) {
            return;
        }
        
        gameState.isAnimating = true;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        let hit = false;
        let boneName = '';
        let hitBone = null;
        
        // Check if the dig hit a bone
        for (let bone of gameState.computerBonesPlaced) {
            for (let pos of bone.positions) {
                if (pos.row === row && pos.col === col) {
                    hit = true;
                    boneName = bone.name;
                    bone.hits++;
                    gameState.playerHits++;
                    hitBone = bone;
                    break;
                }
            }
            if (hit) break;
        }
        
        // Update the cell immediately without animation
        if (hit) {
            cell.classList.add('hit');
            
            // Check if the bone is completely excavated
            if (hitBone && hitBone.hits === hitBone.size) {
                updateStatusMessage(languageManager.getText('completelyExcavated', boneName));
                
                // Highlight all cells of the completed bone
                hitBone.positions.forEach(pos => {
                    const index = pos.row * GRID_SIZE + pos.col;
                    const boneCell = computerGrid.children[index];
                    boneCell.classList.add('bone-complete');
                });
            } else {
                updateStatusMessage(languageManager.getText('hitMessage', boneName));
            }
        } else {
            cell.classList.add('miss');
            updateStatusMessage(languageManager.getText('missMessage'));
        }
        
        // Check if player won
        if (gameState.playerHits === gameState.totalBoneSegments) {
            celebrateWin(); // Add confetti celebration when player wins
            endGame('player');
            gameState.isAnimating = false;
            return;
        }
        
        // Computer's turn
        gameState.isPlayerTurn = false;
        setTimeout(() => {
            gameState.isAnimating = false;
            computerDig();
        }, 500); // Reduced delay since no animations
    }
    
    // Computer's dig attempt
    function computerDig() {
        if (gameState.isAnimating) return;
        
        gameState.isAnimating = true;
        
        // Initialize the hunt mode
        const initHuntMode = () => {
            for (let bone of gameState.playerBonesPlaced) {
                for (let pos of bone.positions) {
                    if (pos.hit && !pos.hunted) {
                        return {
                            mode: 'hunt',
                            row: pos.row,
                            col: pos.col
                        };
                    }
                }
            }
            return { mode: 'random' };
        };
        
        // Check if a cell is valid for digging
        const isCellValid = (row, col) => {
            if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
                return false;
            }
            
            const cellIndex = row * GRID_SIZE + col;
            const cell = playerGrid.children[cellIndex];
            return !(cell.classList.contains('hit') || cell.classList.contains('miss'));
        };
        
        let row, col;
        const strategy = initHuntMode();
        
        if (strategy.mode === 'hunt') {
            // Hunt mode - try adjacent cells
            const directions = [
                { dr: -1, dc: 0 }, // Up
                { dr: 1, dc: 0 },  // Down
                { dr: 0, dc: -1 }, // Left
                { dr: 0, dc: 1 }   // Right
            ];
            
            const validTargets = directions
                .map(dir => ({
                    row: strategy.row + dir.dr,
                    col: strategy.col + dir.dc
                }))
                .filter(pos => isCellValid(pos.row, pos.col));
            
            if (validTargets.length > 0) {
                const target = validTargets[Math.floor(Math.random() * validTargets.length)];
                row = target.row;
                col = target.col;
            } else {
                // If no valid hunt targets, fall back to random
                do {
                    row = Math.floor(Math.random() * GRID_SIZE);
                    col = Math.floor(Math.random() * GRID_SIZE);
                } while (!isCellValid(row, col));
            }
        } else {
            // Random mode
            do {
                row = Math.floor(Math.random() * GRID_SIZE);
                col = Math.floor(Math.random() * GRID_SIZE);
            } while (!isCellValid(row, col));
        }
        
        const cellIndex = row * GRID_SIZE + col;
        const cell = playerGrid.children[cellIndex];
        
        // No more animation, just process the dig directly
        let hit = false;
        let boneName = '';
        let hitBone = null;
        
        // Check if the dig hit a bone
        for (let bone of gameState.playerBonesPlaced) {
            for (let i = 0; i < bone.positions.length; i++) {
                const pos = bone.positions[i];
                if (pos.row === row && pos.col === col) {
                    hit = true;
                    boneName = bone.name;
                    bone.hits++;
                    gameState.computerHits++;
                    pos.hit = true;
                    pos.hunted = false;
                    hitBone = bone; // Store reference to the hit bone
                    break;
                }
            }
            if (hit) break;
        }
        
        // Update the cell immediately
        if (hit) {
            cell.classList.add('hit');
            
            // Check if the bone is completely excavated
            if (hitBone.hits === hitBone.size) {
                updateStatusMessage(languageManager.getText('computerExcavated', boneName));
                
                // Mark all positions as hunted
                hitBone.positions.forEach(p => {
                    p.hunted = true;
                });
                
                // Find all cells of this bone and highlight them
                const bonePositions = hitBone.positions;
                
                bonePositions.forEach(pos => {
                    const index = pos.row * GRID_SIZE + pos.col;
                    const boneCell = playerGrid.children[index];
                    boneCell.classList.add('bone-complete');
                });
            } else {
                updateStatusMessage(languageManager.getText('computerHitMessage', boneName));
            }
        } else {
            cell.classList.add('miss');
            updateStatusMessage(languageManager.getText('computerMissMessage'));
        }
        
        // Check if computer won
        if (gameState.computerHits === gameState.totalBoneSegments) {
            endGame('computer');
            gameState.isAnimating = false;
            return;
        }
        
        // Back to player's turn
        setTimeout(() => {
            gameState.isPlayerTurn = true;
            gameState.isAnimating = false;
        }, 500); // Reduced delay since no animations
    }
    
    // End the game
    function endGame(winner) {
        gameState.isGameStarted = false;
        
        if (winner === 'player') {
            modalTitle.textContent = languageManager.getText('modalCongrats');
            modalMessage.textContent = languageManager.getText('modalWinMessage');
        } else {
            modalTitle.textContent = languageManager.getText('modalTitle');
            modalMessage.textContent = languageManager.getText('modalLoseMessage');
        }
        
        // Set the Play Again button text from language file
        playAgainBtn.textContent = languageManager.getText('modalButtons');
        
        // Set close button text
        closeModalBtn.textContent = languageManager.getText('closeButton');
        
        gameOverModal.style.display = 'block';
    }
    
    // Update status message
    function updateStatusMessage(message) {
        statusMessageElement.textContent = message;
    }
    
    // Toggle player grid visibility in mobile mode
    function initTogglePlayerGridButton() {
        const togglePlayerGridBtn = document.getElementById('toggle-player-grid-btn');
        const playerBoardContainer = document.querySelector('.board-container:first-child');
        const computerBoardContainer = document.querySelector('.board-container:last-child');
        
        if (togglePlayerGridBtn && playerBoardContainer) {
            // Set initial state
            const icon = togglePlayerGridBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-eye';
            }
            
            // Add the click handler for toggling between grids
            togglePlayerGridBtn.addEventListener('click', () => {
                playerBoardContainer.classList.toggle('visible');
                togglePlayerGridBtn.classList.toggle('active');
                
                // Update icon based on visibility
                if (icon) {
                    if (playerBoardContainer.classList.contains('visible')) {
                        icon.className = 'fas fa-eye-slash'; // Change to "hide" icon
                    } else {
                        icon.className = 'fas fa-eye'; // Change to "show" icon
                    }
                }
                
                // Check if we need to update the computer grid visibility
                if (window.innerWidth <= 768) {
                    if (playerBoardContainer.classList.contains('visible')) {
                        // Hide computer grid when player grid is visible
                        computerBoardContainer.style.display = 'none';
                    } else {
                        // Show computer grid when player grid is hidden
                        computerBoardContainer.style.display = 'block';
                    }
                }
            });
            
            // Make sure toggle button is visible regardless of game state on mobile
            // if (window.innerWidth <= 768) {
            //     togglePlayerGridBtn.style.display = 'flex';
            // }
            
            // Handle window resize events
            window.addEventListener('resize', () => {
                if (window.innerWidth <= 768) {
                    togglePlayerGridBtn.style.display = 'flex';
                    
                    // Reset computer grid display when resizing
                    if (!playerBoardContainer.classList.contains('visible')) {
                        computerBoardContainer.style.display = 'block';
                    } else {
                        computerBoardContainer.style.display = 'none';
                    }
                } else {
                    // On larger screens, both grids can be visible
                    playerBoardContainer.style.display = 'block';
                    computerBoardContainer.style.display = 'block';
                }
            });
        }
    }
    
    // Initialize the game
    initGame();
});