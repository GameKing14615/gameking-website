// Tic-Tac-Toe Game - Complete Implementation
// Handles both single-player and multiplayer modes

class TicTacToeGame {
    constructor() {
        // DOM Elements
        this.menu = document.getElementById('ttt-menu');
        this.mainMenu = document.getElementById('main-menu');
        this.singlePlayerOptions = document.getElementById('singleplayer-options');
        this.multiplayerOptions = document.getElementById('multiplayer-options');
        this.boardSection = document.getElementById('board-section');
        this.settingsSection = document.getElementById('settings-section');
        
        this.cells = document.querySelectorAll('.cell');
        this.status = document.getElementById('status');
        this.resetButton = document.getElementById('reset-button');

        this.matchmakingStatus = document.getElementById('matchmaking-status');
        this.waitEstimate = document.getElementById('wait-estimate');
        this.onlineDot = document.getElementById('online-dot');
        this.onlineCount = document.getElementById('online-count');
        
        // Game State
        this.gameState = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.isMultiplayer = false;
        this.playerSymbol = '';
        this.humanSymbol = '';
        this.computerSymbol = '';
        this.gameRoomCode = '';
        this.pollingInterval = null;
        this.matchmakingInterval = null;
        this.onlineCountInterval = null;
        this.computerMoveTimeout = null;
        this.queueStartTime = 0;
        this.clientId = this.getOrCreateClientId();
        
        this.init();
    }
    
    init() {
        this.attachEventListeners();
        this.showMainMenu();
        this.startOnlineCountPolling();
    }
    
    attachEventListeners() {
        // Main Menu Buttons
        document.getElementById('play-btn').addEventListener('click', () => this.showSinglePlayerMenu());
        document.getElementById('multiplayer-btn').addEventListener('click', () => this.showMultiplayerMenu());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsMenu());

        // Single Player Options
        document.getElementById('sp-symbol-x-btn').addEventListener('click', () => this.startSinglePlayer('X'));
        document.getElementById('sp-symbol-o-btn').addEventListener('click', () => this.startSinglePlayer('O'));
        document.getElementById('sp-symbol-random-btn').addEventListener('click', () => this.startSinglePlayer('RANDOM'));
        document.getElementById('sp-back-btn').addEventListener('click', () => this.showMainMenu());
        
        // Back Buttons
        document.getElementById('ttt-back-btn').addEventListener('click', () => this.goBack());
        document.getElementById('mp-back-btn').addEventListener('click', () => this.showMainMenu());
        
