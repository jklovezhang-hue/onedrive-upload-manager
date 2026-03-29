import { Client } from '@microsoft/microsoft-graph-client';
import type { DriveItem } from '@/types';

/**
 * 创建 Graph Client（带 authProvider）
 */
export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * 获取当前用户信息
 */
export async function getUserProfile(client: Client): Promise<DriveItem['id'] & { displayName: string; mail?: string; userPrincipalName: string; id: string }> {
  return client.api('/me').get();
}

/**
 * 获取 /upload 目录下的子文件夹列表
 * 注意：OneDrive 个人版不支持服务端 filter('folder ne null')，
 * 因此改为获取所有子项后在客户端过滤
 */
export async function listUploadFolders(client: Client): Promise<DriveItem[]> {
  try {
    const response = await client.api('/me/drive/root:/upload:/children').get();
    const allItems: DriveItem[] = response.value ?? [];
    // 客户端过滤：只返回 folder 类型，且排除笔记目录
    return allItems.filter(
      (item) => item.folder != null && item.name !== 'notes'
    );
  } catch (error: unknown) {
    // 如果 /upload 文件夹不存在，返回空数组
    if ((error as { statusCode?: number }).statusCode === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * 确保 /upload 文件夹存在，不存在则创建
 */
export async function ensureUploadFolder(client: Client): Promise<DriveItem> {
  // 首先检查 /upload 文件夹是否已存在
  try {
    return await client.api('/me/drive/root:/upload').get();
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404) {
      // /upload 不存在，创建它
      // 在根目录创建名为 "upload" 的文件夹
      return await client.api('/me/drive/root/children').post({
        name: 'upload',
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail',
      });
    }
    // 其他错误（403, 500 等）直接抛出
    throw error;
  }
}

/**
 * 获取指定文件夹内的所有项目（文件+子文件夹）
 */
export async function listFolderChildren(client: Client, folderId: string): Promise<DriveItem[]> {
  const response = await client.api(`/me/drive/items/${folderId}/children`).get();
  return response.value ?? [];
}

/**
 * 获取指定路径的 DriveItem
 */
export async function getDriveItem(client: Client, path: string): Promise<DriveItem> {
  return client.api(`/me/drive/root:${path}`).get();
}

/**
 * 上传小文件（≤4MB）
 */
export async function uploadSmallFile(
  client: Client,
  parentId: string,
  fileName: string,
  content: Blob | ArrayBuffer,
  conflictBehavior: string = 'rename'
): Promise<DriveItem> {
  return client
    .api(`/me/drive/items/${parentId}:/${fileName}:/content`)
    .header('Content-Type', 'application/octet-stream')
    .query({ '@microsoft.graph.conflictBehavior': conflictBehavior })
    .put(content) as Promise<DriveItem>;
}

/**
 * 更新现有文件的内容（通过 item ID，PUT /content 直接覆盖）
 * 注意：这里不使用 conflictBehavior，因为是直接更新指定 item
 */
export async function updateFileContent(
  client: Client,
  itemId: string,
  content: Blob | ArrayBuffer
): Promise<DriveItem> {
  return client
    .api(`/me/drive/items/${itemId}/content`)
    .header('Content-Type', 'application/octet-stream')
    .put(content) as Promise<DriveItem>;
}

/**
 * 创建分片上传会话
 */
export async function createUploadSession(
  client: Client,
  parentId: string,
  fileName: string,
  conflictBehavior: string = 'rename'
): Promise<{ uploadUrl: string; expirationDateTime: string }> {
  const response = await client
    .api(`/me/drive/items/${parentId}:/${fileName}:/createUploadSession`)
    .post({
      item: {
        '@microsoft.graph.conflictBehavior': conflictBehavior,
      },
    });
  return {
    uploadUrl: response.uploadUrl,
    expirationDateTime: response.expirationDateTime,
  };
}

/**
 * 分片上传（直接发送到 uploadUrl）
 */
export async function uploadChunk(
  uploadUrl: string,
  content: Blob,
  startByte: number,
  endByte: number,
  totalSize: number
): Promise<Response> {
  const slice = content.slice(startByte, endByte);
  return fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(endByte - startByte),
      'Content-Range': `bytes ${startByte}-${endByte - 1}/${totalSize}`,
    },
    body: slice,
  });
}

