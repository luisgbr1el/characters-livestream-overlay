import { useState, useEffect, useRef } from 'react';
import '../styles/Modal.css';
import { MdOutlineImage } from "react-icons/md";
import FileSessionManager from '../utils/fileSessionManager.js';

function NewCharacterModal({ isOpen, onClose, onCreate, onUpdate, isEditing = false, characterToEdit = null }) {
    const [name, setName] = useState("");
    const [iconUrl, setIconUrl] = useState("");
    const [healthPoints, setHealthPoints] = useState();
    const [maxHealthPoints, setMaxHealthPoints] = useState();
    const [currentFileName, setCurrentFileName] = useState("");
    
    const fileSessionRef = useRef(new FileSessionManager());

    useEffect(() => {
        if (isEditing && characterToEdit) {
            setName(characterToEdit.name);
            setIconUrl(characterToEdit.icon);
            setHealthPoints(characterToEdit.hp);
            setMaxHealthPoints(characterToEdit.maxHp);
            setCurrentFileName("");
        }
    }, [isEditing, characterToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name || !iconUrl || healthPoints == null || maxHealthPoints == null) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        
        const characterData = { name, icon: iconUrl, hp: healthPoints, maxHp: maxHealthPoints };
        

        if (currentFileName)
            await fileSessionRef.current.confirmFile(currentFileName);
        
        if (isEditing)
            onUpdate({ ...characterData, id: characterToEdit.id });
        else
            onCreate(characterData);
        
        handleClose();
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
                if (currentFileName) {
                    await fileSessionRef.current.deleteFile(currentFileName);
                }
                
                const data = await fileSessionRef.current.uploadFile(file);
                setIconUrl(data.url);
                setCurrentFileName(data.fileName);
            } catch (error) {
                console.error('Erro no upload:', error);
                alert('Erro no upload do arquivo. Tente novamente.');
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="title">{isEditing ? "Editar personagem" : "Novo personagem"}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="modal-column">
                        <label>
                            Nome
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        </label>
                        <div className="modal-row">
                            <label>
                                HP atual
                                <input type="number" value={healthPoints} onChange={(e) => setHealthPoints(parseInt(e.target.value) || 0)} min="0" required />
                            </label>
                            <label>
                                HP máximo
                                <input type="number" value={maxHealthPoints} onChange={(e) => setMaxHealthPoints(parseInt(e.target.value) || 0)} min="0" required />
                            </label>
                        </div>
                    </div>
                    <div className="modal-column">
                        <label>
                            Ícone
                            <div id="icon-preview-container" className={iconUrl ? 'has-image' : ''}>
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                                <MdOutlineImage size={60} />
                                {iconUrl && <img src={iconUrl} alt="Ícone do personagem" />}
                            </div>
                        </label>
                    </div>
                </form>
                <div className="modal-actions" style={{ position: 'relative' }}>
                    {isEditing && (
                        <button className="button delete-button" style={{ position: 'absolute', left: '0', top: '10px' }} type="button" onClick={() => {
                            if (window.confirm("Tem certeza que deseja deletar este personagem?")) {
                                onUpdate({ id: characterToEdit.id, delete: true });
                                handleClose();
                            }
                        }}>
                            Excluir
                        </button>
                    )}
                    <button className="button" type="submit" onClick={handleSubmit}>
                        {isEditing ? "Salvar" : "Criar"}
                    </button>
                    <button className="button" type="button" onClick={handleClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}

export default NewCharacterModal;