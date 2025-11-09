import { useState, useEffect } from 'react';
import '../styles/Modal.css';
import { useI18n } from '../i18n/i18nContext';
import { useAlert } from '../hooks/useAlert';
import ConfirmationModal from './ConfirmationModal.jsx';

function CharacterManagementModal({ isOpen, onClose, characters, onUpdateCharacters }) {
    const { t, locale } = useI18n();
    const { showAlert } = useAlert();
    let [charactersSelected, setCharactersSelected] = useState([]);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCharactersSelected([]);
        }
    }, [isOpen]);

    const toggleHiddenButtons = () => {
        let hiddenButtonsDiv = document.getElementById("hidden-actions");

        if (hiddenButtonsDiv) {
            if (charactersSelected.length > 0)
                hiddenButtonsDiv.style.display = 'flex';
            else
                hiddenButtonsDiv.style.display = 'none';
        }
    }

    useEffect(() => {
        if (isOpen) {
            toggleHiddenButtons();
        }
    }, [charactersSelected, isOpen]);

    if (!isOpen) return null;

    const charactersList = characters || [];

    const handleSubmit = async (e) => {
        e.preventDefault();

        handleClose();
    };

    const handleClose = () => {
        setCharactersSelected([]);
        onClose();
    };

    const checkAll = () => {
        const checkboxes = document.querySelectorAll('.selectable-list-item .select-checkbox');

        const characterCheckboxes = Array.from(checkboxes).slice(1);
        const allChecked = characterCheckboxes.every(checkbox => checkbox.checked);

        if (allChecked) {
            characterCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            setCharactersSelected([]);
        } else {
            characterCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
            const allIds = characterCheckboxes.map(checkbox => checkbox.id);
            setCharactersSelected(allIds);
        }

        updateHeaderCheckbox();
    }

    const selectItem = (isChecked, itemId) => {
        if (isChecked && !charactersSelected.includes(itemId)) {
            const newSelected = [...charactersSelected, itemId];
            setCharactersSelected(newSelected);
        } else {
            const newSelected = charactersSelected.filter(id => id !== itemId);
            setCharactersSelected(newSelected);
        }
    }

    const handleIndividualCheckboxChange = (e) => {
        updateHeaderCheckbox();
        selectItem(e.target.checked, e.target.id);
    }

    const updateHeaderCheckbox = () => {
        const checkboxes = document.querySelectorAll('.selectable-list-item .select-checkbox');
        const headerCheckbox = checkboxes[0];
        const characterCheckboxes = Array.from(checkboxes).slice(1);

        const allChecked = characterCheckboxes.every(checkbox => checkbox.checked);
        headerCheckbox.checked = allChecked;
    }

    const handleBatchDelete = async () => {
        if (!charactersSelected || charactersSelected.length === 0) {
            showAlert('error', 'Selecione pelo menos um personagem para deletar.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/characters/batch', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: charactersSelected })
            });

            if (response.ok) {
                const updatedCharacters = charactersList.filter(character => !charactersSelected.includes(character.id));
                onUpdateCharacters(updatedCharacters);
                showAlert('success', 'Personagens deletados!');
            } else {
                console.error('Error deleting characters:', response.statusText);
                showAlert('error', 'Ocorreu um erro ao deletar os personagens.');
            }
        } catch (error) {
            console.error('Network error saving settings:', error);
            showAlert('error', t('validation.save_error'));
        }

        handleClose();
    }

    const handleOpenConfirmationModal = () => {
        setIsConfirmationModalOpen(true);
    };

    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2 className="title">Gerenciar personagens</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-row">
                            <div className="modal-full-width">
                                <div className='selectable-list' style={{ height: 'auto', maxHeight: '200px' }}>
                                    <div className="selectable-list-item" style={{ fontWeight: 'bold', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input className="select-checkbox" type="checkbox" value="false" onChange={checkAll} />
                                            <p>{t('characters.name')}</p>
                                        </div>
                                        <p>Criado em</p>
                                    </div>
                                    {charactersList.map((character, index) => (
                                        <div key={index} className="selectable-list-item">
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input id={character.id} className="select-checkbox" type="checkbox" value="false" onChange={handleIndividualCheckboxChange} />
                                                <img src={character.icon} className="selectable-list-icon" />
                                                <p>{character.name}</p>
                                            </div>
                                            <p>{(() => {
                                                const isoString = character.createdAt;
                                                const [datePart, timePart] = isoString.split('T');
                                                const [year, month, day] = datePart.split('-');
                                                const [time] = timePart.split('.');
                                                const [hour, minute, second] = time.split(':');

                                                const localDate = new Date(year, month - 1, day, hour, minute, second);

                                                return localDate.toLocaleString(locale, {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                });
                                            })()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>
                    <div className="modal-actions">
                        <div id="hidden-actions" style={{ gap: '5px', display: 'none' }}>
                            <button className="button" type="button" onClick={handleSubmit}>
                                Exportar
                            </button>
                            <button className="button" type="button" onClick={handleOpenConfirmationModal}>
                                {t('common.delete')}
                            </button>
                        </div>
                        <button className="button" type="button" onClick={handleClose}>
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={handleCloseConfirmationModal}
                onConfirm={handleBatchDelete}
                text="Tem certeza que deseja deletar esses personagens?"
                confirmButtonText={t('common.delete')}
            />
        </>
    );
}

export default CharacterManagementModal;