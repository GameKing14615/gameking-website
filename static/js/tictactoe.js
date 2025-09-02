document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const menu = document.getElementById('ttt-menu');
    const mainMenu = document.getElementById('main-menu');
    const multiplayerOptions = document.getElementById('multiplayer-options');
    const boardSection = document.getElementById('board-section');
    const settingsSection = document.getElementById('settings-section');
    const playBtn = document.getElementById('play-btn');
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const backBtn = document.getElementById('ttt-back-btn');
    const mpBackBtn = document.getElementById('mp-back-btn');
    const hostBtn = document.getElementById('host-btn');
    const joinBtn = document.getElementById('join-btn');
    const hostCodeSection = document.getElementById('host-code-section');
    const hostCodeDiv = document.getElementById('host-code');
    const joinCodeSection = document.getElementById('join-code-section');
    const joinCodeInput = document.getElementById('join-code-input');
    const joinGameBtn = document.getElementById('join-game-btn');
    const joinError = document.getElementById('join-error');

    // Helper: generate random 6-character code
    function generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Navigation logic
    function showMainMenu() {
        mainMenu.style.display = '';
        multiplayerOptions.style.display = 'none';
        boardSection.style.display = 'none';
        settingsSection.style.display = 'none';
        backBtn.style.display = 'none';
    }
    function showMultiplayerMenu() {
        mainMenu.style.display = 'none';
        multiplayerOptions.style.display = '';
        boardSection.style.display = 'none';
        settingsSection.style.display = 'none';
        backBtn.style.display = '';
        hostCodeSection.style.display = 'none';
        joinCodeSection.style.display = 'none';
        joinError.textContent = '';
    }
    function showSettingsMenu() {
        mainMenu.style.display = 'none';
        multiplayerOptions.style.display = 'none';
        boardSection.style.display = 'none';
        settingsSection.style.display = '';
        backBtn.style.display = '';
    }
    function showBoard() {
        mainMenu.style.display = 'none';
        multiplayerOptions.style.display = 'none';
        boardSection.style.display = '';
        settingsSection.style.display = 'none';
        backBtn.style.display = '';
    }

    // Main menu buttons
    playBtn.addEventListener('click', showBoard);
    multiplayerBtn.addEventListener('click', showMultiplayerMenu);
    settingsBtn.addEventListener('click', showSettingsMenu);

    // Back button (top left)
    backBtn.addEventListener('click', function() {
        // Always return to main menu and show main menu buttons
        mainMenu.style.display = '';
        multiplayerOptions.style.display = 'none';
        boardSection.style.display = 'none';
        settingsSection.style.display = 'none';
        backBtn.style.display = 'none';
        menu.style.display = '';
    });
    // Multiplayer back button
    mpBackBtn.addEventListener('click', showMainMenu);

    // Multiplayer options
    hostBtn.addEventListener('click', function() {
        hostCodeSection.style.display = '';
        joinCodeSection.style.display = 'none';
        hostCodeDiv.textContent = generateCode();
        joinError.textContent = '';
    });
    joinBtn.addEventListener('click', function() {
        hostCodeSection.style.display = 'none';
        joinCodeSection.style.display = '';
        joinCodeInput.value = '';
        joinError.textContent = '';
    });

    // Join game button (to be implemented with backend)
    joinGameBtn.addEventListener('click', function() {
        const code = joinCodeInput.value.trim().toUpperCase();
        if (code.length !== 6) {
            joinError.textContent = 'Please enter a valid 6-character code.';
            return;
        }
        // TODO: Connect to backend to join game with code
        joinError.textContent = 'Connecting...';
        // On successful join, show game board
        showBoard();
    });

    // Host code click to start game (demo)
    hostCodeDiv.addEventListener('click', function() {
        showBoard();
    });

    // On page load, show main menu
    showMainMenu();
});
// Menu navigation logic for Tic-Tac-Toe
document.addEventListener('DOMContentLoaded', function() {
    const menu = document.getElementById('ttt-menu');
    const boardSection = document.getElementById('board-section');
    const settingsSection = document.getElementById('settings-section');
    const playBtn = document.getElementById('play-btn');
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const backBtn = document.getElementById('ttt-back-btn');

    function showBoard() {
        menu.style.display = 'none';
        boardSection.style.display = '';
        settingsSection.style.display = 'none';
        backBtn.style.display = '';
    }

    function showSettings() {
        menu.style.display = 'none';
        boardSection.style.display = 'none';
        settingsSection.style.display = '';
        backBtn.style.display = '';
    }

    function showMenu() {
        menu.style.display = '';
        boardSection.style.display = 'none';
        settingsSection.style.display = 'none';
        backBtn.style.display = 'none';
    }

    const mainMenu = document.getElementById('main-menu');

    playBtn.addEventListener('click', showBoard);
    multiplayerBtn.addEventListener('click', function() {
        mainMenu.style.display = 'none';
        multiplayerOptions.style.display = '';
        boardSection.style.display = 'none';
        settingsSection.style.display = 'none';
        backBtn.style.display = 'none';
    });
    settingsBtn.addEventListener('click', function() {
        mainMenu.style.display = 'none';
        multiplayerOptions.style.display = 'none';
        showSettings();
    });
    

    backBtn.addEventListener('click', function() {
        // Always return to main menu from any section
        mainMenu.style.display = '';
        multiplayerOptions.style.display = 'none';
        boardSection.style.display = 'none';
        settingsSection.style.display = 'none';
        backBtn.style.display = 'none';
        showMainMenu();
    });
    // Multiplayer back button
    mpBackBtn.addEventListener('click', function() {
        multiplayerOptions.style.display = 'none';
        mainMenu.style.display = '';
        boardSection.style.display = 'none';
        settingsSection.style.display = 'none';
        backBtn.style.display = 'none';
    });
    // On page load, always start at menu
    mainMenu.style.display = '';
    multiplayerOptions.style.display = 'none';
    showMenu();
});
document.addEventListener('DOMContentLoaded', function() {
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const status = document.getElementById('status');
    const resetButton = document.getElementById('reset-button');
    let currentPlayer = 'X';
    let gameActive = true;
    let gameState = ['', '', '', '', '', '', '', '', ''];

    // Add event listeners to the cells
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));

    // Add event listener to the reset button
    resetButton.addEventListener('click', resetGame);

    // Update the status text
    status.textContent = `It's ${currentPlayer}'s turn`;

    function handleCellClick(event) {
        const cell = event.target;
        const index = cell.dataset.index;

        // Check if the cell is empty
        if (gameState[index] === '') {
            // Update the game state
            gameState[index] = currentPlayer;

            // Update the cell text and color
            cell.textContent = currentPlayer;
            if (currentPlayer === 'X') {
                cell.style.color = '#3498db'; // blue
            } else {
                cell.style.color = '#e74c3c'; // red
            }

            // Update the status text
            status.textContent = `It's ${currentPlayer === 'X' ? 'O' : 'X'}'s turn`;

            // Check for a win
            checkForWin();

            // Switch the current player
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        }
    }

    function checkForWin() {
        const winningConditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (let i = 0; i < winningConditions.length; i++) {
            const condition = winningConditions[i];
            if (gameState[condition[0]] === gameState[condition[1]] && gameState[condition[1]] === gameState[condition[2]] && gameState[condition[0]] !== '') {
                status.textContent = `Player ${gameState[condition[0]]} wins!`;
                gameActive = false;
            }
        }
    }

    function resetGame() {
        // Reset the game state
        gameState = ['', '', '', '', '', '', '', '', ''];

        // Reset the cell text and color
        cells.forEach(cell => {
            cell.textContent = '';
            cell.style.color = '';
        });

        // Reset the status text
        status.textContent = `It's X's turn`;

        // Reset the current player
        currentPlayer = 'X';

        // Reset the game active flag
        gameActive = true;
    }
});