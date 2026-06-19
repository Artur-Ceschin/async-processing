export function extractFileInfo(filePath: string) {
  const pathParts = filePath.split("/");
  const fullFileName = pathParts.pop() ?? "";
  const fileNameParts = fullFileName.split(".");
  const extension = fileNameParts.length > 1 ? fileNameParts.pop() : "";

  return {
    path: pathParts.join("/"),
    fileName: fileNameParts.join("."),
    extension,
  };
}

// extractFileInfo("/uploads/123.png");
// ['uploads', '123.png'];
// fullFileName = 123.png
// Now divide between file and the file extension, using the split() adn the pop to get the last one
