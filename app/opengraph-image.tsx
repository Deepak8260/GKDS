import { ImageResponse } from 'next/og';
import { getSite } from '@/lib/content';

// Branded fallback share image (used when a page has no photo of its own).
export const alt = 'Gopal Krushna Driving Training School, Baleswar, Odisha';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const site = await getSite();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 88px',
          background: 'linear-gradient(135deg, #0B3D1E 0%, #145c2e 100%)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', width: 120, height: 8, background: '#EC650C', marginBottom: 36 }} />
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>{site.name}</div>
        <div style={{ fontSize: 34, marginTop: 28, color: '#FFA866', display: 'flex' }}>
          {`${site.address.city}, ${site.address.state} · Since ${site.stats.sinceYear}`}
        </div>
        <div style={{ fontSize: 28, marginTop: 20, color: 'rgba(255,255,255,0.85)', display: 'flex' }}>
          Learn to drive with confidence
        </div>
      </div>
    ),
    size,
  );
}
