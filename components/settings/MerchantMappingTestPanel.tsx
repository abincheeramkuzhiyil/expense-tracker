import {
  Alert,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { MerchantMatchResult, MerchantRule } from '@/types/expense.types';

export interface MerchantTestPanelProps {
  testText: string;
  onTestTextChange: (text: string) => void;
  result: MerchantMatchResult | null;
  matchedRule: MerchantRule | undefined;
}

export default function MerchantMappingTestPanel({
  testText,
  onTestTextChange,
  result,
  matchedRule,
}: MerchantTestPanelProps) {
  return (
    <>
      <TextField
        label="Sample SMS"
        fullWidth
        multiline
        rows={4}
        value={testText}
        onChange={(e) => onTestTextChange(e.target.value)}
        sx={{ mb: 2 }}
        helperText="Paste a shared SMS to see which rule matches and what it auto-fills."
      />

      <Typography variant="subtitle2" gutterBottom>
        Match result:
      </Typography>

      {result ? (
        <Stack spacing={1}>
          <ResultRow
            label="Matched rule"
            value={matchedRule?.label ?? 'unknown'}
          />
          <ResultRow label="Category" value={result.category} />
          {result.spentOn ? (
            <ResultRow label="Spent On" value={result.spentOn} />
          ) : (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
              <Typography variant="body2" sx={{ minWidth: 100, color: 'text.secondary' }}>
                Spent On:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <em>you choose in the form</em>
              </Typography>
            </Stack>
          )}
        </Stack>
      ) : (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
          <CancelIcon color="error" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            No rule matched — Category and Spent On stay blank.
          </Typography>
        </Stack>
      )}

      {result && matchedRule?.keywords?.length ? (
        <Alert severity="success" icon={false} sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            Matched on one of these keywords:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {matchedRule.keywords.map((k) => (
              <Chip key={k} label={k} size="small" variant="outlined" />
            ))}
          </Stack>
        </Alert>
      ) : null}
    </>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
      <CheckCircleIcon color="success" fontSize="small" />
      <Typography variant="body2" sx={{ minWidth: 100, color: 'text.secondary' }}>
        {label}:
      </Typography>
      <Typography variant="body2">
        <strong>{value}</strong>
      </Typography>
    </Stack>
  );
}
