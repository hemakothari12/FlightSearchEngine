import { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const DEFAULT_DATE = dayjs('2024-03-15');

function SearchDatePicker({ value, onChange, submitted }) {
  const [dateError, setDateError] = useState(null);

  const hasError = !!dateError || (submitted && (!value || !value.isValid()));

  return (
    <DatePicker
      label="Date"
      value={value}
      onChange={onChange}
      onError={(error) => setDateError(error)}
      format="YYYY-MM-DD"
      slotProps={{
        textField: {
          error: hasError,
          helperText: hasError ? 'Enter a valid date (YYYY-MM-DD)' : ' ',
          sx: { width: 200 },
          onBlur: () => {
            // Reset to default if the user leaves the field with an invalid date
            if (!value || !value.isValid()) {
              onChange(DEFAULT_DATE);
              setDateError(null);
            }
          },
        },
      }}
    />
  );
}

export default SearchDatePicker;
