import React from 'react';

interface SubmitButtonProps {
  label: string;
  disabled?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ label, disabled }) => (
  <button type="submit" disabled={disabled}>
    {label}
  </button>
);

export default SubmitButton;