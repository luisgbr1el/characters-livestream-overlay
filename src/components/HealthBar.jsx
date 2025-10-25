import '../styles/HealthBar.css';

function HealthBar({ currentHealth, maxHealth }) {
    const healthPercentage = (currentHealth / maxHealth) * 100;

    const getHealthColor = (percentage) => {
        if (percentage < 25)
            return '#ff4444';
        else if (percentage >= 25 && percentage < 50)
            return '#ff8800';
        else if (percentage >= 50 && percentage < 75)
            return '#ffdd00';
        else
            return '#44ff44';
    };

    return (
        <div className="health-bar">
            <div
                className="health-bar-fill"
                style={{ 
                    width: `${healthPercentage}%`,
                    backgroundColor: getHealthColor(healthPercentage)
                }}
            ></div>
            <p>{currentHealth}/{maxHealth}</p>
        </div>
    );
}

export default HealthBar;