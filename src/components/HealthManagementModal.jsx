import { useState, useEffect } from 'react';
import '../styles/Modal.css';
import HealthBar from './HealthBar';
import { useI18n } from '../i18n/i18nContext';
import { useAlert } from '../hooks/useAlert';

function HealthManagementModal({ isOpen, onClose, onUpdate, character = null, isHealing = false }) {
    const { t } = useI18n();
    const [amount, setAmount] = useState(0);
    const [visualHp, setVisualHp] = useState(0);
    const [visualMaxHp, setVisualMaxHp] = useState(0);
    const { showAlert } = useAlert();

    useEffect(() => {
        setAmount(0);
        setVisualHp(character?.hp || 0);
        setVisualMaxHp(character?.maxHp || 0);
    }, [isOpen]);

    if (!isOpen || !character) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!amount || amount <= 0) {
            showAlert('warning', t('validation.valid_amount'));
            return;
        }

        let newHp = character.hp;

        if (isHealing)
            newHp = Math.min(character.hp + amount, character.maxHp);
        else
            newHp = Math.max(character.hp - amount, 0);

        onUpdate({
            ...character,
            hp: newHp
        });

        handleClose();
    };

    const handleClose = () => {
        setAmount(0);
        onClose();
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2 className="title">{isHealing ? t('characters.heal_character', { name: character.name }) : t('characters.damage_character', { name: character.name })}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-row">
                            <div className="modal-column">
                                <label>
                                    <div id="icon-preview-container" className={character.icon ? 'has-image' : ''}>
                                        {character.icon && <img src={character.icon} alt="Ícone do personagem" />}
                                    </div>
                                </label>
                            </div>
                            <div className="modal-column modal-full-width">
                                <label>
                                    {t('characters.current_hp')}
                                    <HealthBar currentHealth={visualHp} maxHealth={visualMaxHp} />
                                </label>
                                <label>
                                    <div style={{ fontSize: '10pt', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        {isHealing ? t('characters.heal_amount') : t('characters.damage_amount')}
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => {
                                            const newAmount = parseInt(e.target.value) || 0;
                                            setAmount(newAmount);
                                            setVisualHp(isHealing ? Math.min(character.hp + newAmount, character.maxHp) : Math.max(character.hp - newAmount, 0));
                                        }}
                                        min="1"
                                        max={isHealing ? Math.max(1, character.maxHp - character.hp) : character.hp}
                                        required
                                    />
                                </label>
                            </div>
                        </div>
                    </form>
                    <div className="modal-actions">
                        <button className="button" type="submit" onClick={handleSubmit}>
                            {t('common.save')}
                        </button>
                        <button className="button" type="button" onClick={handleClose}>
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HealthManagementModal;