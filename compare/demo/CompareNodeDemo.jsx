// Demo 2 - connecting the compare node to your own stage.
//
// The node (CompareHandle) draws nothing but the divider, grip and labels; it
// is told where the picture is (t, size, stage) and reports where the user
// moved the split (onSplit). The page owns the stage, the layers and the split.
import { useRef, useState } from 'react';
import { afterClip, CompareHandle, useZoomPan } from '@/components/compare';

export function CompareNodeDemo({ beforeUrl, afterUrl, width, height }) {
  const stageRef = useRef(null);
  const size = { w: width, h: height };                         // the pictures' size, CSS px
  const [split, setSplit] = useState(50);                       // the node's value, 0-100
  const { t, stageBox, stageProps, transform, fit } = useZoomPan(stageRef, size);

  return (
    <div>
      <p>
        Split: {split}% <button type="button" onClick={() => setSplit(50)}>Centre</button>{' '}
        <button type="button" onClick={fit}>Fit</button>
      </p>
      {/* 1. the stage: positioned, clips, receives zoom and pan */}
      <div ref={stageRef} {...stageProps} style={{ position: 'relative', overflow: 'hidden', height: 500, background: '#eee', touchAction: 'none' }}>
        {/* 2. the content: both pictures, same size, one transform */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: size.w, height: size.h, transform, transformOrigin: '0 0' }}>
          <img src={beforeUrl} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          <img src={afterUrl} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', clipPath: afterClip(split) }} />
        </div>
        {/* 3. the node: beside the content, not inside it, so it keeps its size at any zoom */}
        <CompareHandle
          split={split}
          onSplit={setSplit}
          t={t}
          size={size}
          stage={stageBox}
          stageRef={stageRef}
          labels={{ before: 'Scan', after: 'Vector' }}
        />
      </div>
    </div>
  );
}
