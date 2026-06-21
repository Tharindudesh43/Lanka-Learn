import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from "@azure/storage-blob";

function getStorageConfig() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!accountName || !accountKey || !containerName) {
    throw new Error(
      "Azure Storage environment variables are not configured. " +
        "Set AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, " +
        "and AZURE_STORAGE_CONTAINER_NAME."
    );
  }

  return { accountName, accountKey, containerName };
}

function getCredential(): StorageSharedKeyCredential {
  const { accountName, accountKey } = getStorageConfig();
  return new StorageSharedKeyCredential(accountName, accountKey);
}

function getBlobServiceClient(): BlobServiceClient {
  const { accountName } = getStorageConfig();
  const credential = getCredential();
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );
}


export async function generateUploadSasUrl(
  blobName: string,
  contentType?: string
): Promise<{ uploadUrl: string; blobUrl: string }> {
  const { accountName, containerName } = getStorageConfig();
  const credential = getCredential();

 const startsOn = new Date(Date.now() - 2 * 60 * 1000);
 const expiresOn = new Date(startsOn.getTime() + 30 * 60 * 1000);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("cw"),
      startsOn,
      expiresOn,
      contentType,
      protocol: SASProtocol.Https,
    },
    credential
  ).toString();

  const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
  const uploadUrl = `${blobUrl}?${sasToken}`;

  return { uploadUrl, blobUrl };
}

//Generate SAS URL for reading (student)
export function generateReadSasUrl(
  blobName: string,
  expiryMinutes: number = 60
): string {
  const { accountName, containerName } = getStorageConfig();
  const credential = getCredential();

  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + expiryMinutes * 60 * 1000);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn,
      protocol: SASProtocol.Https,
    },
    credential
  ).toString();

  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
}

//Extract blob name from full URL
export function extractBlobName(blobUrl: string): string {
  const { containerName } = getStorageConfig();
  const url = new URL(blobUrl);
  const pathParts = url.pathname.split(`/${containerName}/`);
  return pathParts[1] || blobUrl;
}

//Delete a blob
export async function deleteBlob(blobName: string): Promise<void> {
  const { containerName } = getStorageConfig();
  const blobServiceClient = getBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);
  await blobClient.deleteIfExists();
}

//Generate a unique blob name
export function generateBlobName(
  folder: string,
  originalFileName: string
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalFileName.split(".").pop() || "bin";
  const safeName = originalFileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .substring(0, 50);
  return `${folder}/${safeName}-${timestamp}-${randomSuffix}.${extension}`;
}
