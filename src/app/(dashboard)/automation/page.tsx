import { permanentRedirect } from 'next/navigation';

export default function AutomationLegacyRedirect() {
  // Permanently redirect the legacy /automation route to the new Studio /studio/automation UI
  permanentRedirect('/studio/automation');
}
