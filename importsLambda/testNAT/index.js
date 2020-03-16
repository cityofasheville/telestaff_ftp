const https = require('https');

//exports.handler = async function(event, context) 
{
    https.get('https://api.nasa.gov/planetary/apod?api_key=JUYsgrVmKhlUtBdiXwDBqIlmc4khUaljBAgyfome', (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        console.log(JSON.parse(data).explanation);
    });

    }).on("error", (err) => {
    console.log("Error: " + err.message);
    });
}