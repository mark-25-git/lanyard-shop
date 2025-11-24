interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

export default function CustomCheckbox({ 
  checked, 
  onChange, 
  label,
  id 
}: CustomCheckboxProps) {
  return (
    <label 
      htmlFor={id}
      style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        position: 'relative'
      }}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ 
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0
        }}
      />
      <span style={{
        display: 'inline-block',
        width: '18px',
        height: '18px',
        border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--color-gray-400)'}`,
        borderRadius: '4px',
        backgroundColor: checked ? 'var(--color-primary)' : 'transparent',
        position: 'relative',
        flexShrink: 0,
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}>
        {checked && (
          <i className="bi bi-check" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--color-white)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1
          }}></i>
        )}
      </span>
      {label}
    </label>
  );
}

