import React, {useEffect, useState} from 'react';
import {AppBar, Avatar, Box, IconButton, Toolbar, Tooltip, Typography} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import {getHealthStatus, type HealthStatus} from '../services/healthService';

// Initial state before the first health check
const initialHealthStatus: HealthStatus = {
    status: 'DOWN',
    details: {
        database: 'Checking...',
        flowcase: 'Checking...',
        genAI_operational: 'Checking...',
        genAI_configured: 'Checking...',
    },
};

const Header: React.FC = () => {
    const [healthStatus, setHealthStatus] = useState<HealthStatus>(initialHealthStatus);

    useEffect(() => {
        const fetchStatus = async () => {
            const health = await getHealthStatus();
            setHealthStatus(health);
        };

        fetchStatus(); // Initial fetch
        const intervalId = setInterval(fetchStatus, 30000); // Poll every 30 seconds

        return () => clearInterval(intervalId); // Cleanup on component unmount
    }, []);

    const statusColor = healthStatus.status === 'UP' ? 'success.main' : 'error.main';

    // Helper function to format the keys from the backend for better readability
    const formatDetailKey = (key: string) => {
        return key
            .replace(/_/g, ' ')
            .replace(/genAI/g, 'GenAI')
            .replace(/\b\w/g, char => char.toUpperCase());
    };

    // Component to render the detailed status in the tooltip
    const renderHealthDetails = () => (
        <Box sx={{p: 0.5}}>
            <Typography variant="body2" sx={{fontWeight: 'bold', mb: 1}}>
                Overall Status: {healthStatus.status}
            </Typography>
            {Object.entries(healthStatus.details).map(([key, value]) => (
                <Box key={key} sx={{display: 'flex', alignItems: 'center', mb: 0.5}}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            // Show status of each individual component
                            backgroundColor: String(value).toUpperCase() === 'UP' ? 'success.main' : 'error.main',
                            mr: 1,
                        }}
                    />
                    <Typography variant="caption">{`${formatDetailKey(key)}: ${value}`}</Typography>
                </Box>
            ))}
        </Box>
    );

    return (
        <AppBar position="static" color="transparent" elevation={0} sx={{borderBottom: '1px solid #e0e0e0'}}>
            <Toolbar>
                <Avatar sx={{bgcolor: '#8e44ad', mr: 1}}>CB</Avatar>
                <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                    CLOUDBERRIES <span style={{fontWeight: '300'}}>Inter</span>
                </Typography>

                <Tooltip title={renderHealthDetails()} arrow placement="bottom-end">
                    <Box sx={{display: 'flex', alignItems: 'center', mr: 2, cursor: 'pointer'}}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: statusColor,
                                boxShadow: `0 0 5px ${statusColor}`,
                                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                            }}
                        />
                    </Box>
                </Tooltip>

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