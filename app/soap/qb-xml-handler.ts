import xml2js from "xml2js";
import soapRepository from "./soapRepository";
import invoiceService from "../services/invoiceService";
import envConfig from "../../envConfig";
import dayjs from "dayjs";

// import qbdRepository from "../../app/repositories/qbdRepository";
// import moment from "moment-timezone";
var data2xml = require("data2xml");
const convert = data2xml({
  xmlHeader:
    '<?xml version="1.0" encoding="utf-8"?>\n<?qbxml version="13.0"?>\n',
});

interface QBXMLResponse {
  [key: string]: any;
}

interface IQBXMLHandler {
  fetchRequests(callback: (err: any, requestArray: string[]) => void): void;
  handleResponse(response: QBXMLResponse): void;
  didReceiveError(error: QBXMLResponse): void;
}
const requests: string[] = [];
let itemsToCreate = [];

async function buildRequests(
  callback: (err: any, requestArray: string[]) => void
): Promise<void> {
  // // Set the time zone
  // const tz = 'Asia/Kolkata'; // Change the time zone as needed

  // // Get the current date and time in the specified time zone
  // const fromDateTime = moment((await qbdRepository.getLastSyncDate())
  //   .lastModifiedDate).subtract(1, 'day').tz(tz);

  // // Format the date
  // const formattedFromDate = (await qbdRepository.getLastSyncDate())
  //   .lastModifiedDate ? fromDateTime.format('YYYY-MM-DD') : '';

  const xml = convert("QBXML", {
    QBXMLMsgsRq: {
      _attr: { onError: "stopOnError" },
      ItemInventoryQueryRq: {
        _attr: { iterator: "Start", requestID: "1003" },
        MaxReturned: 1000,
        OwnerID: "0",
      },
    },
  });
  const ItemInventoryAssemblyXml = convert("QBXML", {
    QBXMLMsgsRq: {
      _attr: { onError: "stopOnError" },
      ItemInventoryAssemblyQueryRq: {
        _attr: { iterator: "Start", requestID: "1004" },
        MaxReturned: 1000,
        OwnerID: "0",
      },
    },
  });
  const inventorySiteXml = convert("QBXML", {
    QBXMLMsgsRq: {
      _attr: { onError: "stopOnError" },
      ItemSitesQueryRq: {
        _attr: { requestID: "1005", iterator: "Start" },
        ItemSiteFilter: {
          SiteFilter: {
            FullName: process.env.ITEM_SITE_NAME || "Onsite",
          },
        },
        MaxReturned: 1000,
      },
    },
  });

  const lastSync = await soapRepository.getLastWarrantySyncDate();

  const invoiceXml = convert("QBXML", {
    QBXMLMsgsRq: {
      _attr: { onError: "stopOnError" },
      InvoiceQueryRq: {
        _attr: { requestID: "1006", iterator: "Start" },
        MaxReturned: 1000,
        ModifiedDateRangeFilter: {
          FromModifiedDate: lastSync.lastModifiedDate
            ? dayjs(lastSync.lastModifiedDate)
                .subtract(1, "day")
                .format("YYYY-MM-DDTHH:mm:ss")
            : "",
        },
        IncludeLineItems: true,
      },
    },
  });

  requests.push(xml);
  requests.push(ItemInventoryAssemblyXml);
  requests.push(invoiceXml);
  requests.push(inventorySiteXml);

  console.log("requests", requests);
  callback(null, requests);
}

const QBXMLHandler: IQBXMLHandler = {
  fetchRequests: buildRequests,
  handleResponse: (response: QBXMLResponse) => {
    (async () => {
      try {
        await refreshQuantity(response);
      } catch (error) {
        console.error("Error parsing XML:", error);
      }
    })();
  },
  didReceiveError: (error: QBXMLResponse) => {
    console.log("error: ", error);
  },
};