        // Board Interactions
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
        this.resetButton.addEventListener('click', () => this.resetGame());
    }
    
    // === Navigation ===
    showMainMenu() {
        this.stopComputerTurn();
        this.leaveQueue();
        this.stopMatchmakingPolling();
        this.mainMenu.style.display = '';
        this.singlePlayerOptions.style.display = 'none';
        this.multiplayerOptions.style.display = 'none';
        this.boardSection.style.display = 'none';
        this.settingsSection.style.display = 'none';
        document.getElementById('ttt-back-btn').style.display = 'none';
    }

    showSinglePlayerMenu() {
        this.stopGamePolling();
        this.stopMatchmakingPolling();
        this.stopComputerTurn();
        this.leaveQueue();
        this.isMultiplayer = false;
        this.gameRoomCode = '';
        this.playerSymbol = '';

        this.mainMenu.style.display = 'none';
        this.singlePlayerOptions.style.display = '';
        this.multiplayerOptions.style.display = 'none';
        this.boardSection.style.display = 'none';
        this.settingsSection.style.display = 'none';
        document.getElementById('ttt-back-btn').style.display = '';
    }
    
    showMultiplayerMenu() {
        this.mainMenu.style.display = 'none';
        this.singlePlayerOptions.style.display = 'none';
        this.multiplayerOptions.style.display = '';
        this.boardSection.style.display = 'none';
        this.settingsSection.style.display = 'none';
        document.getElementById('ttt-back-btn').style.display = '';
        this.beginMatchmaking();
    }
    
    showSettingsMenu() {
        this.mainMenu.style.display = 'none';
        this.singlePlayerOptions.style.display = 'none';
        this.multiplayerOptions.style.display = 'none';
        this.boardSection.style.display = 'none';
        this.settingsSection.style.display = '';
        document.getElementById('ttt-back-btn').style.display = '';
    }
    
    showBoard() {
        this.mainMenu.style.display = 'none';
        this.singlePlayerOptions.style.display = 'none';
        this.multiplayerOptions.style.display = 'none';
        this.boardSection.style.display = '';
        this.settingsSection.style.display = 'none';
        document.getElementById('ttt-back-btn').style.display = '';
    }
    
    goBack() {
        this.stopGamePolling();
        this.stopMatchmakingPolling();
        this.stopComputerTurn();
        this.leaveQueue();
        this.isMultiplayer = false;
        this.humanSymbol = '';
        this.computerSymbol = '';
        this.showMainMenu();
    }
    
    // === Single Player ===
    startSinglePlayer(selectedSymbol) {
        this.stopGamePolling();
        this.stopMatchmakingPolling();
        this.stopComputerTurn();
        this.leaveQueue();
        this.isMultiplayer = false;
        this.gameRoomCode = '';
        this.playerSymbol = '';

        const finalSymbol = selectedSymbol === 'RANDOM'
            ? (Math.random() < 0.5 ? 'X' : 'O')
            : selectedSymbol;

        this.humanSymbol = finalSymbol;
        this.computerSymbol = this.humanSymbol === 'X' ? 'O' : 'X';

        this.clearGameState();
        this.showBoard();

        if (this.currentPlayer === this.computerSymbol) {
            this.scheduleComputerMove();
        }
    }

    // === Multiplayer Matchmaking ===
    beginMatchmaking() {
        this.stopGamePolling();
        this.isMultiplayer = true;
        this.playerSymbol = '';
        this.gameRoomCode = '';
        this.queueStartTime = Date.now();
        this.matchmakingStatus.textContent = 'Joining queue...';
        this.waitEstimate.textContent = 'Checking activity...';

        fetch('/game/matchmaking/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: this.clientId })
        })
            .then(r => r.json())
            .then(data => this.handleMatchmakingState(data))
            .catch(e => {
                console.error('Matchmaking join error:', e);
                this.matchmakingStatus.textContent = 'Unable to reach matchmaking service.';
                this.waitEstimate.textContent = 'Try again in a moment.';
            });

        this.startMatchmakingPolling();
    }

    startMatchmakingPolling() {
        this.stopMatchmakingPolling();

        this.matchmakingInterval = setInterval(() => {
            fetch(`/game/matchmaking/status?client_id=${encodeURIComponent(this.clientId)}`)
                .then(r => r.json())
                .then(data => this.handleMatchmakingState(data))
                .catch(e => console.error('Matchmaking status error:', e));
        }, 1000);
    }

    stopMatchmakingPolling() {
        if (this.matchmakingInterval) {
            clearInterval(this.matchmakingInterval);
            this.matchmakingInterval = null;
        }
    }

    handleMatchmakingState(data) {
        if (!data || !data.success) return;

        const waitingCount = Number(data.waiting_count || 0);
        this.updateOnlineIndicator(waitingCount);

        if (data.matched && data.room_code && data.player_symbol) {
            this.stopMatchmakingPolling();
            this.gameRoomCode = data.room_code;
            this.playerSymbol = data.player_symbol;
            this.clearGameState();
            this.showBoard();
            this.startPolling();
            this.status.textContent = `Matched! You are ${this.playerSymbol}. ${this.currentPlayer === this.playerSymbol ? 'Your turn.' : 'Opponent starts.'}`;
            return;
        }

        const secondsWaiting = Math.floor((Date.now() - this.queueStartTime) / 1000);
        this.matchmakingStatus.textContent = `Searching for opponent... (${secondsWaiting}s)`;
        this.waitEstimate.textContent = this.getWaitEstimate(waitingCount);
    }

    getWaitEstimate(waitingCount) {
        if (waitingCount <= 0) return 'No one is waiting right now.';
        if (waitingCount === 1) return 'One player is waiting. Match should start soon.';
        return `${waitingCount} players are waiting. You should be matched quickly.`;
    }

    leaveQueue() {
        fetch('/game/matchmaking/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: this.clientId })
        }).catch(e => console.error('Leave queue error:', e));
    }
    
    // === Game Logic ===
    handleCellClick(e) {
        if (!this.gameActive) return;
        
        const cell = e.target;
        const index = parseInt(cell.dataset.index, 10);
        
        // Check if cell is empty
        if (this.gameState[index] !== '') {
            this.status.textContent = 'Cell already taken!';
            return;
        }
        
        // Multiplayer: check if it's your turn
        if (this.isMultiplayer) {
            if (this.currentPlayer !== this.playerSymbol) {
                this.status.textContent = "Wait for your turn!";
                return;
            }
            
            // Send move to server
            fetch('/game/make_move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_code: this.gameRoomCode,
                    position: index,
                    player: this.playerSymbol
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    this.gameState = data.game_state.slice();
                    this.currentPlayer = data.current_player;
                    this.updateDisplay();
                    this.checkGameEnd(data);
                } else {
                    this.status.textContent = 'Invalid move!';
                }
            })
            .catch(e => console.error('Move error:', e));
        } else {
            // Single-player: block input while computer is thinking/playing.
            if (!this.humanSymbol || this.currentPlayer !== this.humanSymbol) {
                this.status.textContent = "Computer's turn!";
                return;
            }

            this.gameState[index] = this.currentPlayer;
            this.updateDisplay();
            
            if (this.checkForWin(this.currentPlayer)) {
                this.status.textContent = 'You win!';
                this.status.classList.add('win');
                this.gameActive = false;
            } else if (!this.gameState.includes('')) {
                this.status.textContent = "It's a draw!";
                this.gameActive = false;
            } else {
                this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
                this.updateStatus();
                this.scheduleComputerMove();
            }
        }
    }
    
    checkGameEnd(data) {
        if (data.winner) {
            this.status.textContent = `Player ${data.winner} wins!`;
            this.status.classList.add('win');
            this.gameActive = false;
        } else if (data.draw) {
            this.status.textContent = "It's a draw!";
            this.gameActive = false;
        } else {
            this.updateStatus();
        }
    }
    
    checkForWin(player) {
        const conditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        return conditions.some(cond => 
            this.gameState[cond[0]] === player &&
            this.gameState[cond[1]] === player &&
            this.gameState[cond[2]] === player
        );
    }
    
    updateDisplay() {
        this.cells.forEach((cell, index) => {
            cell.textContent = this.gameState[index];
            if (this.gameState[index] === 'X') {
                cell.style.color = '#3498db';
            } else if (this.gameState[index] === 'O') {
                cell.style.color = '#e74c3c';
            } else {
                cell.style.color = '';
            }
        });
        this.updateStatus();
    }
    
    updateStatus() {
        if (!this.gameActive) return;

        if (this.isMultiplayer && this.playerSymbol) {
            const turnText = this.currentPlayer === this.playerSymbol ? 'Your turn' : "Opponent's turn";
            this.status.textContent = `You are ${this.playerSymbol}. ${turnText}`;
            return;
        }

        if (!this.isMultiplayer && this.humanSymbol && this.computerSymbol) {
            const turnText = this.currentPlayer === this.humanSymbol ? 'Your turn' : "Computer's turn";
            this.status.textContent = `You are ${this.humanSymbol}. ${turnText}`;
            return;
        }

        this.status.textContent = `It's ${this.currentPlayer}'s turn`;
    }
    
    resetGame() {
        if (this.isMultiplayer) {
            fetch('/game/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_code: this.gameRoomCode })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    this.clearGameState();
                }
            })
            .catch(e => console.error('Reset error:', e));
        } else {
            this.stopComputerTurn();
            this.clearGameState();

            if (this.humanSymbol && this.currentPlayer === this.computerSymbol) {
                this.scheduleComputerMove();
            }
        }
    }
    
    clearGameState() {
        this.stopComputerTurn();
        this.gameState = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.status.classList.remove('win');
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.style.color = '';
        });
        this.updateStatus();
    }

    scheduleComputerMove() {
        this.stopComputerTurn();

        if (!this.gameActive || this.isMultiplayer || this.currentPlayer !== this.computerSymbol) {
            return;
        }

        this.computerMoveTimeout = setTimeout(() => {
            this.makeComputerMove();
        }, 450);
    }

    stopComputerTurn() {
        if (this.computerMoveTimeout) {
            clearTimeout(this.computerMoveTimeout);
            this.computerMoveTimeout = null;
        }
    }

    makeComputerMove() {
        if (!this.gameActive || this.isMultiplayer || this.currentPlayer !== this.computerSymbol) {
            return;
        }

        const move = this.getBestComputerMove();
        if (move < 0) return;

        this.gameState[move] = this.computerSymbol;
        this.updateDisplay();

        if (this.checkForWin(this.computerSymbol)) {
            this.status.textContent = 'Computer wins!';
            this.status.classList.add('win');
            this.gameActive = false;
            return;
        }

        if (!this.gameState.includes('')) {
            this.status.textContent = "It's a draw!";
            this.gameActive = false;
            return;
        }

        this.currentPlayer = this.humanSymbol;
        this.updateStatus();
    }

    getBestComputerMove() {
        const emptyIndices = this.gameState
            .map((value, index) => (value === '' ? index : -1))
            .filter(index => index >= 0);

        if (!emptyIndices.length) return -1;

        const winningMove = this.findWinningMove(this.computerSymbol);
        if (winningMove >= 0) return winningMove;

        const blockingMove = this.findWinningMove(this.humanSymbol);
        if (blockingMove >= 0) return blockingMove;

        if (this.gameState[4] === '') return 4;

        const corners = [0, 2, 6, 8].filter(index => this.gameState[index] === '');
        if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    findWinningMove(symbol) {
        const conditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const [a, b, c] of conditions) {
            const line = [this.gameState[a], this.gameState[b], this.gameState[c]];
            const symbolCount = line.filter(v => v === symbol).length;
            const emptyCount = line.filter(v => v === '').length;

            if (symbolCount === 2 && emptyCount === 1) {
                if (this.gameState[a] === '') return a;
                if (this.gameState[b] === '') return b;
                return c;
            }
        }

        return -1;
    }
    
    // === Multiplayer Polling ===
    startPolling() {
        this.stopGamePolling();
        
        this.pollingInterval = setInterval(() => {
            if (!this.isMultiplayer || !this.gameRoomCode) {
                this.stopGamePolling();
                return;
            }
            
            fetch(`/game/get_state/${this.gameRoomCode}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        const stateChanged = JSON.stringify(this.gameState) !== JSON.stringify(data.game_state);
                        this.gameState = data.game_state.slice();
                        this.currentPlayer = data.current_player;
                        this.gameActive = data.game_active;
                        
                        if (stateChanged) {
                            this.updateDisplay();
                            this.checkGameEnd(data);
                        }
                    }
                })
                .catch(e => console.error('Polling error:', e));
        }, 300);
    }

    stopGamePolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    startOnlineCountPolling() {
        const fetchOnlineCount = () => {
            fetch('/game/matchmaking/status')
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        this.updateOnlineIndicator(Number(data.waiting_count || 0));
                    }
                })
                .catch(e => console.error('Online count error:', e));
        };

        fetchOnlineCount();

        this.onlineCountInterval = setInterval(() => {
            fetchOnlineCount();
        }, 2000);
    }

    updateOnlineIndicator(waitingCount) {
        this.onlineCount.textContent = String(waitingCount);

        if (waitingCount > 0) {
            this.onlineDot.classList.remove('status-offline');
            this.onlineDot.classList.add('status-online');
        } else {
            this.onlineDot.classList.remove('status-online');
            this.onlineDot.classList.add('status-offline');
        }
    }

    getOrCreateClientId() {
        const key = 'ttt_client_id';
        let clientId = localStorage.getItem(key);

        if (!clientId) {
            clientId = `client_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
            localStorage.setItem(key, clientId);
        }

        return clientId;
    }
    
    // === Utilities ===
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToeGame();
});