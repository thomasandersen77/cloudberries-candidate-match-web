import React from 'react';
import {AppBar, Avatar, IconButton, Toolbar, Typography} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import HealthCheckIndicator from './HealthCheckIndicator'; // <--- 1. Importer

const Header: React.FC = () => {
    return (
        <AppBar position="static" color="transparent" elevation={0} sx={{borderBottom: '1px solid #e0e0e0'}}>
            <Toolbar>
                <Avatar sx={{bgcolor: '#c17005', mr: 2}}>TA</Avatar>
                <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                    Cloudberries<br/>
                    <span style={{fontWeight: '300'}}>Intelligent Skill Search and Matching Platform</span>
                </Typography>

                <HealthCheckIndicator/> {/* <--- 2. Legg til komponenten her */}

                <IconButton color="inherit">
                    <PersonOutlineIcon/>
                </IconButton>
                <IconButton color="inherit">
                    <MenuIcon/>
                </IconButton>
            </Toolbar>
        </AppBar>
    );
};

export default Header;