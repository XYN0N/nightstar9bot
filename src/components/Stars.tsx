import React, { useState } from 'react';
import { redeemStar } from '../api'; // Assumi che ci sia una funzione API per riscattare la stella

const Stars = () => {
    const [lastRedeemTime, setLastRedeemTime] = useState(null);
    const [stars, setStars] = useState(0);

    const handleRedeemClick = async () => {
        const now = new Date();
        if (lastRedeemTime && (now - lastRedeemTime) < 3 * 60 * 60 * 1000) {
            alert("You can redeem a star only once every 3 hours.");
            return;
        }

        await redeemStar();
        setStars(stars + 1);
        setLastRedeemTime(now);
    };

    return (
        <div className="stars">
            <button onClick={handleRedeemClick}>Redeem Star</button>
            <p>Stars: {stars}</p>
        </div>
    );
};

export default Stars;