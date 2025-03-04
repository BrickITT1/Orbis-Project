import React from 'react';
import { FieldError, Merge, FieldErrorsImpl, UseFormRegister } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

interface CheckboxFieldProps {
  name: string;
  label: string;
  register: UseFormRegister<any>;
  id: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ name, label, register, error, id }) => {
  const navigate = useNavigate();

  return (
    <div>
      <input
        type="checkbox"
        id={id}
        style={{ display: 'none' }} // Скрываем чекбокс
        {...register(name, { required: 'Это поле обязательно' })}
      />
      <label htmlFor={id}>
        Подтверждаю ознакомление и согласие с <a onClick={() => navigate('/terms')}>Условиями пользования</a> и <a onClick={() => navigate('/privacy')}>Политикой конфиденциальности</a> Orbis
      </label>
      
      {error && (
        <span className='require'>
          {typeof error === 'object' && 'message' in error ? String(error.message) : 'Ошибка'}
        </span>
      )}
    </div>
  );
};

export default CheckboxField;
