The tutorials below demonstrate basic operations of KIT providers.

**Outline**

1. Creating a Basic KIT (CIFAR-10 dataset)
2. Management: Inspect, contract, and delete your KITs
3. **(WIP)** Creating a Composite KIT (AI-based digital twin robot training)

Open this page as a new tab in the browser while following the step-by-step guides.

## 1. Creating a Basic KIT (CIFAR-10 dataset example)

We will create a Basic KIT with a famous open source dataset `CIFAR-10` (reference: https://www.cs.toronto.edu/~kriz/cifar.html). 
For this, we use the URL https://www.cs.toronto.edu/~kriz/cifar-10-binary.tar.gz.
Accessing this URL will download the compressed data file.

In the `KIT GUI` left panel menu, go to `Provide > Basic KIT`. 

1. In the `General Information` box, you enter the general description. For example:
    - KIT Name = CIFAR-10 Dataset
    - Version = 1.0.0 
    - Tag = Object detection
    - Short Description = The dataset contains 60000 images of 10 classes, 6000 per class.
    - Business Value = (empty)
    - Vision / Mission = (emtpy)
    - License = Creative Commons Attribution 4.0
    - Contact Point = (empty)
2. In the `Asset Location` box,
    - Select **HTTP** 
    - Choose **GET**
    - Enter the URL `https://www.cs.toronto.edu/~kriz/cifar-10-binary.tar.gz`.
    - Leave the `Request Headers` empty. If you need a token to access, you can add `Authorization: Bearer <token>`.
    - Leave the `Content-Type` as *None* because it is a GET request.
    - Also leave empty in the `Request body JSON schema`. The request body schema tell consumers what inputs must be provided when using your KIT (e.g., if it is a service endpoint).
3. In the `Semantic Model Description` box, 
    - Select `Dataset`, and click `Generate Schema`.
    - Do not change `category` and `model` fields. Fill-in other fields.
    - You can copy and paste the below example text.

**Mandatory field**:
```json
{
  "category": "dataset",
  "model": "dataset",
  "informationSensitivityClassification": "Public",
  "type": "Image",
  "dataFormat": "Binary fixed-length records (.bin)",
  "isDataproduct": true,
  "byteSize": 171000000
}
```

**Optional field**:
```json
{
  "dataTypeSchema": "https://www.cs.toronto.edu/~kriz/cifar.html",
  "checksum": "c32a1d4ab5d03f1284b67883e8d87530",
  "endpointDescription": "CIFAR-10 binary version containing 60,000 labeled 32×32 color images stored as fixed-length binary records for image classification benchmarking.",
  "endpointURL": "",
  "protocol": "HTTPS",
  "dataProductOwner": "Canadian Institute for Advanced Research (CIFAR) / University of Toronto"
}
```

4. In the `Thumbnail Image` box, you can select an image in your drive. The image is encoded into text. This step is optional. The generated text is added in the metadata and used as an icon of your KIT.  
5. In the `Submission` box, 
  - select *Data* because it is data.
  - Give the file name as `CIFAR-10.tar.gz`.
  - Post processing tells the consumer how to process the downloaded KIT. In our case, write down `tar -xzf CIFAR-10.tar.gz`.
6. Click the submit button.

After the successful creation, you should be able to see the KIT in `Management > My KITs (Assets)` in the sidebar menu.
This menu is explained in the next section.

## 2. Management: Inspect, define contracts, and delete your KITs

A created KIT can be managed in the left panel menu `Management > My KITs (Assets)`.
Your created KIT is initially an asset without any policy attached. Therefore, not visible to other users.

Each displayed box represent a KIT, and there are three buttons.
The first button is to `show` the metadata of your KIT. 
In the textbox, you can also edit the metadata (adding, deleting, changing values).

The middle button is to `make contract` from this KIT by attaching a policy.
You need to give a name of the policy, which can be found in the sidebar menu `Management > Show Policies`.

The last button is to `delete` the KIT. 
Note that, if your KIT is already negotiated and exchanged with another user, you cannot delete the asset.

## 3. Creating a Composite KIT (AI-based digital twin robot training)

WIP...

