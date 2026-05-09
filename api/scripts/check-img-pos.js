const ExcelJS = require('exceljs');
const path = require('path');

async function checkImagePosition() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(process.cwd(), 'MODELO ListaParaEscola.xlsx');
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.getWorksheet(1);
  const wsImages = worksheet.getImages();
  
  wsImages.forEach((wsImg, index) => {
    console.log(`Image ${index}: anchor=`, wsImg.range);
  });
}

checkImagePosition().catch(console.error);
