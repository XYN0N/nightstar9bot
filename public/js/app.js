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
    fetch('/api/leaderboard')
        .then(response => response.json())
        .then(leaderboard => {
            const list = document.getElementById('leaderboard-list');
            list.innerHTML = '';
            leaderboard.forEach(player => {
                const listItem = document.createElement('li');
                listItem.textContent = `${player.positionEmoji} ${player.name} - Wins: ${player.wins} 🏆${player.badge}`;
                list.appendChild(listItem);
            });
        })
        .catch(error => console.error('Error fetching leaderboard:', error));
});

document.getElementById('recharge-btn').addEventListener('click', () => {
    displaySection('recharge-section');
});

document.querySelectorAll('.challenge-btn').forEach(button => {
    button.addEventListener('click', () => {
        const betAmount = parseInt(button.getAttribute('data-bet'));
        const playerId = 'player1'; // Replace with dynamic value
        fetch('/api/play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ playerId, betAmount })
        })
            .then(response => response.json())
            .then(result => alert(`${result.winner.name} wins with number ${result.player1Number} vs ${result.player2Number}!`))
            .catch(error => console.error('Error starting challenge:', error));
    });
});

document.getElementById('buy-stars-btn').addEventListener('click', () => {
    const telegramId = '123456789'; // Replace with dynamic value
    fetch('/api/shop/buy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ telegramId, stars: 100 })
    })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error('Error buying stars:', error));
});

function displaySection(sectionId) {
    document.querySelectorAll('.app-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}