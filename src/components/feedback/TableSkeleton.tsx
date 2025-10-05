import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Skeleton,
} from '@mui/material';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  dense?: boolean;
}

export default function TableSkeleton({ 
  columns, 
  rows = 5, 
  dense = false 
}: TableSkeletonProps) {
  const columnWidths = Array.from({ length: columns }, (_, index) => {
    // First column wider, last columns narrower for common table patterns
    if (index === 0) return 180;
    if (index === columns - 1) return 80;
    return 120;
  });

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size={dense ? 'small' : 'medium'}>
        <TableHead sx={{ backgroundColor: 'grey.100' }}>
          <TableRow>
            {columnWidths.map((width, index) => (
              <TableCell
                key={index}
                padding={dense ? 'none' : 'normal'}
                sx={{ fontWeight: 600 }}
              >
                <Skeleton variant="text" width={width * 0.7} height={20} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columnWidths.map((width, colIndex) => (
                <TableCell
                  key={colIndex}
                  padding={dense ? 'none' : 'normal'}
                >
                  <Skeleton 
                    variant="text" 
                    width={width * (0.4 + Math.random() * 0.4)} 
                    height={16} 
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}