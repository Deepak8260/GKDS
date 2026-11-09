'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { alternatePath } from '@/lib/i18n/locales';
import { rememberLocale } from './lang-preference';

/**
 * Bilingual on purpose: the visitor has not chosen a language yet, so both are shown together.
 * Closing the window (Esc, the X, a click outside) counts as "stay in English".
 */
export default function LanguagePromptDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';

  function stay() {
    rememberLocale('en');
    onClose();
  }
  function switchToOdia() {
    rememberLocale('or');
    onClose();
    router.push(alternatePath(pathname, 'or'));
  }

  return (
    <Modal
      open
      onClose={stay}
      title="Choose your language / ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ"
      description="Would you like to read this website in Odia? ଏହି ୱେବସାଇଟ୍‌କୁ ଓଡ଼ିଆରେ ପଢ଼ିବାକୁ ଚାହାଁନ୍ତି କି?"
      className="sm:max-w-md"
    >
      <div className="space-y-5 text-center">
        <p className="text-base text-ink">Would you like to switch the website from English to Odia?</p>
        <p lang="or" className="text-base text-ink">
          ଆପଣ ଏହି ୱେବସାଇଟ୍‌କୁ ଇଂରାଜୀରୁ ଓଡ଼ିଆକୁ ବଦଳାଇବାକୁ ଚାହାଁନ୍ତି କି?
        </p>
        <div className="flex flex-col gap-3 pt-1">
          <Button onClick={switchToOdia} data-autofocus lang="or" className="w-full">
            ହଁ, ଓଡ଼ିଆରେ ଦେଖନ୍ତୁ
          </Button>
          <Button onClick={stay} variant="secondary" tone="green" className="w-full">
            No, continue in English
          </Button>
        </div>
      </div>
    </Modal>
  );
}
