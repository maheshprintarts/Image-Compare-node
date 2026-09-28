// Demo 1 - the simplest use: two pictures in, a compare panel out.
import { ComparePanel } from '@/components/compare';

export function SimpleCompareDemo({ beforeUrl, afterUrl }) {
  return (
    <div style={{ height: 500 }}>
      <ComparePanel
        before={beforeUrl}
        after={afterUrl}
        labels={{ before: 'Before', after: 'After' }}
      />
    </div>
  );
}
