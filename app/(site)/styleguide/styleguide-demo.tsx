'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ToastProvider, useToast } from '@/components/ui/toast';

function Demo() {
  const [open, setOpen] = useState(false);
  const { success, error, toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Button variant="ghost" onClick={() => success('Saved successfully')}>
        Success toast
      </Button>
      <Button variant="ghost" onClick={() => error('Something went wrong')}>
        Error toast
      </Button>
      <Button variant="ghost" onClick={() => toast('Just so you know')}>
        Info toast
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Sample dialog" description="Focus is trapped here. Press Esc to close.">
        <p className="text-ink/80">This is the shared Modal. It traps focus, locks scroll and restores focus on close.</p>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setOpen(false)}>Got it</Button>
        </div>
      </Modal>
    </div>
  );
}

export function StyleguideDemo() {
  return (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  );
}
