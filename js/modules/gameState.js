// gameState.js - Manages the game state

import { totalBoneSegments } from './gameConfig.js';

// Initialize the default game state
export function createInitialState() {
    return {
        isGameStarted: false,
        isPlayerTurn: true,
        playerBonesPlaced: [],
        computerBonesPlaced: [],
        selectedBone: null,
        orientation: 'horizontal',
        playerHits: 0,
        computerHits: 0,
        totalBoneSegments: totalBoneSegments,
        isAnimating: false
    };
}

// Game state instance
let gameState = createInitialState();

// Getter for the game state
export function getState() {
    return gameState;
}

// Reset the game state
export function resetState() {
    gameState = createInitialState();
}

// Update specific state properties
export function updateState(newState) {
    gameState = { ...gameState, ...newState };
}