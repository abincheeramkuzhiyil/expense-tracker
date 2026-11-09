'use client';

import { Chip, Stack } from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';

export interface TagPillsProps {
  tags: string[];
  /** When provided, each pill shows a remove (✕) button. */
  onDelete?: (tag: string) => void;
  /** Called when a pill body is tapped. Makes the pills clickable. */
  onClick?: (tag: string) => void;
}

/** Wrapping row of small outlined pills, one per tag. Read-only unless `onDelete` is given. */
export default function TagPills({ tags, onDelete, onClick }: TagPillsProps) {
  if (tags.length === 0) return null;

  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }} data-testid="tag-pills">
      {tags.map((tag) => (
        <Chip
          key={tag}
          size="small"
          variant="outlined"
          color="primary"
          icon={<LocalOfferOutlinedIcon />}
          label={tag}
          onDelete={onDelete ? () => onDelete(tag) : undefined}
          onClick={onClick ? () => onClick(tag) : undefined}
          data-testid="tag-pill"
        />
      ))}
    </Stack>
  );
}
