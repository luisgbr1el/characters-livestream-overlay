import { useState, useEffect } from 'react'
import '../styles/Alert.css'

function Alert({ type, text, duration = 3, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (text) {
            setIsVisible(true);
            setIsClosing(false);
            
            const timer = setTimeout(() => {
                handleClose();
            }, duration * 1000);

            return () => clearTimeout(timer);
        }
    }, [text, duration]);

    const handleClose = () => {
        setIsClosing(true);
        
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            if (onClose) {
                onClose();
            }
        }, 250);
    };

    const validTypes = ['success', 'warning', 'error'];
    if (!validTypes.includes(type)) {
        console.error("Invalid type of alert component. Valid types are: success, warning, error");
        return null;
    }

    if (!text) {
        return null;
    }

    if (!isVisible && !isClosing) {
        return null;
    }

    return (
        <div className={`alert ${type} ${isClosing ? 'fade-out' : 'fade-in'}`}>
            <p className="alert-text">
                {text}
            </p>
        </div>
    )
}

export default Alert;