import { useState, useEffect, useRef } from 'react';
import '../styles/Modal.css';
import { MdOutlineImage } from "react-icons/md";
import FileSessionManager from '../utils/fileSessionManager.js';

function SettingsModal({ isOpen, onClose, onUpdate }) {
    const [activeTab, setActiveTab] = useState("general");
    const [language, setLanguage] = useState("pt-BR");
    const [showIcon, setShowIcon] = useState(true);
    const [showCharacterIcon, setShowCharacterIcon] = useState(true);
    const [showHealth, setShowHealth] = useState(true);
    const [showName, setShowName] = useState(true);
    const [fontSize, setFontSize] = useState(14);
    const [fontColor, setFontColor] = useState("#FFFFFF");
    const [iconsSize, setIconsSize] = useState(64);
    const [characterIconSize, setCharacterIconSize] = useState(170);
    const [healthIconFilePath, setHealthIconFilePath] = useState(null);
    const [fontFamily, setFontFamily] = useState(null);
    const [currentHealthIconFileName, setCurrentHealthIconFileName] = useState("");

    const fileSessionRef = useRef(new FileSessionManager());

    useEffect(() => {
        if (isOpen) {
            setActiveTab("general");
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/settings');
            if (response.ok) {
                const settings = await response.json();
                setLanguage(settings.general.language);
                setShowIcon(settings.overlay.show_icon);
                setShowCharacterIcon(settings.overlay.show_character_icon);
                setShowHealth(settings.overlay.show_health);
                setShowName(settings.overlay.show_name);
                setFontSize(settings.overlay.font_size);
                setFontFamily(settings.overlay.font_family);
                setFontColor(settings.overlay.font_color);
                setIconsSize(settings.overlay.icons_size);
                setCharacterIconSize(settings.overlay.character_icon_size || 170);
                setHealthIconFilePath(settings.overlay.health_icon_file_path);
                setCurrentHealthIconFileName("");
            } else
                console.error('Erro ao buscar configurações:', response.statusText);
        } catch (error) {
            console.error('Erro de rede ao buscar configurações:', error);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (currentHealthIconFileName) {
            await fileSessionRef.current.confirmFile(currentHealthIconFileName);
        }

        const settingsData = {
            general: {
                language
            },
            overlay: {
                show_icon: showIcon,
                show_character_icon: showCharacterIcon,
                show_health: showHealth,
                show_name: showName,
                font_size: fontSize,
                font_family: fontFamily,
                font_color: fontColor,
                icons_size: iconsSize,
                character_icon_size: characterIconSize,
                health_icon_file_path: healthIconFilePath
            }
        };

        try {
            const response = await fetch('http://localhost:3000/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settingsData)
            });

            if (response.ok) {
                onUpdate(settingsData);
                handleClose();
            } else {
                console.error('Erro ao salvar configurações:', response.statusText);
                alert('Erro ao salvar configurações. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro de rede ao salvar configurações:', error);
            alert('Erro de conexão. Verifique se o servidor está rodando.');
        }
    };

    const handleClose = async () => {
        if (currentHealthIconFileName)
            await fileSessionRef.current.cleanupSession();

        fileSessionRef.current.resetSession();
        setCurrentHealthIconFileName("");

        onClose();
    };

    const handleHealthIconUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                if (currentHealthIconFileName)
                    await fileSessionRef.current.deleteFile(currentHealthIconFileName);

                const data = await fileSessionRef.current.uploadFile(file);
                setHealthIconFilePath(data.url);
                setCurrentHealthIconFileName(data.fileName);
            } catch (error) {
                console.error('Erro no upload do ícone de vida:', error);
                alert('Erro no upload do arquivo. Tente novamente.');
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px' }}>
                <h2 className="title">Configurações</h2>
                <div className="sidebar-modal">
                    <div className='modal-navbar'>
                        <ul>
                            <li className={`navbar-button ${activeTab === "general" ? "active" : ""}`} onClick={() => setActiveTab("general")}>
                                Geral
                            </li>
                            <li className={`navbar-button ${activeTab === "overlay" ? "active" : ""}`} onClick={() => setActiveTab("overlay")}>
                                Overlay
                            </li>
                            <li className={`navbar-button ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>
                                Sobre
                            </li>
                        </ul>
                    </div>
                    <div className='modal-general-column'>
                        <form onSubmit={handleSubmit}>
                            {activeTab === "general" && (
                                <div className="modal-column modal-full-width">
                                    <h4 className='title'>Aplicativo</h4>
                                    <label>
                                        <p className='button-text'>Idioma</p>
                                        <select value={language} onChange={(e) => setLanguage(e.target.value)} required>
                                            <option value="pt-BR">Português (Brasil)</option>
                                            <option value="en-US">English (US)</option>
                                        </select>
                                    </label>
                                </div>
                            )}

                            {activeTab === "overlay" && (
                                <div className="modal-column modal-full-width">
                                    <h4 className='title'>Componentes</h4>
                                    <div className="modal-row">
                                        <label className='inline-label'>
                                            <p className='button-text'>Mostrar nome</p>
                                            <input
                                                type="checkbox"
                                                checked={showName}
                                                onChange={(e) => setShowName(e.target.checked)}
                                            />
                                        </label>
                                    </div>
                                    <div className="modal-row">
                                        <label className='inline-label'>
                                            <p className='button-text'>Mostrar HP</p>
                                            <input
                                                type="checkbox"
                                                checked={showHealth}
                                                onChange={(e) => setShowHealth(e.target.checked)}
                                            />
                                        </label>
                                    </div>
                                    <div className="modal-row">
                                        <label className='inline-label'>
                                            <p className='button-text'>Mostrar ícone de HP</p>
                                            <input
                                                type="checkbox"
                                                checked={showIcon}
                                                onChange={(e) => setShowIcon(e.target.checked)}
                                            />
                                        </label>
                                    </div>
                                    <div className="modal-row">
                                        <label className='inline-label'>
                                            <p className='button-text'>Mostrar ícone do personagem</p>
                                            <input
                                                type="checkbox"
                                                checked={showCharacterIcon}
                                                onChange={(e) => setShowCharacterIcon(e.target.checked)}
                                            />
                                        </label>
                                    </div>
                                    <h4 className='title'>Texto</h4>
                                    <label>
                                        <p className='button-text'>Fonte</p>
                                        <select value={fontFamily || "Poppins"} onChange={(e) => setFontFamily(e.target.value)} required>
                                            <option style={{ fontFamily: "Arial" }} value="Arial">Arial</option>
                                            <option style={{ fontFamily: "Poppins" }} value="Poppins">Poppins</option>
                                            <option style={{ fontFamily: "Times New Roman" }} value="Times New Roman">Times New Roman</option>
                                            <option style={{ fontFamily: "Courier New" }} value="Courier New">Courier New</option>
                                            <option style={{ fontFamily: "Helvetica" }} value="Helvetica">Helvetica</option>
                                            <option style={{ fontFamily: "Georgia" }} value="Georgia">Georgia</option>
                                            <option style={{ fontFamily: "Verdana" }} value="Verdana">Verdana</option>
                                            <option style={{ fontFamily: "Impact" }} value="Impact">Impact</option>
                                            <option style={{ fontFamily: "Comic Sans MS" }} value="Comic Sans MS">Comic Sans MS</option>
                                            <option style={{ fontFamily: "Trebuchet MS" }} value="Trebuchet MS">Trebuchet MS</option>
                                            <option style={{ fontFamily: "Arial Black" }} value="Arial Black">Arial Black</option>
                                            <option style={{ fontFamily: "Palatino" }} value="Palatino">Palatino</option>
                                        </select>
                                    </label>
                                    <div className="modal-row">
                                        <label>
                                            <p className='button-text'>Tamanho do texto (pt)</p>
                                            <input
                                                type="number"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
                                                min="8"
                                                max="72"
                                                required
                                            />
                                        </label>
                                        <label>
                                            <p className='button-text'>Cor do texto</p>
                                            <input
                                                type="color"
                                                value={fontColor}
                                                onChange={(e) => setFontColor(e.target.value)}
                                                required
                                            />
                                        </label>
                                    </div>

                                    <h4 className='title'>Ícones</h4>
                                    <div className="modal-row">
                                        <label>
                                            <p className='button-text'>Tamanho do ícone de HP (px)</p>
                                            <input
                                                type="number"
                                                value={iconsSize}
                                                onChange={(e) => setIconsSize(parseInt(e.target.value) || 64)}
                                                min="16"
                                                max="256"
                                                required
                                            />
                                        </label>
                                        <label>
                                            <p className='button-text'>Tam. do ícone do personagem (px)</p>
                                            <input
                                                type="number"
                                                value={characterIconSize}
                                                onChange={(e) => setCharacterIconSize(parseInt(e.target.value) || 170)}
                                                min="32"
                                                max="512"
                                                required
                                            />
                                        </label>
                                    </div>
                                    <div className="modal-row">
                                        <label>
                                            <p className='button-text'>Ícone de HP</p>
                                            <div id="icon-preview-container" style={{ width: '50px', height: '50px' }} className={healthIconFilePath ? 'has-image' : ''}>
                                                <input type="file" accept="image/*" onChange={handleHealthIconUpload} />
                                                <MdOutlineImage size={60} />
                                                {healthIconFilePath && <img src={healthIconFilePath} alt="Ícone de vida" />}
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === "about" && (
                                <div className="modal-column modal-full-width">
                                    <h4 className='title'>v0.0.1</h4>
                                    <a href="https://github.com/webbcenter/" target="_blank" rel="noopener noreferrer">GitHub</a>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="button" type="submit" onClick={handleSubmit}>
                        Salvar
                    </button>
                    <button className="button" type="button" onClick={handleClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div >
    );
}

export default SettingsModal;