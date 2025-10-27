import { useEffect, useRef } from 'react';

export function useTooltip(elementId, isEnabled = true) {
    const tooltipRef = useRef(null);

    useEffect(() => {
        if (!isEnabled || !elementId) return;

        const targetElement = document.getElementById(elementId);
        const tooltip = tooltipRef.current;

        if (!targetElement || !tooltip) return;

        const showTooltip = (event) => {
            const rect = targetElement.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            const position = tooltip.classList.contains('tooltip-top') ? 'top' :
                           tooltip.classList.contains('tooltip-bottom') ? 'bottom' :
                           tooltip.classList.contains('tooltip-left') ? 'left' : 'right';

            let left, top;

            switch (position) {
                case 'top':
                    left = rect.left + rect.width / 2;
                    top = rect.top;
                    break;
                case 'bottom':
                    left = rect.left + rect.width / 2;
                    top = rect.bottom;
                    break;
                case 'left':
                    left = rect.left;
                    top = rect.top + rect.height / 2;
                    break;
                case 'right':
                    left = rect.right;
                    top = rect.top + rect.height / 2;
                    break;
                default:
                    left = rect.left + rect.width / 2;
                    top = rect.top;
            }

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
            tooltip.classList.add('show');
        };

        const hideTooltip = () => {
            tooltip.classList.remove('show');
        };

        targetElement.addEventListener('mouseenter', showTooltip);
        targetElement.addEventListener('mouseleave', hideTooltip);

        return () => {
            targetElement.removeEventListener('mouseenter', showTooltip);
            targetElement.removeEventListener('mouseleave', hideTooltip);
        };
    }, [elementId, isEnabled]);

    return tooltipRef;
}