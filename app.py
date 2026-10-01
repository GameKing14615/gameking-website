from flask import Flask, render_template, send_from_directory, request, jsonify
from datetime import datetime
from pathlib import Path
import uuid
import random
import time
import sqlite3
import hashlib

# Create a Flask web application instance
app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'

# Game rooms storage
game_rooms = {}
matchmaking_queue = []
matchmaking_clients = {}

MATCHMAKING_STALE_SECONDS = 20
DB_PATH = Path(__file__).resolve().parent / 'gameking.db'
DEFAULT_BEFOREGTA6_POSTS = [
    {
        'post_key': 'seed-flying-taxis',
        'title': 'We got flying taxis before GTA 6',
        'description': 'Prototype eVTOL fleets now operate in three test cities with paid commuter routes.',
        'image': '/static/images/beforegta6.jpg',
        'author': '@Gamer_Life',
        'days_ago': 0,
        'upvotes': 12000,
        'downvotes': 420,
        'comments': 1500,
        'badge': 'News',
        'tags': 'Science,News'
    },
    {
        'post_key': 'seed-ai-toasters',
        'title': 'We got AI-powered toasters before GTA 6',
        'description': 'They can read nutrition labels, detect bread type, and roast with computer vision now.',
        'image': '/static/images/beforegta6.jpg',
        'author': '@Tech_Junkie',
        'days_ago': 1,
        'upvotes': 8000,
        'downvotes': 330,
        'comments': 900,
        'badge': 'Gadgets',
        'tags': 'Entertainment'
    },
    {
        'post_key': 'seed-immersive-vr',
        'title': 'We got fully immersive VR before GTA 6',
        'description': 'Consumer setups now do eye tracking, haptics, and full body movement in one kit.',
        'image': '/static/images/beforegta6.jpg',
        'author': '@Future_Now',
        'days_ago': 2,
        'upvotes': 20000,
        'downvotes': 790,
        'comments': 3200,
        'badge': 'Tech',
        'tags': 'Gaming'
    },
    {
        'post_key': 'seed-neural-city',
        'title': 'We got neural city planners before GTA 6',
        'description': 'Simulation models now optimize traffic and zoning plans across entire metro regions.',
        'image': '/static/images/beforegta6.jpg',
        'author': '@CyberSec',
        'days_ago': 3,
        'upvotes': 15000,
        'downvotes': 550,
        'comments': 2100,
        'badge': 'Future',
        'tags': 'Politics,Science'
    }
]


def _get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_database():
    conn = _get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS social_profiles (
            user_key TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            handle TEXT NOT NULL,
            username TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS post_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            tags TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS beforegta6_posts (
            post_key TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            image TEXT NOT NULL,
            author TEXT NOT NULL,
            days_ago INTEGER NOT NULL DEFAULT 0,
            upvotes INTEGER NOT NULL DEFAULT 0,
            downvotes INTEGER NOT NULL DEFAULT 0,
            comments INTEGER NOT NULL DEFAULT 0,
            badge TEXT NOT NULL,
            tags TEXT,
            created_at TEXT NOT NULL
        )
    ''')

    now_iso = datetime.utcnow().isoformat() + 'Z'
    for post in DEFAULT_BEFOREGTA6_POSTS:
        cursor.execute(
            '''
            INSERT OR IGNORE INTO beforegta6_posts
            (post_key, title, description, image, author, days_ago, upvotes, downvotes, comments, badge, tags, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                post['post_key'], post['title'], post['description'], post['image'], post['author'],
                post['days_ago'], post['upvotes'], post['downvotes'], post['comments'], post['badge'], post['tags'], now_iso
            )
        )
    conn.commit()
    conn.close()


_init_database()


def _cleanup_matchmaking():
    """Remove stale clients from matchmaking state."""
    now = time.time()
    stale_ids = {
        client_id
        for client_id, client in matchmaking_clients.items()
        if now - client.get('last_seen', 0) > MATCHMAKING_STALE_SECONDS
    }

    if stale_ids:
        for client_id in stale_ids:
            matchmaking_clients.pop(client_id, None)
        matchmaking_queue[:] = [cid for cid in matchmaking_queue if cid not in stale_ids]


def _generate_room_code(length=6):
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    while True:
        room_code = ''.join(random.choice(chars) for _ in range(length))
        if room_code not in game_rooms:
            return room_code


