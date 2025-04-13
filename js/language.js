// Languages configuration
const languages = {
    en: {
        gameTitle: "Dino Digger: Bone Battle",
        gameDescription: "Find Barry Bones' dinosaur remains before the computer finds yours!",
        statusPlaceBones: "Place your dinosaur bones on the grid",
        yourExcavationSite: "Your Excavation Site",
        computerExcavationSite: "Computer's Excavation Site",
        tRex: "T-Rex",
        stegosaurus: "Stegosaurus",
        triceratops: "Triceratops",
        velociraptor: "Velociraptor",
        compsognathus: "Compsognathus",
        rotateBoneBtn: "Rotate Bone",
        randomPlacementBtn: "Random Placement",
        startGameBtn: "Start Digging!",
        resetGameBtn: "Reset Game",
        modalGameOver: "Game Over",
        modalCongrats: "Congratulations!",
        modalWinMessage: "You've successfully excavated all the dinosaur bones! You're a master paleontologist!",
        modalLoseMessage: "The computer found all your dinosaur bones first. Better luck next time!",
        playAgainBtn: "Play Again",
        cantPlaceBone: "Can't place the bone here. Try another location.",
        allBonesPlaced: "All bones placed! Click 'Start Digging' to begin the game.",
        allBonesPlacedRandom: "All bones placed randomly! Click 'Start Digging' to begin the game.",
        needAllBones: "You need to place all your bones first!",
        gameStarted: "Game started! Dig on the computer's grid to find fossils!",
        completelyExcavated: "You've completely excavated the {0}!",
        hitMessage: "Hit! You found part of a {0}!",
        missMessage: "Miss! Keep digging!",
        computerExcavated: "The computer has completely excavated your {0}!",
        computerHitMessage: "Hit! The computer found part of your {0}!",
        computerMissMessage: "Miss! The computer didn't find anything. Your turn!",
        languageSwitcher: "Language:",
        modalReadyToDig: "Ready to Dig!",
        modalAllBonesPlaced: "All dinosaur bones are placed. Are you ready to start digging?",
        modalWaitAdjust: "Wait, I need to adjust",
        
        // Popup related texts
        modalTitle: "Game Over",
        closeButton: "×",
        modalButtons: "Play Again",
        startModalButtons: "Start Digging",
        startModalCancel: "Wait, I need to adjust"
    },
    nl: {
        gameTitle: "Dino Graver: Bottenjacht",
        gameDescription: "Vind Barry Bones' dinosaurusresten voordat de computer die van jou vindt!",
        statusPlaceBones: "Plaats je dinosaurusbotten op het raster",
        yourExcavationSite: "Jouw Opgraafplaats",
        computerExcavationSite: "Opgraafplaats van Computer",
        tRex: "T-Rex",
        stegosaurus: "Stegosaurus",
        triceratops: "Triceratops",
        velociraptor: "Velociraptor",
        compsognathus: "Compsognathus",
        rotateBoneBtn: "Bot Draaien",
        randomPlacementBtn: "Willekeurige Plaatsing",
        startGameBtn: "Begin met Graven!",
        resetGameBtn: "Spel Resetten",
        modalGameOver: "Spel Voorbij",
        modalCongrats: "Gefeliciteerd!",
        modalWinMessage: "Je hebt alle dinosaurusbotten succesvol opgegraven! Je bent een meesterlijke paleontoloog!",
        modalLoseMessage: "De computer heeft al jouw dinosaurusbotten gevonden. Meer geluk de volgende keer!",
        playAgainBtn: "Opnieuw Spelen",
        cantPlaceBone: "Kan het bot hier niet plaatsen. Probeer een andere locatie.",
        allBonesPlaced: "Alle botten geplaatst! Klik op 'Begin met Graven' om het spel te starten.",
        allBonesPlacedRandom: "Alle botten willekeurig geplaatst! Klik op 'Begin met Graven' om het spel te starten.",
        needAllBones: "Je moet eerst al je botten plaatsen!",
        gameStarted: "Spel gestart! Graaf in het raster van de computer om fossielen te vinden!",
        completelyExcavated: "Je hebt de {0} volledig opgegraven!",
        hitMessage: "Raak! Je hebt een deel van een {0} gevonden!",
        missMessage: "Mis! Blijf graven!",
        computerExcavated: "De computer heeft je {0} volledig opgegraven!",
        computerHitMessage: "Raak! De computer heeft een deel van je {0} gevonden!",
        computerMissMessage: "Mis! De computer heeft niets gevonden. Jouw beurt!",
        languageSwitcher: "Taal:",
        modalReadyToDig: "Klaar om te Graven!",
        modalAllBonesPlaced: "Alle dinosaurusbotten zijn geplaatst. Ben je klaar om te beginnen met graven?",
        modalWaitAdjust: "Wacht, ik moet nog aanpassen",
        
        // Popup related texts
        modalTitle: "Spel Voorbij",
        closeButton: "×",
        modalButtons: "Opnieuw Spelen",
        startModalButtons: "Begin met Graven",
        startModalCancel: "Wacht, ik moet nog aanpassen"
    }
};

