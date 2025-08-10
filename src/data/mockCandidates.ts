// Defines the structure for a single candidate object.
export interface Candidate {
    id: number;
    name: string;
    leader: string;
    matchPercentage: number;
    avatarUrl?: string; // Optional image for the avatar
}

// An array of candidate data that our app will display.
export const mockCandidates: Candidate[] = [
    {id: 1, name: 'Maja Olsen', leader: 'Ola Nordmann', matchPercentage: 92},
    {id: 2, name: 'Per Hansen', leader: 'Ola Nordmann', matchPercentage: 88},
    {id: 3, name: 'Per Hansen', leader: 'Kari Sørfjord', matchPercentage: 84},
    {id: 4, name: 'Rørkere', leader: 'Kari Sørfjord', matchPercentage: 78},
    {id: 5, name: 'Søren Korg', leader: 'Per Johann', matchPercentage: 65},
];