def _pair_players_if_possible():
    """Pair waiting players in FIFO order."""
    while len(matchmaking_queue) >= 2:
        player_x = matchmaking_queue.pop(0)
        player_o = matchmaking_queue.pop(0)

        if player_x not in matchmaking_clients or player_o not in matchmaking_clients:
            continue

        room_code = _generate_room_code()
        room = GameRoom(room_code)
        room.add_player('X')
        room.add_player('O')
        game_rooms[room_code] = room

        matchmaking_clients[player_x].update({
            'status': 'matched',
            'room_code': room_code,
            'symbol': 'X'
        })
        matchmaking_clients[player_o].update({
            'status': 'matched',
            'room_code': room_code,
            'symbol': 'O'
        })

        print(f"[MATCHMAKING] Paired clients {player_x} and {player_o} in room {room_code}")

class GameRoom:
    def __init__(self, room_code):
        self.room_code = room_code
        self.players = {}  # {'X': True/False, 'O': True/False}
        self.game_state = ['', '', '', '', '', '', '', '', '']
        self.current_player = 'X'
        self.game_active = True
        self.winner = None
        self.created_at = datetime.now()

    def is_ready(self):
        """Check if both players have joined"""
        return len(self.players) == 2

    def add_player(self, symbol):
        """Add a player to the room"""
        if symbol in self.players:
            return False
        self.players[symbol] = True
        return True

    def make_move(self, position, player):
        """Execute a move"""
        # Validate position
        if not isinstance(position, int) or position < 0 or position > 8:
            return {'success': False, 'message': 'Invalid position'}
        
        # Check if cell is empty
        if self.game_state[position] != '':
            return {'success': False, 'message': 'Cell already occupied'}
        
        # Check if it's the player's turn
        if self.current_player != player:
            return {'success': False, 'message': 'Not your turn'}
        
        # Make the move
        self.game_state[position] = player
        
        # Check for win
        if self._check_win(player):
            self.winner = player
            self.game_active = False
            return {'success': True, 'winner': self.winner}
        
        # Check for draw
        if '' not in self.game_state:
            self.game_active = False
            return {'success': True, 'draw': True}
        
        # Switch player
        self.current_player = 'O' if self.current_player == 'X' else 'X'
        
        return {'success': True}

    def _check_win(self, player):
        """Check if player has won"""
        winning_conditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ]
        
        for condition in winning_conditions:
            if (self.game_state[condition[0]] == player and
                self.game_state[condition[1]] == player and
                self.game_state[condition[2]] == player):
                return True
        return False

    def reset(self):
        """Reset the game board"""
        self.game_state = ['', '', '', '', '', '', '', '', '']
        self.current_player = 'X'
        self.game_active = True
        self.winner = None

    def to_dict(self):
        """Convert room state to dictionary"""
        return {
            'game_state': self.game_state,
            'current_player': self.current_player,
            'game_active': self.game_active,
            'winner': self.winner,
            'draw': not self.game_active and self.winner is None
        }

# Routes for single player
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/tictactoe')
def tictactoe():
    return render_template('tictactoe.html')

@app.route('/beforegta6')
def beforegta6():
    return render_template('beforegta6.html')

# === Multiplayer Game Routes ===

@app.route('/game/create_room', methods=['POST'])
def create_room():
    """Create a new room or join existing room"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    room_code = data.get('room_code', '').upper()
    mode = data.get('mode', '')
    
    if not room_code or len(room_code) != 6:
        return jsonify({'success': False, 'message': 'Invalid room code'}), 400
    
    if mode not in ['host', 'join']:
        return jsonify({'success': False, 'message': 'Invalid mode'}), 400
    
    if mode == 'host':
        # Check if room already exists
        if room_code in game_rooms:
            return jsonify({'success': False, 'message': 'Room code already in use'}), 400
        
        # Create new room
        room = GameRoom(room_code)
        room.add_player('X')
        game_rooms[room_code] = room
        
        print(f"[HOST] Room created: {room_code}")
        return jsonify({'success': True, 'message': 'Room created successfully'})
    
    else:  # mode == 'join'
        # Check if room exists
        if room_code not in game_rooms:
            return jsonify({'success': False, 'message': 'Room not found'}), 404
        
        room = game_rooms[room_code]
        
        # Check if room is full
        if 'O' in room.players:
            return jsonify({'success': False, 'message': 'Room is full'}), 400
        
        # Add player
        room.add_player('O')
        
        print(f"[JOIN] Player joined room: {room_code}")
        return jsonify({'success': True, 'message': 'Joined room successfully'})

@app.route('/game/get_state/<room_code>', methods=['GET'])
def get_state(room_code):
    """Get current game state"""
    room_code = room_code.upper()
    
    if room_code not in game_rooms:
        return jsonify({'success': False, 'message': 'Room not found'}), 404
    
    room = game_rooms[room_code]
    state = room.to_dict()
    state['success'] = True
    
    return jsonify(state)

@app.route('/game/make_move', methods=['POST'])
def make_move():
    """Make a move in the game"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    room_code = data.get('room_code', '').upper()
    position = data.get('position')
    player = data.get('player')
    
    if not room_code or position is None or not player:
        return jsonify({'success': False, 'message': 'Missing parameters'}), 400
    
    if room_code not in game_rooms:
        return jsonify({'success': False, 'message': 'Room not found'}), 404
    
    room = game_rooms[room_code]
    
    # Try to make the move
    result = room.make_move(position, player)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    # Return updated state
    state = room.to_dict()
    state['success'] = True
    
    print(f"[MOVE] Room {room_code}: {player} played at {position}")
    
    return jsonify(state)

