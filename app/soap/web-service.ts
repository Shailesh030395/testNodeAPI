import semver from "semver";
import { v1 as uuidv1 } from "uuid";
import * as dotenv from "dotenv";
import QBXMLHandler from "../soap/qb-xml-handler";
import { prisma } from "../config/conn";
import soapRepository from "./soapRepository";

// Load environment variables from .env file
dotenv.config();

// Minimum and recommended versions of QBWebConnector
const MIN_SUPPORTED_VERSION = "1.0.0";
const RECOMMENDED_VERSION = "2.0.1";

// Counter and error tracking variables
let counter = 0;
let lastError = "";
let requestQueue: string[] = [];

// WebService object with methods for handling QuickBooks Web Connector requests
const webService: any = {
  QBWebConnectorSvc: {
    QBWebConnectorSvcSoap: {},
  },
};

// Handle serverVersion requests
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.serverVersion = function (
  args: any,
  callback: any
) {
  const retVal = "0.2.0";

  callback({
    serverVersionResult: { string: retVal },
  });
};

// Handle clientVersion requests and provide version compatibility messages
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.clientVersion = function (
  args: any,
  callback: any
) {
  let retVal = "";
  const qbwcVersion = `${args.strVersion.split(".")[0]}.${
    args.strVersion.split(".")[1]
  }.${args.strVersion.split(".")[2]}`;

  if (semver.lt(qbwcVersion, MIN_SUPPORTED_VERSION)) {
    retVal = "E:You need to upgrade your QBWebConnector";
  } else if (semver.lt(qbwcVersion, RECOMMENDED_VERSION)) {
    retVal = "W:It is recommended that you upgrade your QBWebConnector";
  }

  callback({
    clientVersionResult: { string: retVal },
  });
};

// Handle authentication requests and fetch pending requests
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.authenticate =
  async function (args: any, callback: any) {
    const authReturn: any[] = [uuidv1()];

    const { strUserName, strPassword } = args;
    const authenticatedUser = await soapRepository.checkWebConnectorCredential(
      strUserName,
      strPassword
    );

    if (authenticatedUser.success) {
      if (typeof QBXMLHandler.fetchRequests === "function") {
        await QBXMLHandler.fetchRequests(async function (
          err: any,
          requests: string[]
        ) {
          requestQueue = requests;
          if (err || requestQueue.length === 0) {
            authReturn[1] = "NONE";
          } else {
            // authReturn[1] = companyFile;
          }

          callback({
            authenticateResult: { string: [authReturn[0], authReturn[1]] },
          });
        });
      } else {
        // Fallback to 'NONE'
        authReturn[1] = "NONE";

        callback({
          authenticateResult: { string: [authReturn[0], authReturn[1]] },
        });
      }
    } else {
      // The username and password sent from
      // QBWC do not match was is set on the server.
      authReturn[1] = "nvu";

      callback({
        authenticateResult: { string: [authReturn[0], authReturn[1]] },
      });
    }
  };

// Handle sendRequestXML requests and return the next pending request
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.sendRequestXML = function (
  args: any,
  callback: any
) {
  let request = "";
  const totalRequests = requestQueue.length;

  if (counter < totalRequests) {
    request = requestQueue[counter];
    counter += 1;
  } else {
    request = "";
    counter = 0;
  }

  callback({
    sendRequestXMLResult: { string: request },
  });
};

// Handle receiveResponseXML requests and process the response
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.receiveResponseXML =
  function (args: any, callback: any) {
    const { response, hresult, message } = args;
    let retVal = 0;
    let percentage = 0;

    if (hresult) {
      console.log(`QB CONNECTION ERROR: ${message} (${hresult})`);
      lastError = message;
      retVal = -101;

      if (typeof QBXMLHandler.didReceiveError === "function") {
        QBXMLHandler.didReceiveError(hresult);
      }
    } else {
      if (typeof QBXMLHandler.handleResponse === "function") {
        QBXMLHandler.handleResponse(response);
      }
      percentage = !requestQueue.length
        ? 100
        : (counter * 100) / requestQueue.length;
      if (percentage >= 100) {
        counter = 0;
      }
      retVal = parseFloat(percentage.toFixed());
    }

    callback({
      receiveResponseXMLResult: { int: retVal },
    });
  };

// Handle connectionError requests and log the error
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.connectionError = function (
  args: any,
  callback: any
) {
  console.log(`QB CONNECTION ERROR: ${args.message} (${args.hresult})`);
  lastError = args.message;
  const retVal = "DONE";

  callback({
    connectionErrorResult: { string: retVal },
  });
};

// Handle getLastError requests and return the last error message
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.getLastError = function (
  args: any,
  callback: any
) {
  const retVal = lastError;

  callback({
    getLastErrorResult: { string: retVal },
  });
};

// Handle closeConnection requests
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.closeConnection = function (
  args: any,
  callback: any
) {
  const retVal = "OK";

  callback({
    closeConnectionResult: { string: retVal },
  });
};

// Export the webService and setQBXMLHandler function
module.exports = {
  service: webService,
  setQBXMLHandler: function (handler: any) {
    this.qbXMLHandler = handler;
  },
};
