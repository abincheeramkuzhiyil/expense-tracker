'use client';

import { Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface AddExpenseFabProps {
  onClick: () => void;
}

export default function AddExpenseFab({ onClick }: AddExpenseFabProps) {
  return (
    <Fab
      color="primary"
      aria-label="add"
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
      }}
      onClick={onClick}
    >
      <AddIcon />
    </Fab>
  );
}
