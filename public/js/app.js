const socket = new WebSocket(`wss://${window.location.host}`);

document.getElementById('profile-btn').addEventListener('click', () => {
    displaySection('profile-section');
    const telegramId = '123456789'; // Replace with dynamic value
    fetch(`/api/profile/${telegramId}`)
        .then(response => response.json())
        .then(user => {
            document.getElementById('profile-photo').src = user.profilePhoto;
            document.getElementById('profile-name').textContent = user.name;
            document.getElementById('profile-stats').textContent = `Stars: ${user.stars} 🌟, Wins: ${user.wins}, Losses: ${user.losses}`;
            const badges = Math.floor(user.totalWinnings / 100);
            document.getElementById('badge-container').textContent = `Badges: ${'🏆'.repeat(badges)}`;
        })
        .catch(error => console.error('Error fetching profile:', error));
});

document.getElementById('challenges-btn').addEventListener('click', () => {
    displaySection('challenges-section');
});

document.getElementById('leaderboard-btn').addEventListener('click', () => {
    displaySection('leaderboard-section');
    fetchLeaderboard();
});

document.getElementById('recharge-btn').addEventListener('click', () => {
    displaySection('recharge-section');
});

document.querySelectorAll('.challenge-btn').forEach(button => {
    button.addEventListener('click', () => {
        const betAmount = parseInt(button.getAttribute('data-bet'));
        const playerId = 'player1'; // Replace with dynamic value
        socket.send(JSON.stringify({ type: 'find-match', playerId, betAmount }));
    });
});

document.querySelectorAll('.recharge-btn').forEach(button => {
    button.addEventListener('click', () => {
        const stars = parseInt(button.getAttribute('data-stars'));
        const telegramId = '123456789'; // Replace with dynamic value
        fetch('/api/shop/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegramId, stars })
        })
            .then(response => response.json())
            .then(data => alert(data.message))
            .catch(error => console.error('Error buying stars:', error));
    });
});

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'leaderboard-update') {
        updateLeaderboard(data.leaderboard);
    } else if (data.type === 'match-found') {
        alert(`Match found! ${data.player1.name} vs ${data.player2.name}`);
        startGame(data.player1, data.player2);
    }
};

function fetchLeaderboard() {
    fetch('/api/leaderboard')
        .then(response => response.json())
        .then(leaderboard => updateLeaderboard(leaderboard))
        .catch(error => console.error('Error fetching leaderboard:', error));
}

function updateLeaderboard(leaderboard) {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    leaderboard.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = `${player.positionEmoji} ${player.name} - Wins: ${player.wins} 🏆${player.badge}`;
        list.appendChild(listItem);
    });
}

function startGame(player1, player2) {
    // Display game UI with player1 and player2 information
    console.log('Starting game between', player1.name, 'and', player2.name);
}

function displaySection(sectionId) {
    document.querySelectorAll('.app-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}