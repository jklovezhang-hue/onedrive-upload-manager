import { Client } from '@microsoft/microsoft-graph-client';
import { createUploadSession, uploadChunk, uploadSmallFile } from './graphService';
import { UPLOAD_CONFIG } from '@/utils/constants';
import type { UploadProgress } from '@/types';

type ProgressCallback = (progress: UploadProgress) => void;

/**
 * 上传单个文件，自动判断使用小文件直接上传还是分片上传
 */
export async function uploadFile(
  client: Client,
  parentId: string,
  file: File,
  onProgress?: ProgressCallback,
  conflictBehavior: string = 'rename'
): Promise<void> {
  const totalBytes = file.size;

  if (totalBytes <= UPLOAD_CONFIG.smallFileThreshold) {
    // 小文件直接上传
    await uploadSmallFileWithProgress(client, parentId, file, onProgress, conflictBehavior);
  } else {
    // 大文件分片上传
    await uploadLargeFileWithProgress(client, parentId, file, onProgress, conflictBehavior);
  }
}

/**
 * 小文件上传（带进度）
 */
async function uploadSmallFileWithProgress(
  client: Client,
  parentId: string,
  file: File,
  onProgress?: ProgressCallback,
  conflictBehavior: string = 'rename'
): Promise<void> {
  // 小文件不分片，上传完成前不报告中间进度，只报告开始和完成状态
  onProgress?.({
    fileName: file.name,
    uploadedBytes: 0,
    totalBytes: file.size,
    percentage: 0,
  });

  try {
    await uploadSmallFile(client, parentId, file.name, file, conflictBehavior);
    // 上传完成，报告 100%
    onProgress?.({
      fileName: file.name,
      uploadedBytes: file.size,
      totalBytes: file.size,
      percentage: 100,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * 大文件分片上传（带进度和重试）
 */
async function uploadLargeFileWithProgress(
  client: Client,
  parentId: string,
  file: File,
  onProgress?: ProgressCallback,
  conflictBehavior: string = 'rename'
): Promise<void> {
  const totalSize = file.size;
  const chunkSize = UPLOAD_CONFIG.chunkSize;
  let uploadedBytes = 0;

  // 创建上传会话
  const { uploadUrl } = await createUploadSession(client, parentId, file.name, conflictBehavior);

  // 计算分片数
  const totalChunks = Math.ceil(totalSize / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalSize);
    const slice = file.slice(start, end);

    let retries = 0;
    let success = false;

    while (retries < UPLOAD_CONFIG.maxRetries && !success) {
      try {
        const response = await uploadChunk(uploadUrl, file, start, end, totalSize);

        if (response.ok) {
          const data = await response.json();
          // 如果服务器返回 nextExpectedRanges 或完成状态
          if (data.status === 'completed' || !data.nextExpectedRanges) {
            uploadedBytes = totalSize;
            success = true;
          } else {
            // 更新已上传字节
            uploadedBytes = end;
            success = true;
          }
        } else if (response.status === 409) {
          // 冲突
          throw new Error('File conflict: file already exists');
        } else if (response.status === 202) {
          // 接受但未完成，继续
          uploadedBytes = end;
          success = true;
        } else {
          throw new Error(`Upload failed: ${response.status}`);
        }
      } catch (error) {
        retries++;
        if (retries >= UPLOAD_CONFIG.maxRetries) {
          throw new Error(`Upload failed after ${UPLOAD_CONFIG.maxRetries} retries: ${error}`);
        }
        // 指数退避
        const delay = UPLOAD_CONFIG.initialRetryDelay * Math.pow(UPLOAD_CONFIG.retryBackoffBase, retries - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // 上报进度
    const percentage = Math.round((uploadedBytes / totalSize) * 100);
    onProgress?.({
      fileName: file.name,
      uploadedBytes,
      totalBytes: totalSize,
      percentage,
    });
  }
}

/**
 * 批量上传多个文件
 */
export async function uploadFiles(
  client: Client,
  parentId: string,
  files: File[],
  onFileProgress?: (file: File, progress: UploadProgress) => void,
  onOverallProgress?: (completed: number, total: number) => void,
  conflictBehavior: string = 'rename'
): Promise<{ succeeded: string[]; failed: { file: File; error: string }[] }> {
  const succeeded: string[] = [];
  const failed: { file: File; error: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      await uploadFile(
        client,
        parentId,
        file,
        (progress) => {
          onFileProgress?.(file, progress);
          const completed = succeeded.length + failed.length + (progress.percentage < 100 ? 0 : 1);
          onOverallProgress?.(completed, files.length);
        },
        conflictBehavior
      );
      succeeded.push(file.name);
    } catch (error) {
      failed.push({ file, error: String(error) });
    }
  }

  return { succeeded, failed };
}