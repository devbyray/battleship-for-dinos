// Import language manager
import languageManager from './language.js';
import { bones, GRID_SIZE, totalBoneSegments } from './modules/gameConfig.js';
import { createInitialState, getState, resetState, updateState } from './modules/gameState.js';
import { canPlaceBone, getCellsForBonePlacement, placeBonesRandomly, placeComputerBones } from './modules/boneManagement.js';
import { createGrid, celebrateWin } from './modules/utils.js';
import { 
    setupBoneSelection, 
    toggleStartOverlay, 
    updateStatusMessage, 
    previewBonePlacement, 
    clearBonePreview, 
    placeBoneOnPlayerGrid, 
    showStartGameModal,
    initTogglePlayerGridButton 
} from './modules/gameUI.js';
import { computerDig } from './modules/computerAI.js';

document.addEventListener('DOMContentLoaded', () => {
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
        // Create player and computer grids
        createGrid(playerGrid, 'player');
        createGrid(computerGrid, 'computer', handlePlayerDig);
        
        // Add event listeners
        addEventListeners();
        
        // Set up bone selection area
        setupBoneSelection(playerBonesElement);
        
        // Initialize toggle button for player grid
        initTogglePlayerGridButton();
        
        // Force language update after all elements are created
        if (window.languageManager) {
            window.languageManager.updatePageLanguage();
        }
    }
    
    // Handle player's dig attempt
    function handlePlayerDig(cell) {
        const gameState = getState();
        if (!gameState.isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss') || gameState.isAnimating) {
            return;
        }
        
        updateState({ isAnimating: true });
        
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
                    hitBone = bone;
                    break;
                }
            }
            if (hit) break;
        }
        
        // Update the cell immediately without animation
        if (hit) {
            cell.classList.add('hit');
            
            // Update player hits count
            updateState({ playerHits: gameState.playerHits + 1 });
            
            // Check if the bone is completely excavated
            if (hitBone && hitBone.hits === hitBone.size) {
                updateStatusMessage(statusMessageElement, languageManager.getText('completelyExcavated', boneName));
                
                // Highlight all cells of the completed bone
                hitBone.positions.forEach(pos => {
                    const index = pos.row * GRID_SIZE + pos.col;
                    const boneCell = computerGrid.children[index];
                    boneCell.classList.add('bone-complete');
                });
            } else {
                updateStatusMessage(statusMessageElement, languageManager.getText('hitMessage', boneName));
            }
        } else {
            cell.classList.add('miss');
            updateStatusMessage(statusMessageElement, languageManager.getText('missMessage'));
        }
        
        // Get latest state
        const state = getState();
        
        // Check if player won
        if (state.playerHits === totalBoneSegments) {
            celebrateWin(); // Add confetti celebration when player wins
            endGame('player');
            updateState({ isAnimating: false });
            return;
        }
        
        // Computer's turn
        updateState({ isPlayerTurn: false });
        setTimeout(() => {
            updateState({ isAnimating: false });
            computerDig(playerGrid, (msg) => updateStatusMessage(statusMessageElement, msg), languageManager, endGame);
        }, 500); // Reduced delay since no animations
    }
    
    // Add event listeners
    function addEventListeners() {
        // Rotate button
        rotateBtn.addEventListener('click', () => {
            const gameState = getState();
            updateState({ 
                orientation: gameState.orientation === 'horizontal' ? 'vertical' : 'horizontal'
            });
        });
        
        // Random placement button
        randomPlacementBtn.addEventListener('click', () => {
            placeBonesRandomly(
                playerGrid, 
                (msg) => updateStatusMessage(statusMessageElement, msg),
                languageManager,
                (show) => toggleStartOverlay(startOverlay, startGameBtn, show),
                () => showStartGameModal(startGameModal, languageManager)
            );
        });
        
        // Start game button - now shows modal
        startGameBtn.addEventListener('click', () => showStartGameModal(startGameModal, languageManager));
        
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
                const gameState = getState();
                if (!gameState.isGameStarted && gameState.selectedBone) {
                    placeBoneOnPlayerGrid(
                        cell,
                        playerGrid,
                        languageManager,
                        (msg) => updateStatusMessage(statusMessageElement, msg),
                        (show) => toggleStartOverlay(startOverlay, startGameBtn, show),
                        () => showStartGameModal(startGameModal, languageManager)
                    );
                }
            });
            
            // Preview bone placement on hover
            cell.addEventListener('mouseenter', () => {
                const gameState = getState();
                if (!gameState.isGameStarted && gameState.selectedBone) {
                    previewBonePlacement(cell, playerGrid);
                }
            });
            
            cell.addEventListener('mouseleave', () => {
                clearBonePreview(playerGrid);
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
    
    // Start the game
    function startGame() {
        const gameState = getState();
        if (gameState.playerBonesPlaced.length < bones.length) {
            updateStatusMessage(statusMessageElement, languageManager.getText('needAllBones'));
            return;
        }
        
        // Add game-started class to body for CSS transitions
        document.body.classList.add('game-started');
        
        // Update game state for gameplay
        updateState({
            isGameStarted: true,
            playerHits: 0,
            computerHits: 0
        });
        
        // Hide and disable bone selection controls
        rotateBtn.disabled = true;
        randomPlacementBtn.disabled = true;
        
        // Hide the start overlay
        toggleStartOverlay(startOverlay, startGameBtn, false);
        
        // Place computer's bones randomly
        placeComputerBones();
        
        // Update toggle button visibility on game start
        const togglePlayerGridBtn = document.getElementById('toggle-player-grid-btn');
        const playerBoardContainer = document.querySelector('.board-container:first-child');
        const computerBoardContainer = document.querySelector('.board-container:last-child');
        
        // On mobile, make sure we're showing the computer grid by default at game start
        if (window.innerWidth <= 768) {
            playerBoardContainer.classList.remove('visible');
            computerBoardContainer.style.display = 'flex';
            
            if (togglePlayerGridBtn) {
                const icon = togglePlayerGridBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-eye';
                }
                togglePlayerGridBtn.classList.remove('active');
            }
        }
        
        // Update status message
        updateStatusMessage(statusMessageElement, languageManager.getText('gameStarted'));
    }
    
    // End the game
    function endGame(winner) {
        updateState({ isGameStarted: false });
        
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
        
        // Clear game state
        updateState({
            playerBonesPlaced: [],
            selectedBone: null,
            orientation: 'horizontal'
        });
        
        // Hide the start overlay
        toggleStartOverlay(startOverlay, startGameBtn, false);
        
        updateStatusMessage(statusMessageElement, languageManager.getText('statusPlaceBones'));
    }
    
    // Reset the entire game to initial state
    function resetGame() {
        // Reset game state to initial values
        resetState();
        
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
        updateStatusMessage(statusMessageElement, languageManager.getText('statusPlaceBones'));
    }
    
    // Initialize the game
    initGame();
});