/**
 * 删除文件或文件夹
 */
export async function deleteItem(client: Client, itemId: string): Promise<void> {
  await client.api(`/me/drive/items/${itemId}`).delete();
}

/**
 * 重命名文件或文件夹
 */
export async function renameItem(client: Client, itemId: string, newName: string): Promise<DriveItem> {
  return client.api(`/me/drive/items/${itemId}`).patch({ name: newName });
}

/**
 * 获取文件下载 URL
 */
export async function getDownloadUrl(client: Client, itemId: string): Promise<string> {
  const item = await client.api(`/me/drive/items/${itemId}`).select(['@microsoft.graph.downloadUrl']).get();
  return item['@microsoft.graph.downloadUrl'];
}

/**
 * 获取文件缩略图 URL
 */
export async function getThumbnail(client: Client, itemId: string, size: string = 'medium'): Promise<string | null> {
  try {
    const response = await client.api(`/me/drive/items/${itemId}/thumbnails`).get();
    const thumbnails = response.value as Array<{ [key: string]: { url: string } }>;
    if (thumbnails && thumbnails.length > 0) {
      return thumbnails[0][size]?.url ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 获取文件夹的子文件夹数量
 */
export async function getFolderChildCount(client: Client, folderId: string): Promise<number> {
  try {
    const response = await client.api(`/me/drive/items/${folderId}/children`).top(1).select('id').get();
    // @odata.count 在支持的情况下返回总数
    return (response as Record<string, unknown>)['@odata.count'] as number ?? 0;
  } catch {
    return 0;
  }
}

/**
 * 获取 /upload 文件夹的 ID
 */
export async function getUploadFolderId(client: Client): Promise<string> {
  const uploadFolder = await client.api('/me/drive/root:/upload').select(['id']).get();
  return uploadFolder.id;
}

/**
 * 在指定父文件夹下创建子文件夹
 */
export async function createSubfolder(
  client: Client,
  parentId: string,
  folderName: string
): Promise<DriveItem> {
  return client.api(`/me/drive/items/${parentId}/children`).post({
    name: folderName,
    folder: {},
    '@microsoft.graph.conflictBehavior': 'rename',
  });
}

/**
 * 在 /upload 下批量创建子文件夹（忽略已存在的）
 */
export async function ensureSubfolders(
  client: Client,
  parentId: string,
  folderNames: string[]
): Promise<DriveItem[]> {
  const results: DriveItem[] = [];
  for (const name of folderNames) {
    try {
      const folder = await createSubfolder(client, parentId, name);
      results.push(folder);
    } catch (error: unknown) {
      // 如果已存在，忽略错误（conflictBehavior: rename 会创建 "name (1)" 等）
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode !== 409 && statusCode !== 400) {
        throw error;
      }
      // 已存在，尝试查找
      try {
        const all = await client.api(`/me/drive/items/${parentId}:/${name}`).get();
        results.push(all);
      } catch {
        // 静默忽略
      }
    }
  }
  return results;
}

// ─────────────────────────────────────────────
// 笔记相关 API（笔记存于 /upload/notes/ 目录）
// ─────────────────────────────────────────────

const NOTES_FOLDER = 'notes';

/** 通用的重试逻辑（用于应对 OneDrive 503 临时错误） */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      const isRetryable = statusCode === 503 || statusCode === 429;
      if (i === retries || !isRetryable) throw error;
      // 指数退避
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 500));
    }
  }
  throw new Error('unreachable');
}

