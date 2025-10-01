const http = require('http');
const fs = require('fs');
const path = require('path');
const SpringXMLParser = require('./xmlParser');
const DAGGenerator = require('./dagGenerator');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml'
};

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/parse' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { xml } = JSON.parse(body);
        const parser = new SpringXMLParser();
        const jobs = await parser.parseXML(xml);
        const dagGenerator = new DAGGenerator();
        const dag = dagGenerator.generateDAG(jobs);
        const executionOrder = dagGenerator.getExecutionOrder();
        const levels = dagGenerator.getLevels();
        const cycles = dagGenerator.detectCycles();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          dag,
          executionOrder,
          levels,
          hasCycles: cycles.length > 0,
          cycles
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.url === '/api/parse-file' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { filePath } = JSON.parse(body);
        const parser = new SpringXMLParser();
        const jobs = await parser.parseFile(filePath);
        const dagGenerator = new DAGGenerator();
        const dag = dagGenerator.generateDAG(jobs);
        const executionOrder = dagGenerator.getExecutionOrder();
        const levels = dagGenerator.getLevels();
        const cycles = dagGenerator.detectCycles();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          dag,
          executionOrder,
          levels,
          hasCycles: cycles.length > 0,
          cycles
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    // Serve static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, '..', 'public', filePath);

    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'text/plain';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404);
          res.end('404 - File Not Found');
        } else {
          res.writeHead(500);
          res.end('500 - Internal Server Error');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`Spring XML Job Visualizer running at http://localhost:${PORT}/`);
});
