import React from 'react';
import { Label, Icon, Popup } from 'semantic-ui-react';

const SpamIndicator = ({ score, reasons }) => {
    if (!score) return null;

    const getColor = (score) => {
        if (score > 0.7) return 'red';
        if (score > 0.3) return 'yellow';
        return 'green';
    };

    const getIcon = (score) => {
        if (score > 0.7) return 'warning';
        if (score > 0.3) return 'question';
        return 'check';
    };

    return (
        <Popup
            trigger={
                <Label color={getColor(score)} horizontal>
                    <Icon name={getIcon(score)} />
                    {Math.round(score * 100)}% Spam
                </Label>
            }
            content={
                <>
                    <strong>Reasons:</strong>
                    <ul style={{ margin: '0.5em 0 0 1em', padding: 0 }}>
                        {reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                        ))}
                    </ul>
                </>
            }
            disabled={!reasons.length}
            position="top center"
        />
    );
};

export default SpamIndicator;
