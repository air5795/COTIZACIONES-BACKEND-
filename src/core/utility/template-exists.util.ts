import * as fs from 'fs';
const templateExists = (templatePath: string): boolean =>
  fs.existsSync(templatePath);
export { templateExists };
