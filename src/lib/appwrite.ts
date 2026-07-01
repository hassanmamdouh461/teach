/**
 * ⚠️  SECURITY WARNING — DEMO / PORTFOLIO ONLY
 *
 * The directCreate / directUpdate / directDelete functions below bypass the
 * Appwrite SDK and call the REST API directly using only the Project ID.
 * There is NO user session token or API key attached to these requests.
 *
 * This means anyone who inspects the JS bundle or network traffic can
 * replicate these requests and read/write/delete any document.
 *
 * For production use:
 *   1. Use Appwrite's SDK with session-based auth (account.createEmailPasswordSession), OR
 *   2. Move write operations to an Appwrite Cloud Function / server-side route.
 *   3. Lock collection permissions to "Users" or specific roles — never "Any".
 */
import { Client, Databases } from 'appwrite';

export const APPWRITE_CONFIG = {
    ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
    PROJECT_ID: '698232950032f12e7895',
    DB_ID: 'restaurant_db',
    COLLECTIONS: {
        MENU: 'menu_items',
        ORDERS: 'orders'
    }
};

const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
    .setProject(APPWRITE_CONFIG.PROJECT_ID);

export const databases = new Databases(client);
export { client };

/**
 * Direct REST API call to Appwrite - bypasses the SDK serializer bug in v22
 * that causes "t.isBigNumber is not a function" errors on PATCH requests.
 */
export async function directUpdate(
    collectionId: string,
    docId: string,
    data: Record<string, unknown>
): Promise<any> {
    const url = `${APPWRITE_CONFIG.ENDPOINT}/databases/${APPWRITE_CONFIG.DB_ID}/collections/${collectionId}/documents/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': APPWRITE_CONFIG.PROJECT_ID,
        },
        body: JSON.stringify({ data }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Direct REST API POST call - bypasses the SDK serializer bug in v22
 * that causes "t.isBigNumber is not a function" errors on createDocument.
 */
export async function directCreate(
    collectionId: string,
    docId: string,
    data: Record<string, unknown>
): Promise<any> {
    const url = `${APPWRITE_CONFIG.ENDPOINT}/databases/${APPWRITE_CONFIG.DB_ID}/collections/${collectionId}/documents`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': APPWRITE_CONFIG.PROJECT_ID,
        },
        body: JSON.stringify({ documentId: docId, data }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Direct REST API DELETE call - bypasses the SDK serializer bug in v22.
 */
export async function directDelete(
    collectionId: string,
    docId: string
): Promise<void> {
    const url = `${APPWRITE_CONFIG.ENDPOINT}/databases/${APPWRITE_CONFIG.DB_ID}/collections/${collectionId}/documents/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            'X-Appwrite-Project': APPWRITE_CONFIG.PROJECT_ID,
        },
    });
    if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || `HTTP ${res.status}`);
    }
}

/**
 * Direct REST API GET call to list documents - bypasses the SDK serializer bug in v22.
 */
export async function directList(
    collectionId: string,
    queries: string[] = []
): Promise<{ documents: any[]; total: number }> {
    let url = `${APPWRITE_CONFIG.ENDPOINT}/databases/${APPWRITE_CONFIG.DB_ID}/collections/${collectionId}/documents`;
    if (queries.length > 0) {
        const queryParams = queries.map((q, idx) => `queries[${idx}]=${encodeURIComponent(q)}`).join('&');
        url += `?${queryParams}`;
    }
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Appwrite-Project': APPWRITE_CONFIG.PROJECT_ID,
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || `HTTP ${res.status}`);
    }
    return res.json();
}

