const
    http = require("http"),
    path = require("path"),
    fs = require("fs"),
    fsPromises = fs.promises,
    EventEmitter = require("events"),
    logEvents = require("./log_events");

class Emitter extends EventEmitter { };
// Initialize Object
const myEmitter = new Emitter();
// Add listener for the log event
myEmitter.on("log", (msg, logName) => { logEvents(msg, logName) });

const PORT = process.env.PORT || 8080;

const serveFile = async (filePath, contentType, res) => {
    try {
        const rawData = await fsPromises.readFile(
            filePath,
            !contentType.includes("image") ? "utf-8" : ""
        );
        const data = contentType === "application/json"
            ? JSON.parse(rawData) : rawData;
        res.writeHead(
            filePath.includes("404.html") ? 404 : 200, // Control the file path for sending a correcting status code
            { "Content-Type": contentType }
        );
        res.end(
            contentType === "application/json" ? JSON.stringify(data) : data
        );
    } catch (err) {
        console.error(err.message);
        myEmitter.emit(
            "log",
            `${err.name}: ${err.message}`,
            "errLog"
        );
        res.statusCode = 500;
        res.end();
    }
}
const server = http.createServer((req, res) => {
    myEmitter.emit(
        "log",
        `${req.url}\t${req.method}`,
        "reqLog"
    );
    const extension = path.extname(req.url);
    let contentType = "";
    switch (extension) {
        case ".css":
            contentType = "text/css";
            break;
        case ".js":
            contentType = "text/javascript";
            break;
        case ".json":
            contentType = "application/json";
            break;
        case ".jpg":
            contentType = "image/jpeg";
            break;
        case ".png":
            contentType = "image/png";
            break;
        case ".txt":
            contentType = "text/plain";
            break;
        default:
            contentType = "text/html";
    }

    let filePath =
        contentType === "text/html" && req.url === "/"
            ? path.join(__dirname, "views", "index.html")
            : contentType === "text/html" && req.url.slice(-1) === "/"
                ? path.join(__dirname, "views", req.url, "index.html")
                : contentType === "text/html"
                    ? path.join(__dirname, "views", req.url)
                    : path.join(__dirname, req.url);

    // makes .html extension not required in the browser
    if (!extension && req.url.slice(-1) !== '/') filePath += '.html';

    const fileExists = fs.existsSync(filePath);
    if (fileExists) {
        serveFile(filePath, contentType, res);
    } else {
        switch (path.parse(filePath).base) {
            case "old_page.html":
                res.writeHead(301, { "Location": "/new_page.html" });
                res.end();
                break;
            case "www_page.html":
                res.writeHead(301, { "Location": "/" });
                res.end();
                break;
            default:
                serveFile(path.join(__dirname, "views", "404.html"), "text/html", res);
        }
    }

    console.log(req.url, req.method, contentType, filePath, path.parse(filePath).base);
});
server.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });
