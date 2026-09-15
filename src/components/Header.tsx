import React, { useState } from 'react';
import { AppBar, IconButton, Toolbar, Typography, Menu, MenuItem, Divider, Tooltip, Box, Button, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import CheckIcon from '@mui/icons-material/Check';
import HealthCheckIndicator from './HealthCheckIndicator';
import { palettes, useColorMode } from '../theme';
import { BRANDING } from '../config/branding';
import { setPageIntrosHidden, usePageIntrosHidden } from './pageIntroPreference';

// The assistant sits second, right after the dashboard: it was not in the top navigation at all,
// so the only way in was a card halfway down the front page.
const topNavItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Assistent', to: '/chat' },
  { label: 'Konsulenter', to: '/consultants' },
  { label: 'CV-Score', to: '/cv-score' },
  { label: 'Matcher', to: '/matches' },
  { label: 'Kundeforspørsel', to: '/project-requests/upload' },
];

const Header: React.FC = () => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(menuAnchor);
  const { mode, toggle, brandTheme, setBrandTheme } = useColorMode();
  const brand = BRANDING[brandTheme] ?? BRANDING.cloudberries;
  const isSopraSteria = brandTheme === 'soprasteria';
  const introsHidden = usePageIntrosHidden();

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
          maxWidth: 1360,
          mx: 'auto',
          width: '100%',
          minHeight: { xs: 62, sm: 70 },
          py: { xs: 0.5, sm: 1 },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
          {brand.logoSrc ? (
            <Box
              component="img"
              src={brand.logoSrc}
              alt={brand.logoAlt}
              sx={{
                height: isSopraSteria ? { xs: 64, sm: 72 } : { xs: 42, sm: 48 },
                width: isSopraSteria ? { xs: 52, sm: 58 } : 'auto',
                objectFit: isSopraSteria ? 'cover' : 'contain',
                objectPosition: 'center',
                borderRadius: isSopraSteria ? 1 : 0,
                bgcolor: isSopraSteria ? '#fff' : 'transparent',
                p: isSopraSteria ? 0.15 : 0,
                mr: 2,
                display: 'block',
                flexShrink: 0,
              }}
            />
          ) : (
            <Box
              sx={(theme) => ({
                mr: 2,
                width: { xs: 34, sm: 38 },
                height: { xs: 34, sm: 38 },
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.16),
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                flexShrink: 0,
              })}
            >
              {brand.displayName.charAt(0)}
            </Box>
          )}
          {/*
            The brand text gives way before the controls do. On a phone "Sopra Steria Candidate
            Match" wrapped onto four lines and pushed the header to a third of the screen, with the
            icons squeezed into a corner of it. Name on one line with an ellipsis, and no tagline
            below sm: it is decoration, and the logo beside it already says whose app this is.
          */}
          {/*
            The wordmark yields to the navigation. Between sm and lg the six links need the room
            more than a second copy of the company name does, and the logo to the left of it is
            still there saying whose app this is. Below sm neither is in the way: the links are
            hidden and the name comes back.
          */}
          <Box sx={{ minWidth: 0, display: { sm: 'none', lg: 'block' } }}>
            <Typography
              variant="h6"
              component="div"
              noWrap
              sx={{ fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              {brand.displayName}
            </Typography>
            <Typography
              variant="body2"
              noWrap
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 400,
                color: 'text.secondary',
                mt: 0.25,
                lineHeight: 1.3,
              }}
            >
              {brand.tagline}
            </Typography>
          </Box>
        </Box>

        {/*
          Shown from sm up, not from lg.

          It used to need 1200px, so halving an ordinary desktop window took the whole row away and
          left the hamburger as the only way anywhere. Between sm and lg the six labels do not
          always fit, and the row scrolls sideways instead of vanishing: a link you have to nudge
          into view beats one that is not there. Below sm there is no room for it at all, and the
          menu covers that.
        */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            minWidth: 0,
            overflowX: 'auto',
            // The row is a navigation aid, not a scroll region to look at.
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            px: 0.5,
            py: 0.5,
            borderRadius: 2.5,
            bgcolor: (theme) => (theme.palette.mode === 'light' ? alpha(theme.palette.primary.main, 0.05) : alpha('#fff', 0.04)),
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          }}
        >
          {topNavItems.map((item) => (
            <Button
              key={item.to}
              component={RouterLink}
              to={item.to}
              color="inherit"
              size="small"
              sx={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                px: { xs: 1, lg: 1.5 },
                py: 0.75,
                borderRadius: 2,
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.2),
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>

        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            // Never squeezed. Flexbox will shrink this cluster to make room for a long brand name
            // otherwise, and the first casualty is whichever control sits at its left edge.
            flexShrink: 0,
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
          {/*
            First in the cluster, left of the health dot, and shown at every width.

            It used to disappear above lg, on the reasoning that the top navigation replaces it, but
            the two hold different things. The bar has the six everyday destinations; the menu is the
            only way to Embeddings, Statistikk, Systemstatus, Søk, Semantisk søk, the brand switch
            and the page-help setting. On a wide screen those were reachable from the dashboard's own
            cards and from nowhere else, so landing on a subpage meant going back to the front page
            first.
          */}
          <Tooltip title="Meny">
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
          </Tooltip>
          <HealthCheckIndicator />
          <Tooltip title={mode === 'dark' ? 'Bytt til lys modus' : 'Bytt til mørk modus'}>
            <IconButton color="inherit" aria-label="toggle color mode" onClick={toggle} size="small">
              {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={`Tema: ${palettes[brandTheme].name}`}>
            <IconButton color="inherit" aria-label="brand palette selector" size="small" onClick={handleMenuOpen}>
              <PaletteOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton color="inherit" aria-label="profil" size="small">
            <PersonOutlineIcon fontSize="small" />
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
            Systemstatus
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
          <MenuItem
            onClick={() => {
              setBrandTheme('cloudberries');
              handleMenuClose();
            }}
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            Cloudberries look
            {brandTheme === 'cloudberries' ? <CheckIcon fontSize="small" /> : null}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setBrandTheme('soprasteria');
              handleMenuClose();
            }}
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            Sopra Steria look
            {brandTheme === 'soprasteria' ? <CheckIcon fontSize="small" /> : null}
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          {/*
            Sits with the looks rather than with the pages, because it changes how the app reads
            and not where you go. It is also the only way back once somebody has pressed "Skjul
            forklaringene" on a page.
          */}
          <MenuItem
            onClick={() => {
              setPageIntrosHidden(!introsHidden);
              handleMenuClose();
            }}
            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
          >
            Vis sideforklaringer
            {introsHidden ? null : <CheckIcon fontSize="small" />}
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
