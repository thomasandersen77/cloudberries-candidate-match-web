import React from 'react';
import {Box, Container, Typography} from '@mui/material';
import CandidateCard from '../components/CandidateCard.tsx';
import Header from '../components/Header.tsx';
import {mockCandidates} from '../data/mockCandidates.ts';
import type { ConsultantWithCvDto } from '../types/api';

const CandidateListPage: React.FC = () => {
    return (
        <Box sx={{
            backgroundColor: '#f9fafb',
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <Header/>
            <Container
                maxWidth="lg"
                sx={{
                    mt: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                        fontWeight: 'bold',
                        color: '#333',
                        textAlign: 'center'
                    }}
                >
                    Kandidater til Telenor
                </Typography>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    gap: 2
                }}>
                    {mockCandidates.map((candidate) => (
                        <CandidateCard
                            key={candidate.id}
                            consultant={{ userId: String(candidate.id), name: candidate.name, skills: [], cvs: [] } as unknown as ConsultantWithCvDto}
                            matchPercentage={candidate.matchPercentage}
                        />
                    ))}
                </Box>
            </Container>
        </Box>
    );
};

export default CandidateListPage;