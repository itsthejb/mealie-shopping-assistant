function hostPattern(url) {
  return `${new URL(url).origin}/*`;
}

export async function requestMealieOriginAccess(permissions, mealieUrl, previousMealieUrl) {
  const requestedOrigin = hostPattern(mealieUrl);
  const requested = { origins: [requestedOrigin] };
  const granted = await permissions.request(requested);
  if (!granted) {
    throw new Error("Host access was not granted, so the extension cannot connect to Mealie.");
  }

  const previousOrigin = previousMealieUrl ? hostPattern(previousMealieUrl) : "";
  if (!previousOrigin || previousOrigin === requestedOrigin) return;

  try {
    const previous = { origins: [previousOrigin] };
    if (await permissions.contains(previous) && !(await permissions.remove(previous))) {
      throw new Error("Chrome did not remove the previous Mealie origin.");
    }
  } catch (error) {
    try {
      if (!(await permissions.remove(requested))) {
        throw new Error("Chrome did not revoke the newly requested Mealie origin.");
      }
    } catch (rollbackError) {
      throw new Error(
        `Could not revoke the previous Mealie origin (${error.message}); ` +
          `rollback failed (${rollbackError.message}).`,
      );
    }
    throw new Error(`Could not revoke the previous Mealie origin: ${error.message}`);
  }
}
