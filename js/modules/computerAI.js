// computerAI.js - Computer AI logic for the game

import { GRID_SIZE } from './gameConfig.js';
import { getState, updateState } from './gameState.js';

// Computer's dig attempt
export function computerDig(playerGrid, updateStatusMessage, languageManager, endGame) {
    const gameState = getState();
    if (gameState.isAnimating) return;
    
    updateState({ isAnimating: true });
    
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
        
        // Update computer hits count
        updateState({ computerHits: gameState.computerHits + 1 });
        
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
    
    // Get latest state to check win condition
    const state = getState();
    
    // Check if computer won
    if (state.computerHits === state.totalBoneSegments) {
        endGame('computer');
        updateState({ isAnimating: false });
        return;
    }
    
    // Back to player's turn
    setTimeout(() => {
        updateState({ 
            isPlayerTurn: true,
            isAnimating: false
        });
    }, 500); // Reduced delay since no animations
}