/** Every story query for a signed-in person must carry their account id. */
export function accountStoryWhere(userId: string) {
  if (!userId) throw new Error("missing account");
  return { userId };
}

export function assertOneAccount(records: { userId: string }[], accountId: string) {
  if (!accountId) throw new Error("missing account");
  if (records.some((record) => record.userId !== accountId)) {
    throw new Error("mixed accounts");
  }
}
