import React from 'react';
import { FormControlLabel, Stack, Switch, Typography } from '@mui/material';

// Label and helper text are abstract on purpose: the backend only exposes a
// QUALITY tier, never a concrete model name. Do not put a model name here.
export const HIGH_QUALITY_LABEL = 'Bruk høyeste kvalitet';
export const HIGH_QUALITY_HELPER =
  'Kan gi bedre vurdering, men bruker mer AI-kreditt og kan ta lengre tid.';

export type HighQualityToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
};

const HighQualityToggle: React.FC<HighQualityToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'small',
}) => {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <FormControlLabel
        sx={{ m: 0 }}
        control={
          <Switch
            size={size}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            inputProps={{ 'aria-label': HIGH_QUALITY_LABEL }}
          />
        }
        label={<Typography variant="body2">{HIGH_QUALITY_LABEL}</Typography>}
      />
      <Typography variant="caption" color="text.secondary">
        {HIGH_QUALITY_HELPER}
      </Typography>
    </Stack>
  );
};

export default HighQualityToggle;
