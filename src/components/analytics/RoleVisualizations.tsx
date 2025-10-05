import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Grid,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import type { RoleStat, RoleVisualizationMode } from '../../types/analytics';
import { formatPercent } from '../../utils/format';

interface RoleVisualizationsProps {
  roles: RoleStat[];
  mode: RoleVisualizationMode;
}

export default function RoleVisualizations({ roles, mode }: RoleVisualizationsProps) {
  const theme = useTheme();

  const getColorByRank = (index: number) => {
    switch (index) {
      case 0: return theme.palette.primary.main;
      case 1: return theme.palette.secondary.main;
      case 2: return theme.palette.success.main;
      default: return theme.palette.grey[600];
    }
  };

  const getChipSize = (percentage: number) => {
    if (percentage >= 30) return 'medium' as const;
    if (percentage >= 15) return 'small' as const;
    return 'small' as const;
  };

  if (mode === 'bars') {
    return (
      <Box sx={{ mt: 2 }}>
        {roles.map((role, index) => {
          const color = getColorByRank(index);
          return (
            <Box
              key={role.role}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 1,
                backgroundColor: alpha(color, 0.05),
                border: `1px solid ${alpha(color, 0.1)}`,
              }}
            >
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {role.role}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPercent(role.percentage)}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  backgroundColor: alpha(color, 0.1),
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${Math.min(100, role.percentage)}%`,
                    backgroundColor: color,
                    borderRadius: 1,
                    transition: 'width 0.3s ease-in-out',
                  }}
                  aria-label={`${role.role}: ${formatPercent(role.percentage)} av konsulenter`}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {role.consultantCount} {role.consultantCount === 1 ? 'konsulent' : 'konsulenter'}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  }

  if (mode === 'circles') {
    const topRoles = roles.slice(0, 6);
    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {topRoles.map((role, index) => {
          const color = getColorByRank(index);
          return (
            <Grid item xs={6} sm={4} md={3} key={role.role}>
              <Card 
                variant="outlined" 
                sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  minHeight: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={Math.min(100, role.percentage)}
                    size={60}
                    thickness={4}
                    sx={{
                      color: color,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                    aria-label={`${role.role}: ${formatPercent(role.percentage)}`}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={60}
                    thickness={4}
                    sx={{
                      color: alpha(color, 0.1),
                      position: 'absolute',
                      left: 0,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                      {formatPercent(role.percentage, 0)}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {role.role}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {role.consultantCount} {role.consultantCount === 1 ? 'konsulent' : 'konsulenter'}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  }

  if (mode === 'chips') {
    return (
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {roles.map((role, index) => {
          const color = getColorByRank(index);
          const size = getChipSize(role.percentage);
          
          return (
            <Chip
              key={role.role}
              label={`${role.role} (${formatPercent(role.percentage, 0)})`}
              size={size}
              sx={{
                backgroundColor: alpha(color, 0.1),
                color: color,
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: alpha(color, 0.2),
                },
              }}
              aria-label={`${role.role}: ${formatPercent(role.percentage)} av konsulenter`}
            />
          );
        })}
      </Box>
    );
  }

  return null;
}