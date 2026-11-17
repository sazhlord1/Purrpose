import { lazy, Suspense } from 'react';
import { useModal } from '../../lib/modals.js';
import { LoginPopup } from './LoginPopup.js';
import { PantryPeek } from './PantryPeek.js';

const NewPactWizard = lazy(() => import('../pact/NewPactWizard.js').then(m => ({ default: m.NewPactWizard })));
const NewCaseWizard = lazy(() => import('../detective/NewCaseWizard.js').then(m => ({ default: m.NewCaseWizard })));

/** The app-wide pop-ups (one open at a time). */
export function GlobalModals() {
  const m = useModal();
  return (
    <>
      <LoginPopup open={m.kind === 'login'} reason={m.kind === 'login' ? m.reason : undefined} />
      <PantryPeek open={m.kind === 'pantry'} />
      <Suspense fallback={null}>
        {(m.kind === 'newPact' || m.kind === 'none') && <NewPactWizard open={m.kind === 'newPact'} initialCat={m.kind === 'newPact' ? m.catId : undefined} />}
        {(m.kind === 'newCase' || m.kind === 'none') && <NewCaseWizard open={m.kind === 'newCase'} />}
      </Suspense>
    </>
  );
}
