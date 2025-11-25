import React, { useState } from 'react';
import {AppBar, IconButton, Toolbar, Typography, Menu, MenuItem, Divider, Tooltip, Box} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import HealthCheckIndicator from './HealthCheckIndicator'; // <--- 1. Importer
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
            position="static"
            color="transparent"
            elevation={0}
            sx={{
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                backdropFilter: 'blur(12px)',
                backgroundColor: (theme) => theme.palette.mode === 'light'
                    ? 'rgba(255,255,255,0.9)'
                    : 'rgba(11,11,12,0.9)',
            }}
        >
            <Toolbar sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
                    <Box
                        component="img"
                        src={CloudberriesLogo}
                        alt="Cloudberries logo"
                        sx={{ height: 40, width: 'auto', mr: 2, display: 'block' }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ fontWeight: 700, letterSpacing: 0.2, lineHeight: 1 }}
                        >
                            Cloudberries
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ fontWeight: 300, color: 'text.secondary' }}
                        >
                            Intelligent Skill Search &amp; Matching Platform
                        </Typography>
                    </Box>
                </Box>

                <HealthCheckIndicator/>

                <Tooltip title={mode === 'dark' ? 'Bytt til lys modus' : 'Bytt til mørk modus'}>
                    <IconButton color="inherit" aria-label="toggle color mode" onClick={toggle} sx={{ mr: 1 }}>
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Tooltip>

                <IconButton color="inherit" aria-label="profil">
                    <PersonOutlineIcon/>
                </IconButton>
                <IconButton
                    color="inherit"
                    aria-label="meny"
                    aria-controls={open ? 'main-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleMenuOpen}
                >
                    <MenuIcon/>
                </IconButton>
                <Menu
                    id="main-menu"
                    anchorEl={menuAnchor}
                    open={open}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem component={RouterLink} to="/" onClick={handleMenuClose}>Forside</MenuItem>
                    <Divider />
                    <MenuItem component={RouterLink} to="/consultants" onClick={handleMenuClose}>Konsulenter</MenuItem>
                    <MenuItem component={RouterLink} to="/cv-score" onClick={handleMenuClose}>CV-Score</MenuItem>
                    <MenuItem component={RouterLink} to="/matches" onClick={handleMenuClose}>Matcher</MenuItem>
                    <MenuItem component={RouterLink} to="/embeddings" onClick={handleMenuClose}>Embeddings</MenuItem>
                    <MenuItem component={RouterLink} to="/chat" onClick={handleMenuClose}>Chat Analyze</MenuItem>
                    <MenuItem component={RouterLink} to="/health" onClick={handleMenuClose}>Helse</MenuItem>
                    <MenuItem component={RouterLink} to="/stats" onClick={handleMenuClose}>Statistikk</MenuItem>
                    <MenuItem component={RouterLink} to="/search" onClick={handleMenuClose}>Søk</MenuItem>
                    <MenuItem component={RouterLink} to="/search/semantic" onClick={handleMenuClose}>Semantisk Søk</MenuItem>
                    <Divider />
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
