The tutorials below demonstrate basic operations of KIT consumers.

**Outline**

1. How to search KITs.
2. Downloading KITs to your local machine.
3. **(WIP)**: AI-assisted search.
4. **(WIP)**: Getting the live streaming data.
5. **(WIP)**: Redirecting KITs to another endpoint.

## 1. How to search KITs

In the `KIT GUI` sidebar menu, go to `Search KITs`.
This page shows all the assets in the dataspace that are 
1. negotiatable to you (i.e., read access).
2. comply with the RoX KIT format.

The search functionality is implemented based on the federated catalogue.
Therefore, the search result is obtained from every user's catalogue.

You can find KITs with specific values in the metadata using a search query with logical operators.

- `==`
- `!=`
- `<=`
- `>=`
- `>`
- `<`
- `contains`
- `startswith`
- `endswith`

The expression can be concatenated using `and`.

**Examples**:
- `type == classification`
- `type == classification` and `bytesize <= 30000000`

You can use the values in the KIT metadata (including the semantic model) for searching.
When you want to see the metadata of a KIT, look at the table column `Actions`, and click the blue circle button.

## 2. Downloading KITs to your local machine

You can download a KIT by clicking the button (green circle).
This will save the KIT in your machine with:
- File name is the same as `file_name` in the metadata. If not given by the provider, then it uses the `KIT_name` as the file name.
- The saved location in your machine is the folder `KIT_workspace`. It is located in the dicrectory of `Edge-Connector`. If you are running `Edge-Connector` in a container, set the volume mount on `KIT_workspace` so that your host machine can access the downloaded KITs. 

## 3. (WIP) AI-assisted search

WIP ... It is a Gen-AI based approach to generate search query based on your natural language description of the KIT that you are looking for. Theoretically, this AI can be also trained for generating search query from your system state.

## 4. (WIP) Getting the live streaming data

WIP ...

## 5. (WIP) Redirecting KITs to another endpoint

WIP ...