import '../styles/CharacterCard.css'
import HealthBar from './HealthBar';

function CharacterCard({ name, icon, hp, maxHp }) {
    return (
        <div className="character-card">
            <img src={icon} alt={`${name}'s icon`} className="character-icon" />
            <div className="character-info">
                <h3 className="character-name">{name}</h3>
                <div className="character-health">
                    <HealthBar currentHealth={hp} maxHealth={maxHp} />
                </div>
            </div>
        </div>
    );
}

export default CharacterCard;