import '../styles/CharacterCard.css'
import HealthBar from './HealthBar';
import Tooltip from './Tooltip';
import { useAlert } from '../hooks/useAlert.jsx';
import { TbPencil, TbHeartPlus, TbHeartMinus, TbLink } from "react-icons/tb";
import { useI18n } from '../i18n/i18nContext';

function CharacterCard({ id, name, icon, hp, maxHp, onEdit, onHeal, onDamage }) {
    const { t } = useI18n();
    const { showAlert } = useAlert();

    const handleCopyUrl = () => {
        const url = "http://localhost:3000/overlay/" + id;
        navigator.clipboard.writeText(url).then(() => {
            showAlert('success', t('characters.url_copied'))
        }).catch(err => {
            console.error("Error copying URL: ", err);
            showAlert('error', t('characters.url_copy_error'))
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
                    <Tooltip elementId={`heal-button-${name}`} text={t('common.heal')} position="left" />

                    <button id={`damage-button-${name}`} className="action-button" onClick={onDamage}>
                        <TbHeartMinus size={15} />
                    </button>
                    <Tooltip elementId={`damage-button-${name}`} text={t('common.damage')} position="left" />

                    <button id={`copy-url-button-${name}`} className="action-button" onClick={handleCopyUrl}>
                        <TbLink size={15} />
                    </button>
                    <Tooltip elementId={`copy-url-button-${name}`} text={t('common.copy_url')} position="left" />

                    <button id={`edit-button-${name}`} className="action-button" onClick={onEdit}>
                        <TbPencil size={15} />
                    </button>
                    <Tooltip elementId={`edit-button-${name}`} text={t('common.edit')} position="left" />
                </div>
            </div>
        </>
    );
}

export default CharacterCard;