export function mapNotificationsRow(row) {
    return {
        id: row.id,
        type: row.type,
        threadId: row.thread_id,
        createdAt: row.created_at.toISOString(),
        readAt: row.read_at ? row.read_at.toISOString() : null,
        actor: {
            displayName: row.actor_display_name ?? null,
            handle: row.actor_handle ?? null,
        },
        thread: {
            title: row.thread_title ?? "",
        },
    };
}
