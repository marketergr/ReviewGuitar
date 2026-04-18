const http = require('http');

const data = JSON.stringify({
    model: 'gemma2:9b',
    prompt: 'Say hello in 5 words',
    stream: false
});

const options = {
    hostname: 'localhost',
    port: 11434,
    path: '/api/generate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('FULL RESPONSE:', body);
    });
});

req.on('error', (e) => console.error('ERROR:', e));
req.write(data);
req.end();
