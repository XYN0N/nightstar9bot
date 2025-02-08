import React from 'react';

const Referral = () => {
    const referralCode = "YOUR_REFERRAL_CODE"; // Sostituisci con il codice reale

    const handleCopyClick = () => {
        navigator.clipboard.writeText(referralCode);
        alert("Referral code copied to clipboard!");
    };

    return (
        <div className="referral">
            <button onClick={handleCopyClick}>Copy Referral Link</button>
        </div>
    );
};

export default Referral;