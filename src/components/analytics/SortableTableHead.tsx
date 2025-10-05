import {
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  Tooltip,
} from '@mui/material';
import type { Order } from '../../types/analytics';

export interface Column<T> {
  id: keyof T;
  label: string;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
  hideOnMobile?: boolean;
}

interface SortableTableHeadProps<T> {
  columns: Column<T>[];
  order: Order;
  orderBy: keyof T;
  onRequestSort: (property: keyof T) => void;
  dense?: boolean;
}

export default function SortableTableHead<T>({
  columns,
  order,
  orderBy,
  onRequestSort,
  dense = false,
}: SortableTableHeadProps<T>) {
  const createSortHandler = (property: keyof T) => () => {
    onRequestSort(property);
  };

  return (
    <TableHead sx={{ backgroundColor: 'grey.100' }}>
      <TableRow>
        {columns.map((column, idx) => (
          <TableCell
            key={`${String(column.id)}-${idx}`}
            align={column.align || 'left'}
            padding={dense ? 'none' : 'normal'}
            sortDirection={orderBy === column.id ? order : false}
            sx={{
              fontWeight: 600,
              minWidth: column.minWidth,
              display: column.hideOnMobile 
                ? { xs: 'none', sm: 'table-cell' }
                : 'table-cell',
            }}
          >
            <Tooltip 
              title={`Sorter ${order === 'asc' ? 'stigende' : 'synkende'} etter ${column.label.toLowerCase()}`}
              placement="top"
            >
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id)}
                aria-label={`Sorter etter ${column.label}`}
              >
                {column.label}
              </TableSortLabel>
            </Tooltip>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}