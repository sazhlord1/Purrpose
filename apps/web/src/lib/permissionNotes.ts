/**
 * Before the phone asks for a permission (camera, microphone, notifications), the app first
 * says in its own words why it needs it. That note is shown once per kind on this device.
 */
export type PermissionKind = 'camera' | 'microphone' | 'notifications';

const key = (k: PermissionKind) => `purrpose.permission-note.${k}`;

export function permissionExplained(kind: PermissionKind): boolean {
  try {
    return localStorage.getItem(key(kind)) === '1';
  } catch {
    return false;
  }
}

export function markPermissionExplained(kind: PermissionKind): void {
  try {
    localStorage.setItem(key(kind), '1');
  } catch {
    /* private mode: the note just shows again next time */
  }
}
