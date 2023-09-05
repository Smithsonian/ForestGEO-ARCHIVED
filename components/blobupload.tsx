import { ParsedFile } from '@anzp/azure-function-multipart/dist/types/parsed-file.type';
import { BlobServiceClient } from '@azure/storage-blob';
require('dotenv').config();
const blobUrl: string = process.env.AZURE_STORAGE_CONNECTION_STRING!;
if (!blobUrl) {
  throw new Error('No string attached!');
}


const blobServiceClient = BlobServiceClient.fromConnectionString(blobUrl);
const containers: {name: string; nameShort: string}[] = [];
const listContainers = async () => {
  for await (const container of blobServiceClient.listContainers()) {
    // figure out how to use metadata, for now using names to compare
    const containerName = container.name;
    const containerNameShort = containerName.replace(/[^a-z0-9]/gi, '');
    
    containers.push(
      { name: containerName, nameShort: containerNameShort });
  }
};

const uploadFiles = async (acceptedFilesList: ParsedFile[], plot: string) => {
  try {
    await listContainers();
    const plotReplaced = plot.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const found = containers.find((container) => container.nameShort === plotReplaced);
    if (found) {
      const containerForUpload = found.name;
      
      for (const file of acceptedFilesList) {
        const containerClient =
          blobServiceClient.getContainerClient(containerForUpload);
        const blobName = file.filename;
        const blobClient = containerClient.getBlockBlobClient(blobName);
        
        const uploadOptions = {
          metadata: {
            date: (new Date()).toDateString(),
          },
          tags: {
            plot: plot,
            uploadedOn: (new Date()).toDateString(),
          }
        }
        const uploadBlob = await blobClient.upload(file.bufferFile, file.bufferFile.length, uploadOptions);
      }
    } else {
      console.log('Plot ', plot, 'does not exist');
      alert('Plot ' + plot + ' does not exist');
    }
  } catch (e) {
    console.log(e);
  }
};

export { uploadFiles };