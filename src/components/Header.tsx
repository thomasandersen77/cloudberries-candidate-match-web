import React, { useState } from 'react';
import {AppBar, Avatar, IconButton, Toolbar, Typography, Menu, MenuItem, Divider} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import HealthCheckIndicator from './HealthCheckIndicator'; // <--- 1. Importer

const Header: React.FC = () => {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const open = Boolean(menuAnchor);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
    const handleMenuClose = () => setMenuAnchor(null);

    return (
        <AppBar position="static" color="transparent" elevation={0} sx={{borderBottom: '1px solid #e0e0e0'}}>
            <Toolbar>
                <Avatar sx={{bgcolor: '#c17005', mr: 2}}>TA</Avatar>
                <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                    Cloudberries<br/>
                    <span style={{fontWeight: '300'}}>Intelligent Skill Search and Matching Platform</span>
                </Typography>

                <HealthCheckIndicator/>

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
                    <Divider />
                    <MenuItem component={RouterLink} to="/project-requests/upload" onClick={handleMenuClose}>
                        Last opp kundeforspørsel (PDF)
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