@app.route('/game/reset', methods=['POST'])
def reset_game():
    """Reset the current game"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    room_code = data.get('room_code', '').upper()
    
    if not room_code or room_code not in game_rooms:
        return jsonify({'success': False, 'message': 'Room not found'}), 404
    
    room = game_rooms[room_code]
    room.reset()
    
    print(f"[RESET] Room {room_code} reset")
    
    return jsonify({'success': True})


@app.route('/game/matchmaking/join', methods=['POST'])
def matchmaking_join():
    """Join matchmaking queue and auto-pair when possible."""
    data = request.get_json() or {}
    client_id = (data.get('client_id') or '').strip()

    if not client_id:
        return jsonify({'success': False, 'message': 'Missing client_id'}), 400

    _cleanup_matchmaking()
    now = time.time()

    client = matchmaking_clients.get(client_id)
    if not client:
        matchmaking_clients[client_id] = {
            'status': 'waiting',
            'room_code': None,
            'symbol': None,
            'last_seen': now
        }
    else:
        client['last_seen'] = now

    if matchmaking_clients[client_id].get('status') != 'matched':
        matchmaking_clients[client_id]['status'] = 'waiting'
        matchmaking_clients[client_id]['room_code'] = None
        matchmaking_clients[client_id]['symbol'] = None
        if client_id not in matchmaking_queue:
            matchmaking_queue.append(client_id)

    _pair_players_if_possible()

    client_state = matchmaking_clients.get(client_id, {})
    waiting_count = len(matchmaking_queue)

    return jsonify({
        'success': True,
        'waiting_count': waiting_count,
        'matched': client_state.get('status') == 'matched',
        'room_code': client_state.get('room_code'),
        'player_symbol': client_state.get('symbol')
    })


@app.route('/game/matchmaking/status', methods=['GET'])
def matchmaking_status():
    """Get queue count and current client's matchmaking status."""
    client_id = (request.args.get('client_id') or '').strip()

    _cleanup_matchmaking()

    waiting_count = len(matchmaking_queue)
    response = {
        'success': True,
        'waiting_count': waiting_count,
        'matched': False,
        'room_code': None,
        'player_symbol': None
    }

    if client_id and client_id in matchmaking_clients:
        matchmaking_clients[client_id]['last_seen'] = time.time()
        client_state = matchmaking_clients[client_id]
        response.update({
            'matched': client_state.get('status') == 'matched',
            'room_code': client_state.get('room_code'),
            'player_symbol': client_state.get('symbol')
        })

    return jsonify(response)


@app.route('/game/matchmaking/leave', methods=['POST'])
def matchmaking_leave():
    """Leave matchmaking queue."""
    data = request.get_json() or {}
    client_id = (data.get('client_id') or '').strip()

    if not client_id:
        return jsonify({'success': False, 'message': 'Missing client_id'}), 400

    if client_id in matchmaking_queue:
        matchmaking_queue.remove(client_id)

    client = matchmaking_clients.get(client_id)
    if client and client.get('status') != 'matched':
        matchmaking_clients.pop(client_id, None)

    return jsonify({'success': True})


@app.route('/api/social-login', methods=['POST'])
def social_login():
    """Persist a social-profile style login for frontend account sync."""
    data = request.get_json() or {}
    provider = (data.get('provider') or '').strip().lower()
    handle = (data.get('handle') or '').strip()

    allowed_providers = {'google', 'twitter', 'facebook', 'reddit'}
    if provider not in allowed_providers:
        return jsonify({'success': False, 'message': 'Unsupported provider'}), 400

    if not handle:
        return jsonify({'success': False, 'message': 'Missing handle'}), 400

    normalized_handle = ''.join(ch for ch in handle if ch.isalnum() or ch in ('_', '-', '.'))[:32]
    if not normalized_handle:
        return jsonify({'success': False, 'message': 'Handle is invalid'}), 400

    user_key = hashlib.sha256(f"{provider}:{normalized_handle.lower()}".encode('utf-8')).hexdigest()
    username = normalized_handle
    now_iso = datetime.utcnow().isoformat() + 'Z'

    conn = _get_db_connection()
    conn.execute(
        '''
        INSERT INTO social_profiles (user_key, provider, handle, username, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_key) DO UPDATE SET
            handle=excluded.handle,
            username=excluded.username,
            updated_at=excluded.updated_at
        ''',
        (user_key, provider, handle, username, now_iso)
    )
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'username': username,
        'profile': {
            'user_key': user_key,
            'provider': provider,
            'handle': handle,
            'username': username,
            'updated_at': now_iso
        }
    })


