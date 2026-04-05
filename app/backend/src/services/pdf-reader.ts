import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

export async function extractFullText(pdfPath: string): Promise<string> {
  const buffer = await fs.readFile(pdfPath);
  const data = await pdfParse(buffer);
  return data.text;
}

export async function getPageCount(pdfPath: string): Promise<number> {
  const buffer = await fs.readFile(pdfPath);
  const data = await pdfParse(buffer);
  return data.numpages;
}

export async function extractPages(pdfPath: string, startPage: number, endPage: number): Promise<string> {
  const buffer = await fs.readFile(pdfPath);
  const data = await pdfParse(buffer, {
    pagerender: function (pageData: { pageIndex: number; getTextContent: () => Promise<{ items: { str: string }[] }> }) {
      const pageNum = pageData.pageIndex + 1;
      if (pageNum < startPage || pageNum > endPage) return '';
      return pageData.getTextContent().then(content =>
        content.items.map(item => item.str).join(' ')
      );
    },
  });
  return data.text;
}
