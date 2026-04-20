export interface TransactionContext {
  query<T = unknown>(text: string, values?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
}

export interface UnitOfWork {
  runInTransaction<T>(operation: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
