import { useState } from 'react';
import Alert from '../components/Alert';

export const useAlert = () => {
    const [alert, setAlert] = useState({ show: false, type: '', text: '' });

    const showAlert = (type, text) => {
        setAlert({ show: true, type, text });
    };

    const hideAlert = () => {
        setAlert({ show: false, type: '', text: '' });
    };

    const AlertComponent = () => (
        alert.show ? (
            <>
                <Alert
                    type={alert.type}
                    text={alert.text}
                    duration={3}
                    onClose={hideAlert}
                />
            </>
        ) : null
    );

    return {
        alert,
        showAlert,
        hideAlert,
        AlertComponent
    };
};