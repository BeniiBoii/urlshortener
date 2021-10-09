
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const shortid = require('shortid');
const URL = require('url').URL;
const bodyParser = require("body-parser");
const dns = require("dns");
const app = express();
app.use(bodyParser.urlencoded({extended: false}));


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
 console.log(mongoose.connection.readyState);
 
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
})
const URL_MODEL = mongoose.model('URL',urlSchema)

let urlExtractor = function(url){
  const urlSplit = url.split("https://");
  if(urlSplit[1]=== undefined){
    return urlSplit[0].split("/")[0]
  }else{
    return urlSplit[1].split("/")[0]
  }
}

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl',(req,res)=>{
  const originalUrl = req.body.url;
  let extractedUrl = urlExtractor(originalUrl);

  if(extractedUrl !== undefined){
    dns.lookup(extractedUrl,(err,address,family)=>{
      if(err){
        res.json({error:"invalid url"})
      }else{
        const does_url_exist = URL_MODEL.findOne({original_url: originalUrl}).then(url_exists =>{
          if(url_exists){
            res.json({
            original_url: url_exists.original_url,
            short_url: url_exists.short_url
            })
          }else{
            const shortenedUrl = shortid.generate().toString();
            const newUrl = new URL_MODEL({
                original_url: originalUrl,
                short_url: shortenedUrl
            });
            newUrl.save(function(err,data){
              if(err){
                return console.error(err)
              }
            });
            res.json({
                original_url: originalUrl,
                short_url: shortenedUrl
            })
          }

        }) 
      }
    })
  }
  })

app.get('/api/shorturl/:short_url', async function(req,res){
  const findUrl = await URL_MODEL.findOne({
    short_url: req.params.short_url
  })
  if(findUrl === "" || findUrl === undefined){
    res.json('no Url found');
  }else{
    res.redirect(findUrl.original_url)
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
