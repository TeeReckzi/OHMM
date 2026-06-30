export const ohaiTheme = {
  colors: {
    background: '#02050d',
    surface: '#07111f',
    surfaceElevated: '#0b1628',
    border: 'rgba(107, 231, 255, 0.18)',
    textPrimary: '#eef7ff',
    textMuted: '#8ea2c9',
    cyan: '#00f0ff',
    blue: '#2f7dff',
    violet: '#8f36ff',
    verified: '#35f2a1',
    candidate: '#67b7ff',
    blocked: '#ffb457',
    unknown: '#8ea2c9',
  },
  gradients: {
    text: 'linear-gradient(135deg, #00f0ff 0%, #2f7dff 48%, #8f36ff 100%)',
    border: 'linear-gradient(135deg, rgba(0,240,255,0.62), rgba(47,125,255,0.42), rgba(143,54,255,0.62))',
    glow: 'radial-gradient(circle at 30% 0%, rgba(0,240,255,0.18), transparent 35%), radial-gradient(circle at 100% 100%, rgba(143,54,255,0.14), transparent 38%)',
  },
} as const;

export type OHAITrustState = 'verified' | 'candidate' | 'blocked' | 'unknown';
