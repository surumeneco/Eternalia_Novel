/** Select an explicitly named UI locale through the icon-triggered menu.
 * The presence of the menu is part of the current language-switch contract.
 */
export async function selectUiLanguage(page, language) {
  if (language !== 'ja' && language !== 'en') throw new Error('unsupported locale');
  await page.locator('button.locale-switch:not(:disabled)').click();
  const menu = page.locator('#language-list');
  await menu.getByRole('button', { name: language === 'en' ? 'English' : '日本語', exact: true }).click();
  await page.locator('html[lang="' + language + '"]').waitFor();
}
