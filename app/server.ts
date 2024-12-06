import http from "http";
import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";
import routes from "../app/routes";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const soap = require("soap");

const server = http.createServer((req, res) => {
  res.end("404: Not Found: " + req.url);
});
const app = express();

const port = process.env.QB_SOAP_PORT || 8000;

const WSDL_FILENAME = "qbws.wsdl"; // Remove leading slash from the filename

function buildWsdl(): string {
  // Construct the full path to the WSDL file
  const wsdlPath = path.join(__dirname, "soap", WSDL_FILENAME);

  // Read and return the contents of the WSDL file
  const wsdl = fs.readFileSync(wsdlPath, "utf8");
  return wsdl;
}
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api", routes);

app.listen(process.env.REST_API_PORT, () => {
  console.log(
    `Server running at http://localhost:${process.env.REST_API_PORT}`
  ); 
});

class Server {
  private wsdl: string;
  private webService: any;

  constructor() {
    this.wsdl = buildWsdl();
    this.webService = require("../app/soap/web-service");
  }

  public run(): void {
    try {
      // Start the HTTP server
      server.listen(port, () => {
        console.log("Quickbooks SOAP Server listening on port " + port);
      });

      // Start SOAP server
      soap.listen(server, "/3nStar/qbd", this.webService.service, this.wsdl);
    } catch (error) {
      // Handle errors
      console.error("Error starting server:", error);
      process.exit(1); // Exit the process with an error code
    }
  }

  public async setQBXMLHandler(qbXMLHandler: any): Promise<void> {
    this.webService.setQBXMLHandler(await qbXMLHandler.fetchRequests);
  }
}

export default new Server();
