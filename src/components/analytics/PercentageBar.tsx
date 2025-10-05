import { Box, LinearProgress, Typography, useTheme } from '@mui/material';

interface PercentageBarProps {
  value: number; // 0-100
  color?: 'primary' | 'secondary' | 'success';
  showLabel?: boolean;
  small?: boolean;
  'aria-label'?: string;
}

export default function PercentageBar({
  value,
  color = 'secondary',
  showLabel = true,
  small = false,
  'aria-label': ariaLabel,
}: PercentageBarProps) {
  const theme = useTheme();
  
  const height = small ? 4 : 6;
  const fontSize = small ? '0.75rem' : '0.875rem';
  
  const colorMapping = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        minWidth: small ? 80 : 120 
      }}
    >
      <Box sx={{ flexGrow: 1, minWidth: small ? 40 : 60 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, value))}
          sx={{
            height: height,
            borderRadius: height / 2,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              backgroundColor: colorMapping[color],
              borderRadius: height / 2,
            },
          }}
          aria-label={ariaLabel || `${value.toFixed(1)}% progress`}
        />
      </Box>
      {showLabel && (
        <Typography
          variant="body2"
          sx={{
            fontSize: fontSize,
            fontWeight: 500,
            color: 'text.secondary',
            minWidth: 'fit-content',
            whiteSpace: 'nowrap',
          }}
        >
          {value.toFixed(1)}%
        </Typography>
      )}
    </Box>
  );
}