/** 确保 /upload/notes 文件夹存在，返回其 DriveItem ID */
export async function ensureNotesFolder(client: Client): Promise<string> {
  const uploadId = await getUploadFolderId(client);

  // 策略：先列出 /upload 下所有子项，找 "notes" 文件夹
  const allItems = await client
    .api(`/me/drive/items/${uploadId}/children`)
    .select(['id', 'name', 'folder'])
    .get();

  const notesItem = (allItems.value as DriveItem[]).find(
    (item) => item.name === NOTES_FOLDER && item.folder != null
  );

  if (notesItem) {
    console.info('[notes] found existing notes folder:', notesItem.id);
    return notesItem.id;
  }

  // 不存在则创建
  try {
    const folder = await client
      .api(`/me/drive/items/${uploadId}/children`)
      .post({
        name: NOTES_FOLDER,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail',
      });
    console.info('[notes] created notes folder:', (folder as DriveItem).id);
    return (folder as DriveItem).id;
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    // 如果 409（已存在），重新查找
    if (statusCode === 409) {
      const retryItems = await client
        .api(`/me/drive/items/${uploadId}/children`)
        .select(['id', 'name', 'folder'])
        .get();
      const existing = (retryItems.value as DriveItem[]).find(
        (item) => item.name === NOTES_FOLDER && item.folder != null
      );
      if (existing) return existing.id;
    }
    // 其他错误打印日志并抛出
    console.error('[notes] ensureNotesFolder error:', error);
    throw error;
  }
}

/** 列出 /upload/notes 下所有 .md 文件 */
export async function listNotes(client: Client): Promise<DriveItem[]> {
  try {
    const notesFolderId = await ensureNotesFolder(client);
    // OneDrive 个人版不支持 $filter=file/mimeType，改在客户端过滤
    const response = await client
      .api(`/me/drive/items/${notesFolderId}/children`)
      .select(['id', 'name', 'lastModifiedDateTime', 'size'])
      .get();
    const mdFiles = (response.value ?? []).filter(
      (item: DriveItem) => !item.folder && item.name.toLowerCase().endsWith('.md')
    );
    // 按最后修改时间倒序
    mdFiles.sort((a: DriveItem, b: DriveItem) => {
      const ta = a.lastModifiedDateTime ? new Date(a.lastModifiedDateTime).getTime() : 0;
      const tb = b.lastModifiedDateTime ? new Date(b.lastModifiedDateTime).getTime() : 0;
      return tb - ta;
    });
    console.info('[notes] listNotes success, count:', mdFiles.length);
    return mdFiles;
  } catch (error: unknown) {
    console.error('[notes] listNotes error:', error);
    throw error;
  }
}

/** 获取单个笔记内容（通过 @microsoft.graph.downloadUrl） */
export async function getNoteContent(client: Client, noteItemId: string): Promise<string> {
  return withRetry(async () => {
    const item = await client
      .api(`/me/drive/items/${noteItemId}`)
      .select(['@microsoft.graph.downloadUrl'])
      .get();
    const downloadUrl = (item as Record<string, unknown>)['@microsoft.graph.downloadUrl'] as string;
    const resp = await fetch(downloadUrl);
    if (!resp.ok) throw new Error(`Failed to download: ${resp.status}`);
    return resp.text();
  });
}

/** 创建新笔记（PUT /items/{id}/content — 直接上传内容创建文件） */
export async function createNote(client: Client, noteName: string, content: string = ''): Promise<DriveItem> {
  return withRetry(async () => {
    const notesFolderId = await ensureNotesFolder(client);
    const fileName = `${noteName}.md`;
    const blob = new Blob([content], { type: 'text/markdown; charset=utf-8' });

    // 正确端点：/items/{parent-id}/children/{name}/content
    // 或者用 path 语法: /items/{parent-id}:/{name}:/content
    const result = await client
      .api(`/me/drive/items/${notesFolderId}:/${encodeURIComponent(fileName)}:/content`)
      .header('Content-Type', 'text/markdown')
      .put(blob) as DriveItem;
    return result;
  });
}

/** 更新笔记内容（PUT /items/{id}/content） */
export async function updateNoteContent(client: Client, noteItemId: string, content: string): Promise<DriveItem> {
  return withRetry(async () => {
    const blob = new Blob([content], { type: 'text/markdown; charset=utf-8' });
    return client
      .api(`/me/drive/items/${noteItemId}/content`)
      .header('Content-Type', 'text/markdown')
      .put(blob) as Promise<DriveItem>;
  });
}

/** 重命名笔记（PATCH 只改 name 字段） */
export async function renameNote(client: Client, noteItemId: string, newName: string): Promise<DriveItem> {
  return withRetry(async () => {
    return renameItem(client, noteItemId, `${newName}.md`);
  });
}

/** 删除笔记 */
export async function deleteNote(client: Client, noteItemId: string): Promise<void> {
  return withRetry(async () => {
    return deleteItem(client, noteItemId);
  });
}