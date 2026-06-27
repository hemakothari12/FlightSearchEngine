import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function SearchDatePicker({ value, onChange }) {
  return (
    <DatePicker
      label="Date"
      value={value}
      onChange={onChange}
      slotProps={{
        textField: {
          required: true,
          sx: { width: 180 },
          helperText: ' ',
        },
      }}
    />
  );
}

export default SearchDatePicker;
