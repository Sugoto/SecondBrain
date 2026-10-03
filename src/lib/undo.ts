import { showUndo } from "@/components/ui/snackbar";
import { withoutVirtualProps } from "@/lib/collections";

type Persisted = { isPersisted: { promise: Promise<unknown> } };

interface UndoableCollection<T> {
  get(key: string): T | undefined;
  delete(key: string): Persisted;
  insert(item: T): Persisted;
}

export function deleteWithUndo<T extends object>(
  collection: UndoableCollection<T>,
  id: string,
  message: string,
): Promise<unknown> {
  const snapshot = collection.get(id);
  const deleted = collection.delete(id).isPersisted.promise;
  if (snapshot) {
    const restore = withoutVirtualProps(snapshot);
    showUndo(message, async () => {
      await deleted.catch(() => undefined);
      await collection.insert(restore).isPersisted.promise;
    });
  }
  return deleted;
}
