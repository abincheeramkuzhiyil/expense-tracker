import { Box, Container, Typography } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Hello User!
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Have a great session :)
        </Typography>
      </Box>
    </Container>
  );
}
