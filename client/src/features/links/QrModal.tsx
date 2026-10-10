'use client';

import { Button, Modal, Spinner, copyToClipboard } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setQrFor } from '@/store/uiSlice';
import { useQr } from './hooks';

export default function QrModal() {
  const dispatch = useAppDispatch();
  const link = useAppSelector((s) => s.ui.qrFor);
  const { data, isLoading } = useQr(link?.id);
  const close = () => dispatch(setQrFor(null));

  return (
    <Modal open={!!link} onClose={close} title="QR code">
      <div className="flex flex-col items-center gap-4">
        {isLoading || !data ? (
          <div className="grid size-80 place-items-center"><Spinner /></div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data} alt={`QR code for ${link?.shortUrl}`} className="size-80 rounded-md border border-line bg-white p-2" />
        )}
        <p className="font-mono text-sm">{link?.shortUrl}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => link && copyToClipboard(link.shortUrl)}>Copy link</Button>
          {data && (
            <a href={data} download={`qr-${link?.shortCode}.png`}>
              <Button>Download PNG</Button>
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}
