import React from 'react';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

/** The icon for a module, by its route. Shared by the card and the tile, so a module looks the same in both. */
export function moduleIcon(path: string): React.ReactElement {
  if (path.includes('consultants')) return <PeopleOutlineIcon sx={{ fontSize: 22 }} />;
  if (path.includes('skills')) return <PsychologyOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('cv-score')) return <AssessmentOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('matches')) return <HubOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('embeddings')) return <HubOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('project-requests')) return <UploadFileOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('chat')) return <ChatOutlinedIcon sx={{ fontSize: 26 }} />;
  if (path.includes('health')) return <HealthAndSafetyOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('stats')) return <BarChartOutlinedIcon sx={{ fontSize: 22 }} />;
  return <SearchOutlinedIcon sx={{ fontSize: 22 }} />;
}
