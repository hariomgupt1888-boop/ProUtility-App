const fs = require('fs');
const path = require('path');

async function downloadKhazana() {
    console.log("🚀 GOD MODE ON (Patch 2.0): Nakshe ka taala tod rahe hain...\n");

    try {
        const baseUrl = 'https://staticimgly.com/@imgly/background-removal-data/1.4.3/dist/';
        
        console.log("⏳ Asli Naksha (resources.json) mangwa rahe hain...");
        const resJson = await fetch(baseUrl + 'resources.json');
        const json = await resJson.json();
        
        // Hacker Trick: Pura JSON padh kar sirf file ke naam (.wasm, .onnx) nikal lo
        const jsonString = JSON.stringify(json);
        const regex = /"([^"]+)"/g;
        let match;
        const fileSet = new Set();
        
        while ((match = regex.exec(jsonString)) !== null) {
            const val = match[1];
            // Sirf wahi naam uthao jinke aakhiri mein .wasm, .onnx ya .bin ho
            if (val.endsWith('.wasm') || val.endsWith('.onnx') || val.endsWith('.bin')) {
                fileSet.add(val);
            }
        }
        
        const allFiles = [...fileSet];

        console.log(`🎉 Naksha Solved! Total ${allFiles.length} asli files nikalni hain. Downloading shuru...\n`);

        for (const filePath of allFiles) {
            console.log(`⏳ Khinch rahe hain: ${filePath}...`);
            const fileUrl = baseUrl + filePath;
            
            const response = await fetch(fileUrl);
            if (!response.ok) {
                console.log(`❌ Fail ho gaya: ${filePath}`);
                continue;
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Folder structure banayein agar zaroorat ho
            const dir = path.dirname(filePath);
            if (dir !== '.' && !fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, buffer);
            
            let size = (buffer.length / 1024).toFixed(2) + " KB";
            if (buffer.length > 1024 * 1024) {
                size = (buffer.length / (1024 * 1024)).toFixed(2) + " MB";
            }
            console.log(`✅ ${filePath} successfully saved! (Size: ${size})\n`);
        }
        
        fs.writeFileSync('resources.json', JSON.stringify(json, null, 2));
        console.log(`✅ resources.json bhi successfully saved!\n`);

        console.log("🏆 SUPER SUCCESS! Bhai, ab engine 100% download ho chuka hai! Inhe apne GitHub par daal dijiye!");

    } catch (error) {
        console.log("❌ Error:", error.message);
    }
}

downloadKhazana();