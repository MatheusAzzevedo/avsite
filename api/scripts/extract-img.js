const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function extractImages() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(process.cwd(), 'MODELO ListaParaEscola.xlsx');
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.getWorksheet(1);
  const wsImages = worksheet.getImages();
  console.log(`Worksheet has ${wsImages.length} images.`);
  
  wsImages.forEach((wsImg, index) => {
    const img = workbook.getImage(wsImg.imageId);
    const fileName = `header_logo.${img.extension}`;
    fs.writeFileSync(path.join(process.cwd(), 'api/public/images', fileName), img.buffer);
    console.log(`Saved image to api/public/images/${fileName}`);
  });
}

extractImages().catch(console.error);
