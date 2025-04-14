// gameConfig.js - Contains game configuration constants

// Grid configuration
export const GRID_SIZE = 10;

// Bone definitions
export const bones = [
    { name: 'T-Rex', size: 5 },
    { name: 'Stegosaurus', size: 4 },
    { name: 'Triceratops', size: 3 },
    { name: 'Velociraptor', size: 3 },
    { name: 'Compsognathus', size: 2 }
];

// Helper function to get appropriate icon path for bones
export function getIconPathForBone(boneName) {
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

// Calculate total bone segments for win condition checking
export const totalBoneSegments = bones.reduce((total, bone) => total + bone.size, 0);