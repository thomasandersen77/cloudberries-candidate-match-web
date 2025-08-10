import React from 'react';
import {AppBar, Avatar, IconButton, Toolbar, Typography} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';

const Header: React.FC = () => {
    return (
        <AppBar position="static" color="transparent" elevation={0} sx={{borderBottom: '1px solid #e0e0e0'}}>
            <Toolbar>
                <Avatar sx={{bgcolor: '#8e44ad', mr: 1}}>CB</Avatar>
                <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                    CLOUDBERRIES <span style={{fontWeight: '300'}}>Inter</span>
                </Typography>
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