import React, { useState } from 'react';
import { AppBar, IconButton, Toolbar, Typography, Menu, MenuItem, Divider, Tooltip, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import HealthCheckIndicator from './HealthCheckIndicator';
import { useColorMode } from '../theme';
import CloudberriesLogo from '../assets/cloudberries-logo.png';

const Header: React.FC = () => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(menuAnchor);
  const { mode, toggle } = useColorMode();

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(17,17,18,0.92)',
        backdropFilter: 'blur(14px)',
        boxShadow: (theme) =>
          theme.palette.mode === 'light'
            ? '0 1px 0 rgba(17,17,17,0.04), 0 8px 24px rgba(17,17,17,0.04)'
            : '0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <Toolbar
        sx={{
          maxWidth: 1280,
          mx: 'auto',
          width: '100%',
          minHeight: { xs: 56, sm: 64 },
          py: { xs: 0.5, sm: 1 },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
          <Box
            component="img"
            src={CloudberriesLogo}
            alt="Cloudberries logo"
            sx={{ height: { xs: 36, sm: 40 }, width: 'auto', mr: 2, display: 'block', flexShrink: 0 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Cloudberries
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 400, color: 'text.secondary', mt: 0.25, lineHeight: 1.3 }}>
              Intelligent Skill Search &amp; Matching Platform
            </Typography>
          </Box>
        </Box>

        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            pl: 1,
            pr: 0.5,
            py: 0.5,
            borderRadius: 12,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor:
              theme.palette.mode === 'light' ? alpha('#111111', 0.02) : alpha('#fff', 0.04),
          })}
        >
          <HealthCheckIndicator />
          <Tooltip title={mode === 'dark' ? 'Bytt til lys modus' : 'Bytt til mørk modus'}>
            <IconButton color="inherit" aria-label="toggle color mode" onClick={toggle} size="small">
              {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <IconButton color="inherit" aria-label="profil" size="small">
            <PersonOutlineIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="meny"
            aria-controls={open ? 'main-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleMenuOpen}
            size="small"
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        </Box>

        <Menu
          id="main-menu"
          anchorEl={menuAnchor}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: { mt: 1 },
          }}
        >
          <MenuItem component={RouterLink} to="/" onClick={handleMenuClose}>
            Forside
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem component={RouterLink} to="/consultants" onClick={handleMenuClose}>
            Konsulenter
          </MenuItem>
          <MenuItem component={RouterLink} to="/cv-score" onClick={handleMenuClose}>
            CV-Score
          </MenuItem>
          <MenuItem component={RouterLink} to="/matches" onClick={handleMenuClose}>
            Matcher
          </MenuItem>
          <MenuItem component={RouterLink} to="/embeddings" onClick={handleMenuClose}>
            Embeddings
          </MenuItem>
          <MenuItem component={RouterLink} to="/chat" onClick={handleMenuClose}>
            Chat Analyze
          </MenuItem>
          <MenuItem component={RouterLink} to="/health" onClick={handleMenuClose}>
            Helse
          </MenuItem>
          <MenuItem component={RouterLink} to="/stats" onClick={handleMenuClose}>
            Statistikk
          </MenuItem>
          <MenuItem component={RouterLink} to="/search" onClick={handleMenuClose}>
            Søk
          </MenuItem>
          <MenuItem component={RouterLink} to="/search/semantic" onClick={handleMenuClose}>
            Semantisk Søk
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem component={RouterLink} to="/project-requests/upload" onClick={handleMenuClose}>
            Last opp kundeforspørsel (PDF)
          </MenuItem>
          <MenuItem component={RouterLink} to="/project-requests/new" onClick={handleMenuClose}>
            Ny kundeforspørsel
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
