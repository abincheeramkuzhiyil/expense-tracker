import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { ParsedSmsResult, SmsParserRule } from '@/types/expense.types';

export interface TestPanelContentProps {
  rules: SmsParserRule[];
  selectedRuleId: string;
  onRuleChange: (id: string) => void;
  testText: string;
  onTestTextChange: (text: string) => void;
  testResult: ParsedSmsResult | null;
  selectedRule: SmsParserRule | undefined;
  /** Unique id for the Select label — ensures no duplicate aria ids between desktop and mobile. */
  selectLabelId?: string;
}

export default function TestPanelContent({
  rules,
  selectedRuleId,
  onRuleChange,
  testText,
  onTestTextChange,
  testResult,
  selectedRule,
  selectLabelId = 'test-rule-label',
}: TestPanelContentProps) {
  return (
    <>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id={selectLabelId}>Rule</InputLabel>
        <Select
          labelId={selectLabelId}
          label="Rule"
          value={selectedRuleId}
          onChange={(e) => onRuleChange(e.target.value)}
        >
          {rules.map((rule) => (
            <MenuItem key={rule.id} value={rule.id}>
              {rule.bankName}
              {rule.builtIn ? ' (Built-in)' : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Sample SMS"
        fullWidth
        multiline
        rows={4}
        value={testText}
        onChange={(e) => onTestTextChange(e.target.value)}
        sx={{ mb: 2 }}
        helperText="Paste a sample bank SMS to see what the selected rule extracts."
      />

      <Typography variant="subtitle2" gutterBottom>
        Extracted:
      </Typography>
      <ExtractedRow
        label="Amount"
        value={
          testResult?.amount !== undefined
            ? testResult.amount.toFixed(2)
            : null
        }
        keyword={selectedRule?.amountKeyword}
      />
      <ExtractedRow
        label="Merchant"
        value={testResult?.description ?? null}
        keyword={selectedRule?.merchantKeyword}
      />
      <ExtractedRow label="Date" value={testResult?.date ?? null} />
    </>
  );
}

function ExtractedRow({
  label,
  value,
  keyword,
}: {
  label: string;
  value: string | null;
  keyword?: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }} flexWrap="wrap">
      {value ? (
        <CheckCircleIcon color="success" fontSize="small" />
      ) : (
        <CancelIcon color="error" fontSize="small" />
      )}
      <Typography variant="body2" sx={{ minWidth: 80, color: 'text.secondary' }}>
        {label}:
      </Typography>
      <Typography variant="body2">
        {value ?? <span style={{ fontStyle: 'italic', opacity: 0.6 }}>not extracted</span>}
      </Typography>
      {keyword ? (
        <Chip
          label={
            <span>
              keyword:{' '}
              <strong>{keyword}</strong>
            </span>
          }
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem', height: 20 }}
        />
      ) : null}
    </Stack>
  );
}
