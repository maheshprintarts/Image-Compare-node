// Demo 3 - with the Vectorize service: pick an image, trace it on the server,
// compare the original with the filled SVG. Runs on a page the service serves
// (or the Vite dev server, which proxies /api to it).
import { useEffect, useState } from 'react';
import { ComparePanel } from '@/components/compare';
import { traceOnServer } from '@/lib/api.js';
import { toParams } from '@/lib/settings.js';

export function TraceAndCompareDemo() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [svg, setSvg] = useState(null);
  const [status, setStatus] = useState('Pick a PNG or JPEG');

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setSvg(null);
    setStatus('Tracing…');
    let live = true;
    traceOnServer({ file, name: file.name }, toParams('accurate', false), {
      onProgress: (p) => live && setStatus(`Tracing… ${Math.round(p * 100)}%`),
      register: () => {},
    })
      .then((result) => { if (live) { setSvg(result.filled || result.outline); setStatus('Done'); } })
      .catch((e) => live && setStatus(`Failed: ${e.message}`));
    return () => { live = false; URL.revokeObjectURL(url); };
  }, [file]);

  return (
    <div>
      <input type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files[0] ?? null)} />
      <span id="trace-status"> {status}</span>
      {imageUrl && svg && (
        <div style={{ height: 600, marginTop: 8 }}>
          <ComparePanel
            before={{ src: imageUrl, alt: 'Original image' }}
            after={{ svg, alt: 'Filled SVG' }}
            labels={{ before: 'Original', after: 'Filled SVG' }}
          />
        </div>
      )}
    </div>
  );
}
