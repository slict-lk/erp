const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            filelist = walkSync(dirFile, filelist);
        } else if (dirFile.endsWith('route.ts')) {
            filelist.push(dirFile);
        }
    });
    return filelist;
}

const paths = [
    ...walkSync('src/app/api/studio'),
    ...walkSync('src/app/api/automation/rules')
];

let changedCount = 0;

paths.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Fix: getOrCreateDefaultTenant(session.user.id) -> getOrCreateDefaultTenant()
    content = content.replace(/getOrCreateDefaultTenant\(session\.user\.id\)/g, 'getOrCreateDefaultTenant()');

    // Fix: module.fields -> (module as any).fields (Prisma include returns this)
    content = content.replace(/module\.fields\b/g, '(module as any).fields');

    // Fix: order -> sequence in customModuleField.update
    content = content.replace(/data:\s*\{\s*order:\s*i\s*\}/g, 'data: { sequence: i }');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
        changedCount++;
    }
});

console.log(`Total: ${changedCount}`);
