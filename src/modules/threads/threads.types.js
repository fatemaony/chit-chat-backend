export function mapThreadDetailRow(row) {
    return {
        id: row.id,
        title: row.title,
        body: row.body,
        imageUrl: row.image_url ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        author: {
            displayName: row.author_display_name,
            handle: row.author_handle,
        },
    };
}
export function mapThreadSummaryRow(row) {
    return {
        id: row.id,
        title: row.title,
        excerpt: row.excerpt,
        imageUrl: row.image_url ?? null,
        createdAt: row.created_at,
        author: {
            displayName: row.author_display_name,
            handle: row.author_handle,
        },
    };
}
