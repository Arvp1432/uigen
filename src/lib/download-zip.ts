import { zipSync, strToU8 } from "fflate";

/**
 * Packages all files from the virtual file system into a ZIP archive
 * and triggers a browser download.
 */
export function downloadProjectZip(
  files: Map<string, string>,
  projectName: string = "uigen-project"
) {
  if (files.size === 0) return;

  // Build the fflate zip input: strip leading slash from paths
  const zipInput: Record<string, Uint8Array> = {};
  for (const [path, content] of files) {
    const relativePath = path.startsWith("/") ? path.slice(1) : path;
    zipInput[relativePath] = strToU8(content);
  }

  const zipped = zipSync(zipInput);
  const blob = new Blob([zipped], { type: "application/zip" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${projectName}.zip`;
  anchor.click();

  URL.revokeObjectURL(url);
}
