// src/components/HealthCheckIndicator.tsx

import React, {useEffect, useState} from 'react';
import {Box, CircularProgress, Tooltip, Typography} from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { getHealthStatus, type HealthDetails } from '../services/healthService.ts';
import type { HealthResponse } from '../types/api';

/**
 * Renders the formatted details inside the Tooltip.
 * This component's single responsibility is to display the status list.
 */
const HealthDetailsTooltip: React.FC<{ details: HealthDetails | null }> = ({details}) => {
    if (!details) {
        return <Typography variant="caption">Laster status...</Typography>;
    }

    return (
        <Box sx={{p: 1}}>
            <Typography variant="body2" sx={{fontWeight: 'bold', mb: 1}}>
                Systemstatus
            </Typography>
            {Object.entries(details).map(([service, raw]) => {
                // Normalize truthy values: accept 'UP' (any case) and true as UP
                const normalized = typeof raw === 'string' ? raw.toUpperCase() : raw;
                const isUp = normalized === true || normalized === 'UP';
                const statusText = isUp ? 'UP' : 'DOWN';
                const statusColor = isUp ? 'success.main' : 'error.main';

                return (
                    <Box key={service} sx={{display: 'flex', alignItems: 'center', mb: 0.5}}>
                        <Tooltip title={isUp ? 'System is operational' : 'System is down'} arrow>
                            <CircleIcon
                                sx={{
                                    color: statusColor,
                                    fontSize: '12px',
                                    mr: 1
                                }}
                            />
                        </Tooltip>
                        <Typography variant="caption" sx={{textTransform: 'capitalize'}}>
                            {service.replace(/_/g, ' ')}: {statusText}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
};

// Configuration constants for styling and behavior
const HEALTH_CHECK_CONFIG = {
    // Poll health once every 60 minutes (backend caches for 60 min)
    INTERVAL_MS: 3600000, // 60 minutes
    ICON_SIZE: '26px',
    SPINNER_SIZE: 16,
    MARGIN_RIGHT: 2
} as const;

// Custom hook for fetching and managing health status
const useHealthStatus = () => {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const statusResult = await getHealthStatus();
                setHealth(statusResult);
            } catch (error) {
                console.error("Health check failed:", error);
                // Set a default error state if the API call fails
                setHealth({
                    status: 'DOWN', details: {
                        database: "DOWN",
                        flowcase: "DOWN",
                        genAI_operational: "DOWN",
                        genAI_configured: "DOWN"
                    }
                });
            } finally {
                setIsLoading(false);
            }
        };

        checkHealth();
        const intervalId = setInterval(checkHealth, HEALTH_CHECK_CONFIG.INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, []);

    return {health, isLoading};
};

/**
 * Displays an overall health status indicator.
 * On hover, it shows a detailed tooltip with the status of each dependency.
 */
const HealthCheckIndicator: React.FC = () => {
    const {health, isLoading} = useHealthStatus();

    if (isLoading) {
        return (
            <CircularProgress
                size={HEALTH_CHECK_CONFIG.SPINNER_SIZE}
                sx={{mr: HEALTH_CHECK_CONFIG.MARGIN_RIGHT}}
            />
        );
    }

    const overallStatus = health?.status ?? 'DOWN';
    const indicatorColor = overallStatus === 'UP' ? 'success.main' : 'error.main';

    return (
        <Tooltip
            title={<HealthDetailsTooltip details={health?.details ?? null}/>}
            arrow
        >
            <CircleIcon
                sx={{
                    color: indicatorColor,
                    fontSize: HEALTH_CHECK_CONFIG.ICON_SIZE,
                    mr: HEALTH_CHECK_CONFIG.MARGIN_RIGHT,
                    cursor: 'pointer'
                }}
            />
        </Tooltip>
    );
};

export default HealthCheckIndicator;