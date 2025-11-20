import { useState, useEffect, useRef } from 'react';
import '../styles/Modal.css';
import { MdOutlineImage } from "react-icons/md";
import { TbUserHexagon } from "react-icons/tb";
import FileSessionManager from '../utils/fileSessionManager.js';
import { useI18n } from '../i18n/i18nContext';
import { useAlert } from '../hooks/useAlert';
import ConfirmationModal from './ConfirmationModal.jsx';

function NewCharacterModal({ isOpen, onClose, onCreate, onUpdate, isEditing = false, characterToEdit = null }) {
    const { t } = useI18n();
    const [name, setName] = useState("");
    const [iconUrl, setIconUrl] = useState("");
    const [healthPoints, setHealthPoints] = useState();
    const [maxHealthPoints, setMaxHealthPoints] = useState();
    const [currentFileName, setCurrentFileName] = useState("");
    const { showAlert } = useAlert();
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [iconExists, setIconExists] = useState(false);

    const fileSessionRef = useRef(new FileSessionManager());

    const checkIfIconExists = async (iconPath) => {
        if (!iconPath) {
            setIconExists(false);
            return;
        }

        try {
            const response = await fetch(iconPath, { method: 'HEAD' });
            setIconExists(response.ok);
        } catch (error) {
            console.error('Error checking icon existence:', error);
            setIconExists(false);
        }
    };

    const handleConfirmation = () => {
        onUpdate({ id: characterToEdit.id, delete: true });
        handleClose();
    }

    useEffect(() => {
        if (isEditing && characterToEdit) {
            setName(characterToEdit.name);
            setIconUrl(characterToEdit.icon);
            setHealthPoints(characterToEdit.hp);
            setMaxHealthPoints(characterToEdit.maxHp);
            setCurrentFileName("");
            checkIfIconExists(characterToEdit.icon);
        } else
            setIconExists(false);
    }, [isEditing, characterToEdit]);

    if (!isOpen) return null;

    const areObjectsEqual = (obj1, obj2) => {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length)
            return false;

        for (let key of keys1) {
            if (obj1[key] !== obj2[key])
                return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !iconUrl || healthPoints == null || maxHealthPoints == null) {
            showAlert('warning', t('validation.fill_all_fields'));
            return;
        }

        const characterData = { name, icon: iconUrl, hp: healthPoints, maxHp: maxHealthPoints };

        if (currentFileName)
            await fileSessionRef.current.confirmFile(currentFileName);

        if (isEditing) {
            const { id, ...oldCharacterInfos } = characterToEdit;
            if (areObjectsEqual(oldCharacterInfos, characterData))
                showAlert('error', t('characters.no_changes'));
            else {
                onUpdate({ ...characterData, id: characterToEdit.id });
                handleClose();
            }
        }
        else {
            onCreate(characterData);
            handleClose();
        }
    };

    const handleClose = async () => {
        if (currentFileName)
            await fileSessionRef.current.cleanupSession();

        setName("");
        setIconUrl("");
        setHealthPoints();
        setMaxHealthPoints();
        setCurrentFileName("");

        fileSessionRef.current.resetSession();

        onClose();
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                if (currentFileName)
                    await fileSessionRef.current.deleteFile(currentFileName);

                const data = await fileSessionRef.current.uploadFile(file);
                setIconUrl(data.url);
                setCurrentFileName(data.fileName);
                setIconExists(true);
            } catch (error) {
                console.error('Upload error:', error);
                showAlert('error', t('validation.upload_error'));
            }
        }
    };

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
                    <h2 className="title">{isEditing ? t('characters.edit_character') : t('characters.new_character')}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-column">
                            <label>
                                {t('characters.name')}
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                            </label>
                            <div className="modal-row">
                                <label>
                                    {t('characters.current_hp')}
                                    <input type="number" value={healthPoints} onChange={(e) => setHealthPoints(parseInt(e.target.value) || 0)} min="0" required />
                                </label>
                                <label>
                                    {t('characters.max_hp')}
                                    <input type="number" value={maxHealthPoints} onChange={(e) => setMaxHealthPoints(parseInt(e.target.value) || 0)} min="0" required />
                                </label>
                            </div>
                        </div>
                        <div className="modal-column">
                            <label>
                                {t('characters.icon')}
                                <div id="icon-preview-container" className={iconUrl && iconExists ? 'has-image' : ''}>
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                                    {iconUrl && iconExists ? (
                                        <img src={iconUrl} alt="Ícone do personagem" />
                                    ) : iconUrl && !iconExists ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', backgroundColor: 'var(--background-secondary)', borderRadius: '4px' }}>
                                            <TbUserHexagon size={40} />
                                        </div>
                                    ) : (
                                        <MdOutlineImage size={60} />
                                    )}
                                </div>
                            </label>
                        </div>
                    </form>
                    <div className="modal-actions" style={{ position: 'relative' }}>
                        {isEditing && (
                            <button className="button delete-button" style={{ position: 'absolute', left: '0', top: '10px' }} type="button" onClick={handleOpenConfirmationModal}>
                                {t('common.delete')}
                            </button>
                        )}
                        <button className="button" type="submit" onClick={handleSubmit}>
                            {isEditing ? t('common.save') : t('common.create')}
                        </button>
                        <button className="button" type="button" onClick={handleClose}>
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={handleCloseConfirmationModal}
                onConfirm={handleConfirmation}
                text={t('characters.delete_confirm')}
                confirmButtonText={t('common.delete')}
            />
        </>
    );
}

export default NewCharacterModal;