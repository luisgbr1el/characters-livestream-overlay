import { createContext, useContext, useState } from 'react';
import Alert from '../components/Alert';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({ show: false, type: '', text: '' });

    const showAlert = (type, text) => {
        setAlert({ show: true, type, text });
    };

    const hideAlert = () => {
        setAlert({ show: false, type: '', text: '' });
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alert.show && (
                <Alert 
                    type={alert.type}
                    text={alert.text}
                    duration={3}
                    onClose={hideAlert}
                />
            )}
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};