import { useEffect } from 'react';
import '../styles/Modal.css';
import { useI18n } from '../i18n/i18nContext';

function ConfirmationModal({ isOpen, onClose, onConfirm, text, confirmButtonText }) {
    const { t } = useI18n();

    useEffect(() => {

    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        onConfirm();
        handleClose();
    };

    const handleClose = async () => {
        onClose();
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        {text}
                    </form>
                    <div className="modal-actions" style={{ position: 'relative' }}>
                        <button className="button" type="submit" onClick={handleSubmit}>
                            {confirmButtonText}
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

export default ConfirmationModal;