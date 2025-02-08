import React, { useState, useEffect } from 'react';
import { createSession, getActiveLobbies } from '../api'; // Assumi che ci siano queste funzioni API

const Matchmaking = () => {
    const [lobbies, setLobbies] = useState([]);
    const [telegramData, setTelegramData] = useState(null);

    useEffect(() => {
        async function fetchLobbies() {
            const result = await getActiveLobbies();
            setLobbies(result);
        }
        fetchLobbies();
    }, []);

    const handlePlayClick = async () => {
        if (!telegramData) {
            alert("No telegram data provided");
            return;
        }
        await createSession(telegramData);
        fetchLobbies(); // Ricarica le lobby dopo aver creato una nuova sessione
    };

    return (
        <div className="matchmaking">
            <button onClick={handlePlayClick}>Gioca</button>
            <h2>Challengers</h2>
            <ul>
                {lobbies.map((lobby, index) => (
                    <li key={index}>
                        <button onClick={() => joinLobby(lobby.id)}>Join {lobby.name}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const joinLobby = async (lobbyId) => {
    // Implementa la logica per unirsi alla lobby
    console.log(`Joining lobby ${lobbyId}`);
};

export default Matchmaking;