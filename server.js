var conf = require('config');

// ==========================================================================================================
// WegServer
var webport = conf.webport || 8080;
var child_process = require('child_process'),
    os = require('os'),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    querystring = require('querystring'),
    xml2js = require("xml2js"),
    cheerio = require('cheerio'),
    request = require('request');

var YAppID = process.env.YahooDevKey;

var server = http.createServer(function (request, response) {
    var Response = {
        "200": function (file, filename) {
            var mime = {
                ".html": "text/html",
                ".css": "text/css",
                ".js": "application/javascript",
                ".json": "application/json",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".gif": "image/gif",
                ".svg": "image/svg+xml",
                ".pdf": "application/pdf",
                ".txt": "text/plain"
            };
            var isJson = false;
            if (typeof (file) != "string") {
                isJson = true;
                file = JSON.stringify(file);
            }
            var header = {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": isJson ? mime[".json"] : (mime[path.extname(filename)] || "text/plain"),
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            };
            response.writeHead(200, header);
            response.write(file, "binary");
            response.end();
        },
        "404": function () {
            response.writeHead(404, { "Content-Type": "text/plain" });
            response.write("404 Not Found\n");
            response.end();

        },
        "503": function (err) {
            response.writeHead(503, { "Content-Type": "text/plain" });
            response.write(err + "\n");
            response.end();
        },
        "500": function (err) {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.write(err + "\n");
            response.end();
        }
    }


    var uri = url.parse(request.url).pathname
        , filename;

    var pa = uri.substring(7);
    console.log(uri);
    if (uri.indexOf("/cache/") == 0) {
        filename = path.join(process.cwd(), uri);
    } else {
        filename = path.join(process.cwd() + "\\www\\", uri);
    }
    fs.exists(filename, function (exists) {
        if (!exists) {
            Response["404"]();
            return;
        }
        // ディレクトリの場合はファイルリストをjsonで返す
        if (fs.statSync(filename).isDirectory()) {
            Response["200"]({ "states": "ok", "files": fs.readdirSync(filename) });
            return;
        }

        fs.readFile(filename, "binary", function (err, file) {
            if (err) { Response["500"](err); return; }
            Response["200"](file, filename);
        });

    });


}).listen(parseInt(webport, 10));
console.log("Server running at http://localhost:" + webport);

var io = require("socket.io").listen(server);
io.sockets.on("connection", function (socket) {

    // 接続開始カスタムイベント(接続元ユーザを保存し、他ユーザへ通知)
    socket.on("sendtext", function (text) {
        irasutoText = text;
        irasutoUrls = {};
        getYahooapi(text);
        // var msg = text;
        // io.sockets.emit("publish", { value: msg });
    });
});

var irasutoUrls = {};
var irasutoText = "";
var irasutoImageCount = 0;
var irasutoImageLoaded = 0;
var irasutoWordCount = 0;
var irasutoWordLoaded = 0;

function getYahooapi(text) {
    irasutoImageCount = 0;
    irasutoImageLoaded = 0;
    irasutoWordCount = 0;
    irasutoWordLoaded = 0;

    console.log("YAHOO");
    qst = querystring.stringify({
        appid: YAppID,
        sentence: text,
        results: 'ma,uniq'
    })

    options = {
        host: 'jlp.yahooapis.jp',
        port: 80,
        path: '/MAService/V1/parse?' + qst
    };

    http.get(options, function (res) {
        var body = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', (res) => {
            //console.log(body);
            getResData(body);
        });
    });
}
function getResData(xml) {
    console.log('XML');
    xml2js.parseString(xml, {
        trim: true,
        explicitArray: false
    }, function (err, data) {
        if (err) {
            throw err;
        }
        data.ResultSet.uniq_result.word_list.word.forEach(function (val, index, array) {
            if (val.pos == "名詞" && val.surface.length > 1) {
                getIrasutoyaData(val.surface)
            }
        });
    });
}

