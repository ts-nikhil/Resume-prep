const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(express.urlencoded({ extended: true }));
//app.set('view engine', 'ejs');
//app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'views')));

app.use(bodyParser.json());
app.get('/index.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.js'));    
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'style.css'));    
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'summary.html'));
});

app.get('/summary', (req, res) => {
    console.log('start')
    res.render('summary');
});

function readDirectory(dir, fileList = []) {
    const files = fs.readdirSync(dir);  
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            readDirectory(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    });
    return fileList;
}


const directoryPath = './data';

app.get('/jsondata', (req, res) => {
    const fileList = readDirectory(directoryPath);

    const mdFiles = fileList.filter(file => path.extname(file) === '.md');

    const jsonData = { files: mdFiles };
    fs.writeFileSync(path.join(__dirname,'markdown-driver.json'), JSON.stringify(jsonData, null, 2));
    res.json(jsonData);
   
});

function readMarkdownContent(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
app.get('/mdcontent',(req,res)=>{
    //console.log(req)
readMarkdownContent(req.query.file)
    .then(content => {
        //console.log(content); // Handle the content as you wish
        res.json(content)
    })
    .catch(error => {
        console.error('Error reading markdown content:', error);
    });
});

app.post('/save', (req, res) => {
    
    const jsonData = req.body;
    //console.log(jsonData)
    let markdownContent = '';

    jsonData.forEach(section => {
        markdownContent += `# ${section.header}\n`;
        section.items.forEach(item => {
            markdownContent += `* ${item}\n`;
        });
    });

    fs.writeFileSync(path.join(__dirname,'Output', 'output.md'), markdownContent);

    res.send('Data saved successfully');
});

app.post('/draft', (req, res) => {
    
    const jsonData = req.body;
    //console.log(jsonData)
    
    fs.writeFileSync(path.join(__dirname,'Drafts', 'draft.json'), JSON.stringify(jsonData, null, 2));

    res.send('Data saved in draft');
});

app.get('/load-draft', (req, res) => {
    if (fs.existsSync(path.join(__dirname,'Drafts', 'draft.json'))) {
        const jsonData = fs.readFileSync(path.join(__dirname,'Drafts', 'draft.json'), 'utf8');
        res.json(JSON.parse(jsonData));
    } else {
        res.json([]);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

