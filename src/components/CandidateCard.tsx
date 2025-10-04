import React from 'react';
import {Avatar, Box, Button, Card, CardContent, Typography, Chip} from '@mui/material';
import CvScoreBadge from './CvScoreBadge';
import { useNavigate } from 'react-router-dom';
import type { ConsultantWithCvDto } from '../types/api';

interface CandidateCardProps {
    consultant: ConsultantWithCvDto;
    matchPercentage?: number; // Optional for backwards compatibility
}

const CandidateCard: React.FC<CandidateCardProps> = ({ consultant, matchPercentage }) => {
    const navigate = useNavigate();
    
    const handleViewDetails = () => {
        navigate(`/consultants/${consultant.userId}`);
    };

    const handleViewCV = () => {
        navigate(`/cv/${consultant.userId}`);
    };

    // Get the active CV for quality score display
    const activeCv = consultant.cvs?.find(cv => cv.active);
    const qualityScore = activeCv?.qualityScore || 0;
    
    return (
        <Card sx={{display: 'flex', mb: 2, alignItems: 'center', p: 1, borderRadius: 4}}>
            <CardContent sx={{flex: '1 1 auto', display: 'flex', alignItems: 'center', p: '16px !important'}}>
                <Avatar sx={{width: 56, height: 56, mr: 2}}>
                    {consultant.name.charAt(0)}
                </Avatar>

                <Box sx={{flexGrow: 1}}>
                    <Typography variant="h6">{consultant.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Bruker-ID: {consultant.userId}
                    </Typography>
                    {/* Display key skills */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {consultant.skills.slice(0, 3).map((skill, index) => (
                            <Chip
                                key={index}
                                label={skill}
                                size="small"
                                variant="outlined"
                                color="primary"
                            />
                        ))}
                        {consultant.skills.length > 3 && (
                            <Chip 
                                label={`+${consultant.skills.length - 3}`} 
                                size="small" 
                                variant="outlined"
                            />
                        )}
                    </Box>
                </Box>

                <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                        variant="contained" 
                        size="small"
                        onClick={handleViewDetails}
                        color="success"
                        sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        Se detaljer
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small"
                        onClick={handleViewCV}
                        sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        Se hele CV
                    </Button>
                </Box>
            </CardContent>

{/* Quality score or match percentage indicator */}
            <Box sx={{ mr: 3 }}>
                <CvScoreBadge
                    score={(matchPercentage ?? qualityScore) as number}
                    sizePx={60}
                    subLabel={matchPercentage ? 'Match' : 'Kvalitet'}
                    ariaLabel={matchPercentage ? `Match score ${(matchPercentage ?? 0)} av 100` : `CV score ${(qualityScore ?? 0)} av 100`}
                />
            </Box>
        </Card>
    );
};

export default CandidateCard;