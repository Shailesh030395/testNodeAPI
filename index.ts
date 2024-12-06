import server from "./app/server";
import QBXMLHandler from "./app/soap/qb-xml-handler";

server.setQBXMLHandler(QBXMLHandler);
server.run();
