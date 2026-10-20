const fs = require("fs");
const esbuild = require("esbuild");
const path = require("path");

const checkDir = (dir) => {
    const files = fs.readdirSync(dir);
    let found = false;
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            if (checkDir(p)) found = true;
        } else if (f.endsWith(".tsx") || f.endsWith(".ts")) {
            const content = fs.readFileSync(p, "utf-8");
            try {
                esbuild.transformSync(content, { loader: "tsx" });
            } catch(e) {
                found = true;
                console.log(`\n❌ ERRORE DI SINTASSI IN: ${p.split(/[\\/]src[\\/]/)[1]}`);
                const match = e.message.match(/<stdin>:(\d+):(\d+): (.*)/);
                if (match) {
                    const line = parseInt(match[1]);
                    console.log(`Motivo: ${match[3]}`);
                    const lines = content.split('\n');
                    console.log(`--- CONTESTO (Riga ${line}) ---`);
                    for(let i=Math.max(0, line-4); i<Math.min(lines.length, line+4); i++) {
                        const marker = i === line-1 ? ">>" : "  ";
                        console.log(`${marker} ${i+1}: ${lines[i]}`);
                    }
                    console.log("------------------------------\n");
                } else {
                    console.log(e.message);
                }
            }
        }
    }
    return found;
};

console.log("⏳ Scansione sintattica di tutti i file TSX in corso...");
const routesDir = path.join(__dirname, "src", "routes");
const compDir = path.join(__dirname, "src", "components");

let errorFound = checkDir(routesDir);
if(!errorFound) errorFound = checkDir(compDir);

if (!errorFound) {
    console.log("✅ Nessun errore di sintassi rilevato nei file TSX analizzati!");
} else {
    console.log("💡 Incolla questo output in chat per il fix immediato in 1 secondo.");
}
