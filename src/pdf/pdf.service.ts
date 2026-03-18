import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly templateDir = join(process.cwd(), 'src', 'pdf', 'templates');

  async generate(
    templateName: string,
    data: Record<string, any>,
  ): Promise<Buffer> {
    const html = await this.renderTemplate(templateName, data);

    // Dynamic import to avoid loading Puppeteer at startup
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
        printBackground: true,
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private async renderTemplate(
    name: string,
    data: Record<string, any>,
  ): Promise<string> {
    const templatePath = join(this.templateDir, `${name}.hbs`);
    let source: string;
    try {
      source = await readFile(templatePath, 'utf-8');
    } catch {
      this.logger.warn(`Template ${name}.hbs not found, using default`);
      source = await readFile(join(this.templateDir, 'default.hbs'), 'utf-8');
    }
    const template = Handlebars.compile(source);
    return template({ ...data, generatedAt: new Date().toLocaleString() });
  }
}