const parseXmlToJson = (xmlString: xml2js.convertableToString) => {
  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser({ explicitArray: false });
    parser.parseString(xmlString, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const refreshQuantity = async (xmlString: QBXMLResponse) => {
  // Parse the XML string into a JSON object
  const parsedXml = (await parseXmlToJson(xmlString)) as {
    QBXML: {
      QBXMLMsgsRs: {
        ItemInventoryQueryRs?: any;
        ItemSitesQueryRs?: any;
        ItemInventoryAssemblyQueryRs?: any;
        InvoiceQueryRs?: any;
      };
    };
  };

  // Destructure the relevant properties from the parsed XML
  const {
    ItemSitesQueryRs,
    ItemInventoryQueryRs,
    ItemInventoryAssemblyQueryRs,
    InvoiceQueryRs,
  } = parsedXml.QBXML.QBXMLMsgsRs;

  // Array to store all the items to be created/updated

  // Step 1: Process ItemInventoryQueryRs response
  if (ItemInventoryQueryRs) {
    const itemInventoryRetArray = Array.isArray(
      ItemInventoryQueryRs.ItemInventoryRet
    )
      ? ItemInventoryQueryRs.ItemInventoryRet
      : [ItemInventoryQueryRs.ItemInventoryRet];

    const ItemInventoryQueryRs$ = ItemInventoryQueryRs["$"];

    if (ItemInventoryQueryRs$.iteratorRemainingCount > 0) {
      const additionalItemInventoryXml = convert("QBXML", {
        QBXMLMsgsRq: {
          _attr: { onError: "stopOnError" },
          ItemInventoryQueryRq: {
            _attr: {
              requestID: ItemInventoryQueryRs$.requestID,
              iteratorID: ItemInventoryQueryRs$.iteratorID,
              iterator: "Continue",
            },
            MaxReturned: 1000,
            OwnerID: "0",
          },
        },
      });
      requests.push(additionalItemInventoryXml);
    }
    console.log("itemInventoryRetArray", itemInventoryRetArray[2]);

    if (itemInventoryRetArray.length) {
      // Log the item inventory data
      await soapRepository.createLog({
        entityName: "ItemInventory",
        data: JSON.stringify(itemInventoryRetArray),
      });
      // Add the item inventory data to the itemsToCreate array
      itemsToCreate.push(...itemInventoryRetArray);
    }
  }

  if (InvoiceQueryRs) {
    const invoiceRetArray = Array.isArray(InvoiceQueryRs.InvoiceRet)
      ? InvoiceQueryRs.InvoiceRet
      : [InvoiceQueryRs.InvoiceRet];
    if (invoiceRetArray.length && invoiceRetArray[0] != undefined) {
      // Log the item inventory assembly data
      await soapRepository.createLog({
        entityName: "Invoice",
        data: JSON.stringify(invoiceRetArray),
      });
      await invoiceService.upsertInvoice(invoiceRetArray, envConfig.companyId);

      // Add the item inventory assembly data to the itemsToCreate array
    }
  }

  // Step 2: Process ItemInventoryAssemblyQueryRs response
  if (ItemInventoryAssemblyQueryRs) {
    const itemInventoryAssemblyRetArray = Array.isArray(
      ItemInventoryAssemblyQueryRs.ItemInventoryAssemblyRet
    )
      ? ItemInventoryAssemblyQueryRs.ItemInventoryAssemblyRet
      : [ItemInventoryAssemblyQueryRs.ItemInventoryAssemblyRet];

    const ItemInventoryAssemblyQuery$ = ItemInventoryAssemblyQueryRs["$"];
    if (ItemInventoryAssemblyQuery$.iteratorRemainingCount > 0) {
      const additionalItemInventoryAssemblyXml = convert("QBXML", {
        QBXMLMsgsRq: {
          _attr: { onError: "stopOnError" },
          ItemInventoryAssemblyQueryRq: {
            _attr: {
              requestID: ItemInventoryAssemblyQuery$.requestID,
              iteratorID: ItemInventoryAssemblyQuery$.iteratorID,
              iterator: "Continue",
            },
            MaxReturned: 1000,
            OwnerID: "0",
          },
        },
      });
      requests.push(additionalItemInventoryAssemblyXml);
    }

    if (itemInventoryAssemblyRetArray.length) {
      // Log the item inventory assembly data
      await soapRepository.createLog({
        entityName: "ItemInventoryAssembly",
        data: JSON.stringify(itemInventoryAssemblyRetArray),
      });
    }
  }

  // Step 3: Process ItemSitesQueryRs response
  if (ItemSitesQueryRs) {
    const itemSitesArray = Array.isArray(ItemSitesQueryRs.ItemSitesRet)
      ? ItemSitesQueryRs.ItemSitesRet
      : [ItemSitesQueryRs.ItemSitesRet];
    const ItemSitesQueryRs$ = ItemSitesQueryRs["$"];
    if (
      ItemSitesQueryRs$?.iteratorRemainingCount !== undefined &&
      ItemSitesQueryRs$.iteratorRemainingCount !== 0
    ) {
      const additionalInventorySiteXml = convert("QBXML", {
        QBXMLMsgsRq: {
          _attr: { onError: "stopOnError" },
          ItemSitesQueryRq: {
            _attr: {
              requestID: ItemSitesQueryRs$.requestID,
              iteratorID: ItemSitesQueryRs$.iteratorID,
              iterator:
                ItemSitesQueryRs$.iteratorRemainingCount > 0
                  ? "Continue"
                  : "Stop",
            },
            ItemSiteFilter: {
              SiteFilter: {
                FullName: process.env.ITEM_SITE_NAME || "Onsite",
              },
            },
            MaxReturned: 1000,
          },
        },
      });
      requests.push(additionalInventorySiteXml);
    }
    requests.splice(0, 3);

    if (itemSitesArray.length) {
      // Log the item site data
      await soapRepository.createLog({
        entityName: "ItemSite",
        data: JSON.stringify(itemSitesArray),
      });

      // console.log(itemSitesArray)
      // Iterate over each item in the itemsToCreate array
      itemsToCreate.forEach((item, index) => {
        const fullName = item.FullName;
        // Filter the site details for the current item based on the full name
        const siteItem = itemSitesArray.find(
          (siteItem) =>
            siteItem?.ItemInventoryRef?.FullName === fullName ||
            siteItem?.ItemInventoryAssemblyRef?.FullName === fullName
        );
        // If site details are found, create the InventorySiteDetails array
        if (siteItem) {
          const inventorySiteRef = {
            ...siteItem.InventorySiteRef,
            QuantityOnHand: siteItem.QuantityOnHand,
            QuantityOnSalesOrders: siteItem.QuantityOnSalesOrders,
          };

          // If there is an InventorySiteLocationRef, add it to the inventorySiteRef object
          if (siteItem.InventorySiteLocationRef) {
            inventorySiteRef.InventorySiteLocationRef =
              siteItem.InventorySiteLocationRef;
          }
          item.InventorySiteDetails = inventorySiteRef;
        }
      });
    }
    await soapRepository.createLog({
      entityName: "UpdateItemInventorySiteArray",
      data: JSON.stringify(itemsToCreate),
    });
    // const filteredData = itemsToCreate.filter(item => item.InventorySiteDetails !== undefined);
    const filteredData = itemsToCreate.reduce((uniqueItems, currentItem) => {
      const existingItemIndex = uniqueItems.findIndex(
        (item) => item.FullName === currentItem.FullName
      );

      if (existingItemIndex === -1) {
        // If the item is not in the uniqueItems array, add it
        uniqueItems.push(currentItem);
      } else if (currentItem.InventorySiteDetails !== undefined) {
        // If the item is already in the uniqueItems array but the currentItem has InventorySiteDetails defined, replace the existing item
        uniqueItems[existingItemIndex] = currentItem;
      }

      return uniqueItems;
    }, []);
    console.log(
      "************************** ITEMS LENGTH *******************************"
    );
    console.log(itemsToCreate.length);
    console.log("********************* END *******************");
    itemsToCreate = filteredData;
    await soapRepository.createLog({
      entityName: "filteredData",
      data: JSON.stringify(filteredData),
    });
    // const filteredData = itemsToCreate
    //   .reduce((uniqueItems, currentItem) => {
    //     // Check if currentItem has InventorySiteDetails defined or if there's no matching FullName in uniqueItems
    //     if (currentItem.InventorySiteDetails !== undefined || !uniqueItems.some(item => item.FullName === currentItem.FullName)) {
    //       // If so, add the item to uniqueItems
    //       uniqueItems.push(currentItem);
    //     }
    //     return uniqueItems;
    //   }, []);
    // console.log('filteredData', filteredData);

    console.log(
      "************************** Filtered ITEMS LENGTH *******************************"
    );
    console.log(itemsToCreate.length);
    console.log("********************* END *******************");
    for (const item of itemsToCreate) {
      if (Array.isArray(item.DataExtRet)) {
        // If DataExtRet is an array, find the Product Category and take its value
        const productCategory = item.DataExtRet.find(
          (dataExt) => dataExt.DataExtName === envConfig.categoryDataFieldName
        );
        if (productCategory) {
          item.ProductCategory = productCategory.DataExtValue;
        }
      } else if (typeof item.DataExtRet === "object") {
        // If DataExtRet is a single object, check if it has Product Category and assign its value
        if (item.DataExtRet.DataExtName === envConfig.categoryDataFieldName) {
          item.ProductCategory = item.DataExtRet.DataExtValue;
        }
      }

      await soapRepository.createItemInventory(item);
    }
  }
};

export default QBXMLHandler;