// Language handling class
class LanguageManager {
    constructor() {
        // Detect browser language or get from local storage
        this.currentLanguage = localStorage.getItem('dinoDiggerLanguage') || 
                              (navigator.language.startsWith('nl') ? 'nl' : 'en');
        
        // Initialize
        this.initLanguageSwitcher();
        this.updatePageLanguage();
    }
    
    // Initialize language switcher
    initLanguageSwitcher() {
        document.addEventListener('DOMContentLoaded', () => {
            // Create language switcher
            const languageContainer = document.createElement('div');
            languageContainer.className = 'language-switcher';
            languageContainer.innerHTML = `
                <span id="language-label"></span>
                <select id="language-select">
                    <option value="en">English</option>
                    <option value="nl">Nederlands</option>
                </select>
            `;
            
            // Add switcher to the top bar
            const topBar = document.querySelector('.top-bar');
            if (topBar) {
                topBar.appendChild(languageContainer);
            }
            
            // Set selected language
            const select = document.getElementById('language-select');
            select.value = this.currentLanguage;
            
            // Add change event
            select.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
            
            // Update language label
            this.updateElement('language-label', 'languageSwitcher');
        });
    }
    
    // Get text for the current language
    getText(key, ...args) {
        let text = languages[this.currentLanguage][key] || languages.en[key] || key;
        
        // Replace placeholders with arguments
        if (args.length) {
            args.forEach((arg, i) => {
                text = text.replace(`{${i}}`, arg);
            });
        }
        
        return text;
    }
    
    // Set language and update page
    setLanguage(lang) {
        if (languages[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('dinoDiggerLanguage', lang);
            this.updatePageLanguage();
        }
    }
    
    // Update text content of element by its data-i18n attribute
    updateElement(elementId, textKey) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.getText(textKey);
        }
    }
    
    // Update all text on the page
    updatePageLanguage() {
        document.title = this.getText('gameTitle');
        
        // Update header elements
        this.updateElement('game-title', 'gameTitle');
        this.updateElement('game-description', 'gameDescription');
        this.updateElement('status-message', 'statusPlaceBones');
        
        // Update board titles
        this.updateElement('player-board-title', 'yourExcavationSite');
        this.updateElement('computer-board-title', 'computerExcavationSite');
        
        // Update bone names
        this.updateBoneNames();
        
        // Update buttons
        this.updateElement('rotate-btn', 'rotateBoneBtn');
        this.updateElement('random-placement-btn', 'randomPlacementBtn');
        this.updateElement('start-game-btn', 'startGameBtn');
        this.updateElement('reset-game-btn', 'resetGameBtn');
        
        // Update modal elements
        this.updateElement('modal-title', 'modalGameOver');
        this.updateElement('play-again-btn', 'playAgainBtn');
        
        // Update language switcher label
        this.updateElement('language-label', 'languageSwitcher');
    }
    
    // Update bone names with size
    updateBoneNames() {
        const boneElements = document.querySelectorAll('.bone');
        boneElements.forEach(bone => {
            const boneClass = Array.from(bone.classList)
                .find(cls => cls !== 'bone' && cls !== 'selected' && cls !== 'placed' && cls !== 'vertical');
            
            if (boneClass) {
                const boneName = boneClass.replace('-', '');
                const size = bone.dataset.size;
                
                switch (boneName) {
                    case 'trex':
                        bone.textContent = `${this.getText('tRex')} (${size})`;
                        break;
                    case 'stegosaurus':
                        bone.textContent = `${this.getText('stegosaurus')} (${size})`;
                        break;
                    case 'triceratops':
                        bone.textContent = `${this.getText('triceratops')} (${size})`;
                        break;
                    case 'velociraptor':
                        bone.textContent = `${this.getText('velociraptor')} (${size})`;
                        break;
                    case 'compsognathus':
                        bone.textContent = `${this.getText('compsognathus')} (${size})`;
                        break;
                }
            }
        });
    }
}

// Create global instance
const languageManager = new LanguageManager();