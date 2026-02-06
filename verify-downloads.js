const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    bold: "\x1b[1m"
};

const args = process.argv.slice(2);
const targetDir = args[0];

if (!targetDir) {
    console.error(`${colors.red}Error: Please provide the target directory path.${colors.reset}`);
    console.log(`Usage: node verify-downloads.js "C:\\path\\to\\SIPD-Output"`);
    process.exit(1);
}

if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error: Directory not found: ${targetDir}${colors.reset}`);
    process.exit(1);
}

console.log(`${colors.cyan}Scanning directory: ${targetDir}...${colors.reset}\n`);

// 1. Identify Jadwals
const jadwals = fs.readdirSync(targetDir)
    .filter(file => {
        const fullPath = path.join(targetDir, file);
        return fs.statSync(fullPath).isDirectory() && file !== 'System Volume Information';
    });

const totalJadwals = jadwals.length;
console.log(`${colors.bold}Found ${totalJadwals} Jadwals:${colors.reset}`);
jadwals.forEach(j => console.log(` - ${j}`));
console.log('');

// 2. Identify all unique SKPDs across all Jadwals
const skpdSet = new Set();
const skpdMap = {}; // Map<SkpdName, Set<JadwalName>>

jadwals.forEach(jadwal => {
    const jadwalPath = path.join(targetDir, jadwal);
    const skpds = fs.readdirSync(jadwalPath)
        .filter(file => {
            const fullPath = path.join(jadwalPath, file);
            return fs.statSync(fullPath).isDirectory();
        });

    skpds.forEach(skpd => {
        skpdSet.add(skpd);
        if (!skpdMap[skpd]) {
            skpdMap[skpd] = new Set();
        }
        skpdMap[skpd].add(jadwal);
    });
});

const sortedSkpds = Array.from(skpdSet).sort();
console.log(`${colors.bold}Found ${sortedSkpds.length} Unique SKPDs.${colors.reset}\n`);

// 3. Verify Files per SKPD
// Definition of standard files to check
const filesToCheck = [
    { name: 'Persetujuan', filename: '1. depan - persetujuan.json' },
    { name: 'SKPD', filename: '2. skpd.json' },
    { name: 'Pendapatan', filename: '3. pendapatan.json' },
    { name: 'Belanja', filename: '4. belanja.json' },
    { name: 'Pembiayaan', filename: '5. pembiayaan.json' }
];

console.log(`${colors.bold}Verification Report:${colors.reset}`);
console.log('='.repeat(80));

sortedSkpds.forEach(skpd => {
    console.log(`${colors.bold}📦 SKPD: ${skpd}${colors.reset}`);

    // Track stats for this SKPD
    const stats = {
        'Persetujuan': 0,
        'SKPD': 0,
        'Pendapatan': 0,
        'Belanja': 0,
        'Pembiayaan': 0,
        'Rincian Belanja': 0 // Count of jadwals containing subfolders
    };

    jadwals.forEach(jadwal => {
        const skpdPath = path.join(targetDir, jadwal, skpd);

        if (fs.existsSync(skpdPath)) {
            // Check standard files
            filesToCheck.forEach(fileDef => {
                const filePath = path.join(skpdPath, fileDef.filename);
                if (fs.existsSync(filePath)) {
                    try {
                        // Verify valid JSON
                        const content = fs.readFileSync(filePath, 'utf8');
                        if (content.trim().length > 0) {
                            JSON.parse(content);
                            stats[fileDef.name]++;
                        }
                    } catch (e) {
                        // Invalid JSON, don't count
                    }
                }
            });

            // Check Rincian Belanja (Existence of sub-directories)
            const subItems = fs.readdirSync(skpdPath);
            const hasSubFolders = subItems.some(item => {
                const fullPath = path.join(skpdPath, item);
                return fs.statSync(fullPath).isDirectory();
            });

            if (hasSubFolders) {
                stats['Rincian Belanja']++;
            }
        }
    });

    // Print Stats
    // Helper to print line
    const printStat = (label, count) => {
        const isComplete = count === totalJadwals;
        const color = isComplete ? colors.green : (count === 0 ? colors.red : colors.yellow);
        console.log(`   - ${label.padEnd(16)}: ${color}${count}/${totalJadwals}${colors.reset}`);
    };

    filesToCheck.forEach(f => printStat(f.name, stats[f.name]));
    printStat('Rincian Belanja', stats['Rincian Belanja']);
    console.log(''); // Empty line between SKPDs
});

console.log('='.repeat(80));
console.log('Done.');
