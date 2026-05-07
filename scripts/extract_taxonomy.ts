import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelFilePath = path.join(__dirname, '..', 'supporting_docs', 'Taxonomy Data.xlsx');
const outputDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

function parseExcel() {
    const workbook = XLSX.readFile(excelFilePath);
    const sheetNames = workbook.SheetNames;

    sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const outputPath = path.join(outputDir, `${sheetName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
        console.log(`Exported ${sheetName} to ${outputPath}`);
    });
}

parseExcel();