@app.route('/api/post-event', methods=['POST'])
def post_event():
    """Store lightweight post creation event for analytics/debugging."""
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    author = (data.get('author') or '').strip()
    tags = data.get('tags') or []

    if not title or not author:
        return jsonify({'success': False, 'message': 'Missing title or author'}), 400

    tag_text = ','.join(str(tag) for tag in tags[:8]) if isinstance(tags, list) else ''

    conn = _get_db_connection()
    conn.execute(
        'INSERT INTO post_events (title, author, tags, created_at) VALUES (?, ?, ?, ?)',
        (title, author, tag_text, datetime.utcnow().isoformat() + 'Z')
    )
    conn.commit()
    conn.close()

    return jsonify({'success': True})


@app.route('/api/beforegta6/posts', methods=['GET'])
def beforegta6_posts_list():
    """Return Before GTA 6 posts from persistent storage."""
    conn = _get_db_connection()
    rows = conn.execute(
        '''
        SELECT post_key, title, description, image, author, days_ago, upvotes, downvotes, comments, badge, tags
        FROM beforegta6_posts
        ORDER BY upvotes DESC, created_at DESC
        '''
    ).fetchall()
    conn.close()

    posts = []
    for row in rows:
        tags = [tag.strip() for tag in (row['tags'] or '').split(',') if tag.strip()]
        posts.append({
            'post_key': row['post_key'],
            'title': row['title'],
            'description': row['description'],
            'image': row['image'],
            'author': row['author'],
            'daysAgo': row['days_ago'],
            'upvotes': row['upvotes'],
            'downvotes': row['downvotes'],
            'comments': row['comments'],
            'badge': row['badge'],
            'tags': tags
        })

    return jsonify({'success': True, 'posts': posts})


@app.route('/api/beforegta6/posts', methods=['POST'])
def beforegta6_create_post():
    """Create a persistent Before GTA 6 post."""
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    image = (data.get('image') or '').strip()
    author = (data.get('author') or '').strip()
    badge = (data.get('badge') or '').strip() or 'General'
    tags = data.get('tags') if isinstance(data.get('tags'), list) else []

    if not title or not description or not image or not author:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    post_key = 'post-' + uuid.uuid4().hex[:12]
    tags_text = ','.join(str(tag).strip() for tag in tags[:8] if str(tag).strip())
    now_iso = datetime.utcnow().isoformat() + 'Z'

    conn = _get_db_connection()
    conn.execute(
        '''
        INSERT INTO beforegta6_posts
        (post_key, title, description, image, author, days_ago, upvotes, downvotes, comments, badge, tags, created_at)
        VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, ?)
        ''',
        (post_key, title, description, image, author, badge, tags_text, now_iso)
    )
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'post': {
            'post_key': post_key,
            'title': title,
            'description': description,
            'image': image,
            'author': author,
            'daysAgo': 0,
            'upvotes': 0,
            'downvotes': 0,
            'comments': 0,
            'badge': badge,
            'tags': tags
        }
    })


@app.route('/api/beforegta6/vote', methods=['POST'])
def beforegta6_vote():
    """Persist up/down votes for a post."""
    data = request.get_json() or {}
    post_key = (data.get('post_key') or '').strip()
    vote_type = (data.get('vote_type') or '').strip().lower()

    if not post_key or vote_type not in {'up', 'down'}:
        return jsonify({'success': False, 'message': 'Invalid vote payload'}), 400

    column = 'upvotes' if vote_type == 'up' else 'downvotes'
    conn = _get_db_connection()
    updated = conn.execute(
        f'UPDATE beforegta6_posts SET {column} = {column} + 1 WHERE post_key = ?',
        (post_key,)
    )

    if updated.rowcount == 0:
        conn.close()
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    row = conn.execute(
        'SELECT upvotes, downvotes FROM beforegta6_posts WHERE post_key = ?',
        (post_key,)
    ).fetchone()
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'post_key': post_key,
        'upvotes': row['upvotes'],
        'downvotes': row['downvotes']
    })

# This part runs the application when you execute the script
if __name__ == '__main__':
    _init_database()
    app.run(debug=True)  # debug=True allows automatic reloading on changes