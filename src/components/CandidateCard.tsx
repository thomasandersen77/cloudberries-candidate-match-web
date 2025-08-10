import React from 'react';
import {Avatar, Box, Button, Card, CardContent, CircularProgress, Typography} from '@mui/material';
import type {Candidate} from '../data/mockCandidates'; // Import the data structure
// Import the data structure

// The props define what information this component needs to receive.
interface CandidateCardProps {
    candidate: Candidate;
}

const CandidateCard: React.FC<CandidateCardProps> = ({candidate}) => {
    return (
        <Card sx={{display: 'flex', mb: 2, alignItems: 'center', p: 1, borderRadius: 4}}>
            <CardContent sx={{flex: '1 1 auto', display: 'flex', alignItems: 'center', p: '16px !important'}}>
                <Avatar sx={{width: 56, height: 56, mr: 2}} src={candidate.avatarUrl}>
                    {/* If no avatar image, show the first initial */}
                    {candidate.name.charAt(0)}
                </Avatar>

                <Box sx={{flexGrow: 1}}>
                    <Typography variant="h6">{candidate.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Leder: {candidate.leader}
                    </Typography>
                </Box>

                <Button variant="contained" sx={{
                    mr: 4,
                    backgroundColor: '#f4856f',
                    '&:hover': {backgroundColor: '#f26a52'},
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontWeight: 'bold'
                }}>
                    Se vurdering
                </Button>
            </CardContent>

            {/* This Box handles the circular progress indicator */}
            <Box sx={{position: 'relative', display: 'inline-flex', mr: 3}}>
                <CircularProgress
                    variant="determinate"
                    value={candidate.matchPercentage}
                    size={60}
                    sx={{color: '#f4856f'}}
                />
                <Box
                    sx={{
                        top: 0, left: 0, bottom: 0, right: 0,
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="caption" component="div" color="text.primary" sx={{fontWeight: 'bold'}}>
                        {`${candidate.matchPercentage}%`}
                    </Typography>
                    <Typography variant="body2" sx={{fontSize: '0.6rem', lineHeight: 1}}>
                        Match
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};

export default CandidateCard;