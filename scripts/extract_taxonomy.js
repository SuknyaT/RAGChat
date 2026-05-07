const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelFilePath = path.join(__dirname, '..', 'supporting_docs', 'Taxonomy Data.xlsx');
const outputDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

function parseExcel() {
    try {
        console.log('Reading file:', excelFilePath);
        const workbook = XLSX.readFile(excelFilePath);
        const sheetNames = workbook.SheetNames;
        console.log('Sheet names:', sheetNames);

        sheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            const outputPath = path.join(outputDir, `${sheetName}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
            console.log(`Exported ${sheetName} to ${outputPath}`);
        });
    } catch (error) {
        console.error('Error parsing excel:', error);
    }
}

parseExcel();
