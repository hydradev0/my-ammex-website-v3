import { useEffect, useState } from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import PropTypes from 'prop-types';

function PhoneInputField({ id, label, value, onChange, error, required = false, width = 'w-full', disabled = false }) {
  // Initialize with the value prop directly
  const [phone, setPhone] = useState(value || '');

  // Sync with external value changes
  useEffect(() => {
    // Always update phone state when value prop changes
    setPhone(value || '');
  }, [value]);

  const handlePhoneChange = (newPhone, metadata) => {
    setPhone(newPhone);

    // If the phone is empty or just '+', treat it as empty string for validation
    let valueToSend = newPhone;
    if (!newPhone || newPhone === '+' || (newPhone.startsWith('+') && newPhone.length < 4)) {
      valueToSend = '';
    }

    // Create synthetic event to match existing form handling
    const syntheticEvent = {
      target: {
        id: id,
        name: id,
        value: valueToSend
      }
    };

    onChange(syntheticEvent);
  };

  return (
    <div className="m-4">
      <label htmlFor={id} className="block text-lg font-medium text-gray-700 mb-2">
        {label}{required ? ' *' : ''}
      </label>
      <div className={`relative ${error ? 'mb-1' : ''}`}>
        <PhoneInput
          value={phone}
          onChange={handlePhoneChange}
          disabled={disabled}
          inputClassName={`px-4 py-1 ${width} text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          countrySelectorStyleProps={{
            buttonClassName: `border ${error ? 'border-red-500' : 'border-gray-300'} rounded-l-md hover:bg-gray-50 px-2`,
            dropdownStyleProps: {
              className: 'text-lg border border-gray-300 rounded shadow-lg max-h-60 overflow-auto',
              listItemClassName: 'px-4 py-2 hover:bg-blue-100 cursor-pointer text-lg'
            }
          }}
          className={width}
          forceDialCode={true}
          defaultCountry="ph"
        />
      </div>
      {error && (
        <p className="text-red-500 text-md mt-1">{error}</p>
      )}
    </div>
  );
}

PhoneInputField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  width: PropTypes.string,
  disabled: PropTypes.bool
};

export default PhoneInputField;