function getIrasutoyaData(word) {
    console.log('LOAD HTML');
    irasutoWordCount++;
    qst = querystring.stringify({
        q: word
    });
    options = {
        host: 'www.irasutoya.com',
        port: 80,
        path: '/search?' + qst
    };
    http.get(options, function (res) {
        var body = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', (res) => {
            var $ = cheerio.load(body);

            var myRe = new RegExp(/bp_thumbnail_resize\("(.*)","(.*)"\)/g);

            irasutoUrls[word] = [];
            $('a').each(function (idx) {
                var src = $(this).html();
                var myArray;
                if (src.indexOf("bp_thumbnail_resize") > 0) {
                    if ((myArray = myRe.exec(body)) != null) {
                        irasutoUrls[word].push({ "path": myArray[1].replace("/s72-c/", "/s800/"), "url": $(this).attr("href") });
                        irasutoImageCount++;

                    }
                }
            });

            getLoadComp(word);
        });
    });
}

function getLoadComp(word) {

    irasutoWordLoaded++;
    // for (var i in irasutoUrls) {
        for (var j = 0; j < irasutoUrls[word].length; j++) {
            var filepath = irasutoUrls[word][j]["path"];
            var fileName = filepath.substring(filepath.lastIndexOf("/") + 1);
            irasutoUrls[word][j]["name"] = fileName;
            getImage(irasutoUrls[word][j]);
        }
    // }


}

function getImage(file) {
    console.log(file["name"]);
    if (!isExistFile("cache/" + file["name"])) {
        request(
            { method: 'GET', url: file["path"], encoding: null },
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    fs.writeFileSync("cache/" + file["name"], body, 'binary');

                    irasutoImageLoaded++;
                    console.log('LOAD ' + irasutoImageLoaded);
                    if (irasutoImageLoaded == irasutoImageCount && irasutoWordLoaded == irasutoWordCount) {
                        console.log('comp');
                        io.sockets.emit("publish", { value: irasutoUrls });
                    }
                }
            }
        );
    } else {
        irasutoImageLoaded++;
        console.log('LOAD ' + irasutoImageLoaded + " == " + irasutoImageCount + " && " + irasutoWordLoaded + " == " + irasutoWordCount);
        if (irasutoImageLoaded == irasutoImageCount && irasutoWordLoaded == irasutoWordCount) {
            console.log('comp');
            io.sockets.emit("publish", { value: irasutoUrls });
        }

    }
}

function isExistFile(file) {
    try {
        fs.statSync(file);
        return true
    } catch (err) {
        if (err.code === 'ENOENT') return false
    }
}



//getYahooapi("避難所での盗難に注意！");
// getTextData('<?xml version="1.0" encoding="UTF-8" ?><ResultSet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:yahoo:jp:jlp" xsi:schemaLocation="urn:yahoo:jp:jlp http://jlp.yahooapis.jp/MAService/V1/parseResponse.xsd"><ma_result><total_count>7</total_count><filtered_count>7</filtered_count><word_list><word><surface>避難所</surface><reading>ひなんじょ</reading><pos>名詞</pos></word><word><surface>で</surface><reading>で</reading><pos>助詞</pos></word><word><surface>の</surface><reading>の</reading><pos>助詞</pos></word><word><surface>盗難</surface><reading>とうなん</reading><pos>名詞</pos></word><word><surface>に</surface><reading>に</reading><pos>助詞</pos></word><word><surface>注意</surface><reading>ちゅうい</reading><pos>名詞</pos></word><word><surface>！</surface><reading>！</reading><pos>特殊</pos></word></word_list></ma_result><uniq_result><total_count>7</total_count><filtered_count>7</filtered_count><word_list><word><count>1</count><surface>で</surface><reading/><pos>助詞</pos></word><word><count>1</count><surface>に</surface><reading/><pos>助詞</pos></word><word><count>1</count><surface>の</surface><reading/><pos>助詞</pos></word><word><count>1</count><surface>注意</surface><reading/><pos>名詞</pos></word><word><count>1</count><surface>盗難</surface><reading/><pos>名詞</pos></word><word><count>1</count><surface>避難所</surface><reading/><pos>名詞</pos></word><word><count>1</count><surface>！</surface><reading/><pos>特殊</pos></word></word_list></uniq_result></ResultSet>')

//getIrasutoyaData("避難");


// 起動時に対象のページを立ち上げる
//child_process.exec("start http://localhost:" + webport + "/index.html");
