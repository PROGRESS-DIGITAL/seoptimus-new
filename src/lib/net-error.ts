/** Понятный текст вместо «Failed to fetch» и похожих сетевых ошибок браузера */
export function friendlyError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/failed to fetch|load failed|networkerror|network ?error|network connection was lost|err_|fetch failed/i.test(msg))
    return "Связь с сервером прервалась. Проверьте интернет и попробуйте ещё раз.";
  return msg;
}
