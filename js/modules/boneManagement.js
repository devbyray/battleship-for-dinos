// boneManagement.js - Handles bone placement and validation

import { GRID_SIZE, bones } from './gameConfig.js';
import { getState, updateState } from './gameState.js';

// Check if a bone can be placed at a specific position
export function canPlaceBone(row, col, size, orientation, placedBones) {
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

// Get cells for bone placement
export function getCellsForBonePlacement(row, col, size, orientation, gridType) {
    const cells = [];
    const grid = gridType === 'player' ? document.getElementById('player-grid') : document.getElementById('computer-grid');
    
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

// Place computer bones randomly
export function placeComputerBones() {
    const gameState = getState();
    const computerBonesPlaced = [];
    
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
            
            if (canPlaceBone(row, col, bone.size, orientation, computerBonesPlaced)) {
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
                computerBonesPlaced.push({
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
    
    updateState({ computerBonesPlaced });
}

// Place bones randomly on player grid
export function placeBonesRandomly(playerGrid, updateStatusMessage, languageManager, toggleStartOverlay, showStartGameModal) {
    const gameState = getState();
    // Reset the player grid and bones
    const cells = playerGrid.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('ship-placed', 'hit', 'miss');
        cell.style.backgroundColor = '';
    });
    
    // Reset bone selection
    const boneElements = document.querySelectorAll('.bone');
    boneElements.forEach(bone => {
        bone.classList.remove('placed', 'selected', 'vertical');
    });
    
    // Clear placed bones
    const playerBonesPlaced = [];
    
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
            
            if (canPlaceBone(row, col, bone.size, orientation, playerBonesPlaced)) {
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
                playerBonesPlaced.push({
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
    
    // Update state with placed bones
    updateState({ 
        playerBonesPlaced,
        selectedBone: null,
        orientation: 'horizontal' 
    });
    
    // Enable start button if all bones are placed
    if (playerBonesPlaced.length === bones.length) {
        toggleStartOverlay(true);
        updateStatusMessage(languageManager.getText('allBonesPlacedRandom'));
        
        // Show the start game modal automatically when all bones are placed
        setTimeout(() => {
            showStartGameModal();
        }, 500);
    }
}