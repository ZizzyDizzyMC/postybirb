export class UsernameParser {
  /**
   * Converts username shortscuts such as :falemonynade: -> href="https://www.furaffinity.net/user/lemonynade"
   * @param  html        Text to be parsed
   * @param  code        Website code e.g. fa
   * @param  replacement Regex replacement string e.g. https://www.furaffinity.net/user/$1
   */
  public static parse(html: string, code: string, replacement: string): string {
    if (!html) return '';

    const regex = new RegExp(`:${code}(.*?):`, 'gi');
    html = html.replace(regex, `<a href="${replacement}">$1</a>`);

    return html;
  }
}
