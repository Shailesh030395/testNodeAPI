import envConfig from "../../envConfig";
import soapRepository from "../soap/soapRepository";

class InvoiceService {
  async upsertInvoice(invoiceRetArray: any[], companyId: string) {
    const itemInventoryArray: any = await soapRepository.getAllItemInventory();
    console.log("itemInventoryArray", itemInventoryArray[0]);

    const mappedInvoices = invoiceRetArray.flatMap((invoice) => {
      const { TxnNumber, RefNumber, TxnDate, CustomerRef, InvoiceLineRet } =
        invoice;

      // Handle multiple InvoiceLineRet cases
      const lines = Array.isArray(InvoiceLineRet)
        ? InvoiceLineRet
        : [InvoiceLineRet];

      // Map each InvoiceLineRet entry
      return lines.flatMap((line) => {
        const { ItemRef, Desc, SerialNumber } = line;

        // If SerialNumber contains commas, split it
        const serialNumbers = SerialNumber?.split(",");

        // Create a separate object for each serial number
        return serialNumbers?.map((serial) => ({
          invoiceNumber: TxnNumber ?? "", // Default to an empty string if null or undefined
          invoiceReferenceNumber: RefNumber ?? "",
          invoiceDate: TxnDate ?? "",
          itemName: ItemRef?.FullName ?? "", // Use optional chaining in case ItemRef is undefined or null
          itemDesc: Desc ?? "",
          serialNumber: serial?.trim() ?? "", // Safely check if serial exists before trimming
          customerName: CustomerRef?.FullName,
          invoiceData: JSON.stringify(invoice) ?? "{}", // Default to an empty JSON object if undefined
          countryCode: CustomerRef?.FullName?.includes("-")
            ? CustomerRef.FullName.split("-")[0].trim()
            : invoice?.ShipAddress?.State ?? "", // Check if invoice and ShipAddress exist
        }));
      });
    });

    const filteredInvoices = mappedInvoices.filter(
      (invoice) => invoice !== null && typeof invoice === "object"
    );

    console.log("filteredInvoices", filteredInvoices);
    // Loop through each mapped invoice and upsert product warranty details
    for (const invoice of filteredInvoices) {
      console.log("invoice", invoice);
      const matchingItem = itemInventoryArray.find(
        (item: any) =>
          item?.fullName.trim().toLowerCase() ===
          invoice?.itemName.trim().toLowerCase()
      );
      console.log("matchingItem", matchingItem);
      const warrantyDetails = await soapRepository.upsertProductWarrantyDetails(
        {
          invoiceNumber: invoice?.invoiceNumber || "",
          invoiceReferenceNumber: invoice?.invoiceReferenceNumber || "",
          invoiceDate: new Date(invoice?.invoiceDate),
          itemName: invoice?.itemName || "",
          itemDesc: invoice?.itemDesc || "",
          serialNumber: invoice?.serialNumber || "",
          customerName: invoice?.customerName || "",
          invoiceData: JSON.parse(invoice?.invoiceData), // Parsing back to object
          companyId: companyId, // Replace with actual company ID if available
          productCategory: matchingItem?.category, // Replace with dynamic category if available
          countryCode: invoice?.countryCode || "",
          expiryDate: null, // Replace with actual expiry date if available
          extendedWarrantyMonths: 0, // Set based on your business logic
          extendedBy: 1, // Set based on your business logic
        },
        envConfig.companyId
      );
    }
  }
}

export default new InvoiceService();
