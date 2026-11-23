/** A client-side, in-document confirmation channel. Never invoke browser confirm(). */
type DialogRequest = { id: number; message: string };
let serial = 0;
const pending = new Map<number, (accepted: boolean) => void>();

export function useAppDialog() {
  const current = useState<DialogRequest | null>('eternalia-dialog', () => null);
  function resolve(accepted: boolean) {
    const request = current.value;
    if (!request) return;
    current.value = null;
    const done = pending.get(request.id);
    pending.delete(request.id);
    done?.(accepted);
  }
  function confirm(message: string): Promise<boolean> {
    if (!import.meta.client) return Promise.resolve(false);
    // Do not lose an unresolved request when another action triggers a dialog.
    if (current.value) return Promise.resolve(false);
    const id = ++serial;
    current.value = { id, message };
    return new Promise<boolean>(resolve => { pending.set(id, resolve); });
  }
  return { current, confirm, resolve };
}
