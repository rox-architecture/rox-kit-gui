

Edge-Connector requires your user certificate files to interact with other user's connectors in DLR dataspace.
You can provide the required files to Edge-Connector through the following steps:

## 1. Create your connector in the DLR dataspace
If you haven't created a connector in the DLR dataspace, you need to create one. 
This should be done only once, and you don't need to do it again.
Login to the DLR dataspace https://vision-x-dataspace.base-x-ecosystem.org/.
Find the `+CREATE` button in the center of the main page.
Select `HTTP Data Source` and give a name to the connector.
You can leave the `HTTP Data Source Configuration` section empty.
Creating a connector can take few minutes.
When the connector is created, you will see the connector displayed in the center of the main page.

## 2. Download certificate files
In the DLR dataspace main page, you can find the button `CERTIFICATE` located at the top right of your screen.
It will download a zip file containing three files.
Unzip them at a safe place.

## 3. Provid certificate files to Edge-Connector
In the `KIT GUI` (frontend), go to the menu `Link certificate files` in the left panel.
Enter your connector name, attach the .crt and .key files from the zip you downloaded, and submit.

## 4. Validation
In the `KIT GUI`, you can validate whether certificate files are passed to Edge-Connector.
Find the `Edge Connector Status` button in the top menu, and click it.
If it shows `green`, it means Edge-Connector can get access token from the DLR dataspace server. 
If it is `orange`, Edge-Connector is running but the certificate files are not received.
If it is `Red`, Edge-Connector is not running. 

