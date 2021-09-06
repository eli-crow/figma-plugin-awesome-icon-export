import React, {ReactChildren, ReactElement} from 'react'

interface Props {
    children?: ReactChildren;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

function Select({value, onChange, className, children}: Props): ReactElement {
    return (
        <label className={`Select ${className}`}>
            <div className="Select-label">Format</div>
            <select 
                className="Select-input" 
                onChange={e => onChange(e.target.value)}
                value={value}
            >
                {children}
            </select>
        </label>
    )
}

export default Select