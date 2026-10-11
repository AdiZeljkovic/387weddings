/**
 * A story's address from its title: "Amra & Tarik, Vijećnica" -> "amra-tarik-vijecnica".
 * Diacritics are folded (č ć -> c, š -> s, ž -> z, đ -> d), anything else that
 * is not a letter or digit becomes a single hyphen. One copy, used by the
 * panel, the API and the start-up migration, so all three agree.
 */
export const slugify = (input: string) =>
  String(input)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
