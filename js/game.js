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
        totalBoneSegments: bones.reduce((total, bone) => total + bone.size, 0)
    };
    
    // DOM elements
    const playerGrid = document.getElementById('player-grid');
    const computerGrid = document.getElementById('computer-grid');
    const playerBonesElement = document.getElementById('player-bones');
    const rotateBtn = document.getElementById('rotate-btn');
    const randomPlacementBtn = document.getElementById('random-placement-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const resetGameBtn = document.getElementById('reset-game-btn');
    const statusMessageElement = document.getElementById('status-message');
    const modal = document.getElementById('game-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const closeModalBtn = document.querySelector('.close');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    // Initialize Game
    function initGame() {
        createGrid(playerGrid, 'player');
        createGrid(computerGrid, 'computer');
        addEventListeners();
        setupBoneSelection();
        
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
                    if (gameState.isGameStarted && gameState.isPlayerTurn) {
                        handlePlayerDig(cell);
                    }
                });
            }
            gridElement.appendChild(cell);
        }
    }
    
    // Set up bone selection area
    function setupBoneSelection() {
        const boneElements = playerBonesElement.querySelectorAll('.bone');
        
        boneElements.forEach(bone => {
            bone.addEventListener('click', () => {
                // Only allow selection if the bone hasn't been placed yet
                if (!bone.classList.contains('placed')) {
                    // Clear previous selection
                    boneElements.forEach(b => b.classList.remove('selected'));
                    bone.classList.add('selected');
                    gameState.selectedBone = {
                        element: bone,
                        size: parseInt(bone.dataset.size),
                        name: bone.textContent.split(' ')[0]
                    };
                }
            });
        });
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
            
            // Update visual cue
            if (gameState.selectedBone) {
                if (gameState.orientation === 'vertical') {
                    gameState.selectedBone.element.classList.add('vertical');
                } else {
                    gameState.selectedBone.element.classList.remove('vertical');
                }
            }
        });
        
        // Random placement button
        randomPlacementBtn.addEventListener('click', placeBonesRandomly);
        
        // Start game button
        startGameBtn.addEventListener('click', startGame);
        
        // Reset game button
        resetGameBtn.addEventListener('click', resetGame);
        
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
        
        // Modal close button
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Play again button
        playAgainBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resetGame();
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
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
            startGameBtn.disabled = false;
            updateStatusMessage(languageManager.getText('allBonesPlaced'));
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
            startGameBtn.disabled = false;
            updateStatusMessage(languageManager.getText('allBonesPlacedRandom'));
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
        
        // Disable start button
        startGameBtn.disabled = true;
        
        updateStatusMessage(languageManager.getText('statusPlaceBones'));
    }
    
    // Start the game
    function startGame() {
        if (gameState.playerBonesPlaced.length !== bones.length) {
            updateStatusMessage(languageManager.getText('needAllBones'));
            return;
        }
        
        gameState.isGameStarted = true;
        placeComputerBones();
        
        // Disable bone selection and placement controls
        rotateBtn.disabled = true;
        randomPlacementBtn.disabled = true;
        startGameBtn.disabled = true;
        
        updateStatusMessage(languageManager.getText('gameStarted'));
    }
    
    // Reset the game
    function resetGame() {
        gameState = {
            isGameStarted: false,
            isPlayerTurn: true,
            playerBonesPlaced: [],
            computerBonesPlaced: [],
            selectedBone: null,
            orientation: 'horizontal',
            playerHits: 0,
            computerHits: 0,
            totalBoneSegments: bones.reduce((total, bone) => total + bone.size, 0)
        };
        
        // Reset both grids
        resetPlayerGrid();
        
        const computerCells = computerGrid.querySelectorAll('.cell');
        computerCells.forEach(cell => {
            cell.classList.remove('hit', 'miss');
        });
        
        // Enable controls
        rotateBtn.disabled = false;
        randomPlacementBtn.disabled = false;
        
        updateStatusMessage(languageManager.getText('statusPlaceBones'));
    }
    
    // Handle player's dig attempt
    function handlePlayerDig(cell) {
        if (!gameState.isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss')) {
            return;
        }
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        let hit = false;
        let boneName = '';
        
        // Check if the dig hit a bone
        for (let bone of gameState.computerBonesPlaced) {
            for (let pos of bone.positions) {
                if (pos.row === row && pos.col === col) {
                    hit = true;
                    boneName = bone.name;
                    bone.hits++;
                    gameState.playerHits++;
                    
                    // Check if the bone is completely excavated
                    if (bone.hits === bone.size) {
                        updateStatusMessage(languageManager.getText('completelyExcavated', boneName));
                    }
                    
                    break;
                }
            }
            if (hit) break;
        }
        
        // Update the cell
        if (hit) {
            cell.classList.add('hit');
            const bone = gameState.computerBonesPlaced.find(b => b.name === boneName);
            updateStatusMessage(
                bone.hits === bone.size 
                ? languageManager.getText('completelyExcavated', boneName)
                : languageManager.getText('hitMessage', boneName)
            );
        } else {
            cell.classList.add('miss');
            updateStatusMessage(languageManager.getText('missMessage'));
        }
        
        // Check if player won
        if (gameState.playerHits === gameState.totalBoneSegments) {
            endGame('player');
            return;
        }
        
        // Computer's turn after a short delay
        gameState.isPlayerTurn = false;
        setTimeout(computerDig, 1000);
    }
    
    // Computer's dig attempt
    function computerDig() {
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
        let hit = false;
        let boneName = '';
        
        // Check if the dig hit a bone
        let hitBone = null; // Store the hit bone for later reference
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
                    
                    // Check if the bone is completely excavated
                    if (bone.hits === bone.size) {
                        updateStatusMessage(languageManager.getText('computerExcavated', boneName));
                        
                        // Mark all positions as hunted
                        bone.positions.forEach(p => {
                            p.hunted = true;
                        });
                    }
                    
                    break;
                }
            }
            if (hit) break;
        }
        
        // Update the cell
        if (hit) {
            cell.classList.add('hit');
            updateStatusMessage(
                hitBone.hits === hitBone.size 
                ? languageManager.getText('computerExcavated', boneName)
                : languageManager.getText('computerHitMessage', boneName)
            );
        } else {
            cell.classList.add('miss');
            updateStatusMessage(languageManager.getText('computerMissMessage'));
        }
        
        // Check if computer won
        if (gameState.computerHits === gameState.totalBoneSegments) {
            endGame('computer');
            return;
        }
        
        // Back to player's turn
        gameState.isPlayerTurn = true;
    }
    
    // End the game
    function endGame(winner) {
        gameState.isGameStarted = false;
        
        if (winner === 'player') {
            modalTitle.textContent = languageManager.getText('modalCongrats');
            modalMessage.textContent = languageManager.getText('modalWinMessage');
        } else {
            modalTitle.textContent = languageManager.getText('modalGameOver');
            modalMessage.textContent = languageManager.getText('modalLoseMessage');
        }
        
        modal.style.display = 'block';
    }
    
    // Update status message
    function updateStatusMessage(message) {
        statusMessageElement.textContent = message;
    }
    
    // Initialize the game
    initGame();
});