import '../styles/CharacterCard.css'
import HealthBar from './HealthBar';
import Tooltip from './Tooltip';
import { TbPencil } from "react-icons/tb";
import { TbHeartPlus } from "react-icons/tb";
import { TbHeartMinus } from "react-icons/tb";
import { TbLink } from "react-icons/tb";

function CharacterCard({ id, name, icon, hp, maxHp, onEdit, onHeal, onDamage }) {
    const handleCopyUrl = () => {
        const url = "http://localhost:3000/overlay/" + id;
        navigator.clipboard.writeText(url).then(() => {
            alert("URL copiada para a área de transferência!");
        }).catch(err => {
            console.error("Erro ao copiar URL: ", err);
        });
    };

    return (
        <>
            <div className="character-card">
                <img src={icon} alt={`${name}'s icon`} className={`character-icon ${hp === 0 ? "black-and-white" : ""}`} />
                <div className="character-info">
                    <h3 className="character-name">{name}</h3>
                    <div className="character-health">
                        <HealthBar currentHealth={hp} maxHealth={maxHp} />
                    </div>
                </div>
                <div className="character-actions">
                    <button id={`heal-button-${name}`} className="action-button" onClick={onHeal}>
                        <TbHeartPlus size={15} />
                    </button>
                    <Tooltip elementId={`heal-button-${name}`} text="Cura" position="left" />

                    <button id={`damage-button-${name}`} className="action-button" onClick={onDamage}>
                        <TbHeartMinus size={15} />
                    </button>
                    <Tooltip elementId={`damage-button-${name}`} text="Dano" position="left" />

                    <button id={`copy-url-button-${name}`} className="action-button" onClick={handleCopyUrl}>
                        <TbLink size={15} />
                    </button>
                    <Tooltip elementId={`copy-url-button-${name}`} text="Copiar URL" position="left" />

                    <button id={`edit-button-${name}`} className="action-button" onClick={onEdit}>
                        <TbPencil size={15} />
                    </button>
                    <Tooltip elementId={`edit-button-${name}`} text="Editar" position="left" />
                </div>
            </div>
        </>
    );
}

export default CharacterCard;