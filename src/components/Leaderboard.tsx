import React, { useEffect, useState } from 'react';
import { getLeaderboardData } from '../api'; // Assumi che ci sia una funzione per ottenere i dati della leaderboard
import './Leaderboard.css'; // Assumi che ci sia un file CSS per lo stile

const Leaderboard = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const result = await getLeaderboardData();
            setData(result);
        }
        fetchData();
    }, []);

    if (!data.length) {
        return <div className="leaderboard">Loading...</div>;
    }

    return (
        <div className="leaderboard">
            <h1>Leaderboard</h1>
            <ul>
                {data.map((item, index) => (
                    <li key={index}>{item.name}: {item.score}</li>
                ))}
            </ul>
        </div>
    );
};

export default Leaderboard;