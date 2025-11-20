import '../styles/CharacterCard.css'
import HealthBar from './HealthBar';
import Tooltip from './Tooltip';
import { useAlert } from '../hooks/useAlert.jsx';
import { TbPencil, TbHeartPlus, TbHeartMinus, TbLink, TbUserHexagon } from "react-icons/tb";
import { useI18n } from '../i18n/i18nContext';
import { useEffect, useState } from 'react';
import apiConfig from '../utils/apiConfig.js';

function CharacterCard({ id, name, icon, hp, maxHp, onEdit, onHeal, onDamage }) {
    const { t } = useI18n();
    const { showAlert } = useAlert();
    const [iconExists, setIconExists] = useState(false);
    
    useEffect(() => {
        checkIfIconExists();
    }, [icon])

    const handleCopyUrl = () => {
        const url = apiConfig.getOverlayUrl(id);
        navigator.clipboard.writeText(url).then(() => {
            showAlert('success', t('characters.url_copied'))
        }).catch(err => {
            console.error("Error copying URL: ", err);
            showAlert('error', t('characters.url_copy_error'))
        });
    };

    const checkIfIconExists = async () => {
        if (!icon) {
            setIconExists(false);
            return;
        }

        try {
            const response = await fetch(icon, { method: 'HEAD' });
            setIconExists(response.ok);
        } catch (error) {
            console.error('Error checking icon existence:', error);
            setIconExists(false);
        }
    }

    return (
        <>
            <div className="character-card">
                {(icon && iconExists) ?
                    (
                        <img src={icon} alt={`${name}'s icon`} className={`character-icon ${hp === 0 ? "black-and-white" : ""}`} />
                    )
                    : (
                        <div className="character-icon">
                            <TbUserHexagon size={175} />
                        </div>
                    )}
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