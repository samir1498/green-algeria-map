export interface StorageService {
  /**
   * Uploads a file to object storage and returns the file identifier and URL.
   * @param file - Buffer of the file to upload
   * @param filename - Original filename (used for key)
   * @param mimetype - MIME type of the file
   * @returns Promise with fileId and download URL
   * @throws UploadFileError if upload fails
   */
  uploadFile(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ fileId: string; url: string }>;

  /**
   * Gets the download URL for a stored file.
   * @param fileId - Identifier returned from uploadFile
   * @returns Download URL string
   */
  getFileUrl(fileId: string): string;
}
