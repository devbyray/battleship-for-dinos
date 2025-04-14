// utils.js - Utility functions for the game

import { GRID_SIZE } from './gameConfig.js';

// Create the grid with cells
export function createGrid(gridElement, gridType, handlePlayerDig) {
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
                if (handlePlayerDig) {
                    handlePlayerDig(cell);
                }
            });
        }
        gridElement.appendChild(cell);
    }
}

// Celebrate win with confetti animation
export function celebrateWin() {
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