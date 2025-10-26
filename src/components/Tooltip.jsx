import '../styles/Tooltip.css';
import { useTooltip } from '../hooks/useTooltip';

function Tooltip({ elementId, text, position = 'top', isEnabled = true }) {
    const tooltipRef = useTooltip(elementId, isEnabled);

    return (
        <div 
            ref={tooltipRef}
            className={`tooltip-container tooltip-${position}`} 
            data-tooltip-for={elementId}
        >
            <span className="tooltip-text">{text}</span>
        </div>
    );
}

export default Tooltip;