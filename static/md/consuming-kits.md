The tutorials below demonstrate basic operations of KIT consumers.

**Outline**

1. How to search KITs.
2. Downloading KITs to your local machine.
3. **(WIP)**: AI-assisted search.
4. **(WIP)**: Getting the live streaming data.
5. **(WIP)**: Redirecting KITs to another endpoint.

## 1. How to search KITs

The search functionality is implemented based on the federated catalog.
Therefore, the search result is obtained from every user's catalog.

Go to the `Search KITs` menu in the sidebar.
Here, KITs with a contract definition (not just as an asset) are displayed.

Search by a query with logical operators:

- `==`
- `!=`
- `<=`
- `>=`
- `>`
- `<`
- `contains`
- `startswith`
- `endswith`

Multiple expressions can be concatenated using `and`.

Now, try the query `type == classification`. 
Next, try the query `type == classification and bytesize <= 30000000`.

The search engine uses the values in the KIT metadata (including the semantic model).

Each displayed item has the following contents:
- Icon picture
- KIT Name column with
    - KIT Name
    - Version
    - Basic or Composite KIT
    - http type
    - data or service
- Semantic model column contains
    - Semantic model category [Dataset, Service, Hardware, Software]
    - Detailed category, e.g., `Mobile Robot`
- Provider ID
- Description
- Actions
    - Blue button = shows metadata
    - Green button = download
    - Black button = redirect to another endpoint

## 2. Downloading KITs to your local machine

The green button in the `Actions` column downloads the KIT.

Let's download a dataset for an example.

Enter the search query `bpn == BPNLNWF14QKMQ9QE`.
Download the KIT `CIFAR-10 dataset`. 
This will take some time as the file size is around 160 MB.

*Where is the file saved?*
- It is saved at the `Edge-Connector` directory, in the folder `KIT-Workspace`.
- Along with the file, the metadata is also saved in the `metadata.json` file.

*What is the file name?*
- The field `default_file_name` in the metadata is used for the file name. If not given, the KIT name is used, instead.

*What happens after download?*
- The provider maybe provided `postprocessing_cmd` in the metadata. In our CIFAR-10 example, we have `tar -xzf CIFAR-10.tar.gz`.
- Execute this command to process the downloaded KIT file.
- It allows your system to know how to process the file, as suggested by the provider.
- In the future, Edge-Connector will give a choice to the users whether to automatically execute the command or not.
- This feature can also be used for running the downloaded KIT (if runnable).

For running `Edge-Connector` in a container, we suggest to mount the volume `KIT-Workspace` to be shared with the host machine.

Now, you can also download the `Fashion MNIST` dataset or KITs from other providers.

**Important**: Downloading dataset takes much time as they are typically quite big in Gigabytes. Currently, whether the download is being carried is not shown in `KIT GUI`. For this, you need to check the console output of the `Edge-Connector` whether there is no error.

## 3. (WIP) AI-assisted search

WIP ... It is a Gen-AI based approach to generate search query based on your natural language description of the KIT that you are looking for. Theoretically, this AI can be also trained for generating search query from your system state.

## 4. (WIP) Getting the live streaming data

WIP ...

## 5. (WIP) Redirecting KITs to another endpoint

WIP ...