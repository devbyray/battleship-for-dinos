// gameUI.js - Handles game UI elements and interactions

import { bones, getIconPathForBone } from './gameConfig.js';
import { getState, updateState } from './gameState.js';
import { getCellsForBonePlacement, canPlaceBone } from './boneManagement.js';

// Set up bone selection area
export function setupBoneSelection(playerBonesElement) {
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
                updateState({
                    selectedBone: {
                        element: boneElement,
                        size: parseInt(boneElement.dataset.size),
                        name: bone.name
                    }
                });
            }
        });
        
        playerBonesElement.appendChild(boneElement);
    });
}

// Show/hide start overlay
export function toggleStartOverlay(startOverlay, startGameBtn, show) {
    if (show) {
        startOverlay.classList.add('visible');
        startGameBtn.disabled = false;
    } else {
        startOverlay.classList.remove('visible');
        startGameBtn.disabled = true;
    }
}

// Update status message
export function updateStatusMessage(statusMessageElement, message) {
    statusMessageElement.textContent = message;
}

// Preview bone placement when hovering over cells
export function previewBonePlacement(cell, playerGrid) {
    clearBonePreview(playerGrid);
    
    const gameState = getState();
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
export function clearBonePreview(playerGrid) {
    const cells = playerGrid.querySelectorAll('.cell');
    cells.forEach(cell => {
        if (!cell.classList.contains('ship-placed')) {
            cell.style.backgroundColor = '';
        }
    });
}

// Place bone on player grid
export function placeBoneOnPlayerGrid(cell, playerGrid, languageManager, updateStatusMessage, toggleStartOverlay, showStartGameModal) {
    const gameState = getState();
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
    const playerBonesPlaced = [...gameState.playerBonesPlaced, {
        name: gameState.selectedBone.name,
        size,
        positions: bonePositions,
        hits: 0
    }];
    
    // Mark the bone as placed
    gameState.selectedBone.element.classList.add('placed');
    
    // Clear selection
    gameState.selectedBone.element.classList.remove('selected');
    
    // Update state
    updateState({
        playerBonesPlaced,
        selectedBone: null
    });
    
    // Enable start button if all bones are placed
    if (playerBonesPlaced.length === bones.length) {
        toggleStartOverlay(true);
        updateStatusMessage(languageManager.getText('allBonesPlaced'));
        
        // Show the start game modal automatically when all bones are placed
        setTimeout(() => {
            showStartGameModal();
        }, 500);
    }
}

// Show the start game modal
export function showStartGameModal(startGameModal, languageManager) {
    const gameState = getState();
    if (gameState.playerBonesPlaced.length === bones.length) {
        startGameModal.style.display = 'block';
        
        // Update modal text with language manager
        document.getElementById('start-modal-title').textContent = 
            languageManager.getText('modalReadyToDig');
        document.getElementById('start-modal-message').textContent = 
            languageManager.getText('modalAllBonesPlaced');
        document.getElementById('confirm-start-btn').textContent = 
            languageManager.getText('startModalButtons');
        document.getElementById('cancel-start-btn').textContent = 
            languageManager.getText('startModalCancel');
    } else {
        updateStatusMessage(document.getElementById('status-message'), languageManager.getText('needAllBones'));
    }
}

// Toggle player grid visibility in mobile mode
export function initTogglePlayerGridButton() {
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
                    computerBoardContainer.style.display = 'flex';
                }
            }
        });
        
        // Handle window resize events
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                togglePlayerGridBtn.style.display = 'flex';
                
                // Reset computer grid display when resizing
                if (!playerBoardContainer.classList.contains('visible')) {
                    computerBoardContainer.style.display = 'flex';
                } else {
                    computerBoardContainer.style.display = 'none';
                }
            } else {
                // On larger screens, both grids can be visible
                playerBoardContainer.style.display = 'inherit';
                computerBoardContainer.style.display = 'inherit';
            }
        });
    }
}