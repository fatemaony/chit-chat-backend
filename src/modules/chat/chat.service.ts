import { prisma } from "../../db/db.js";

export async function listChatUsers(currentUserId: number) {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId }
      }
    });

    const recentMessages = await prisma.directMessage.groupBy({
      by: ['senderUserId', 'recipientUserId'],
      where: {
        OR: [
          { senderUserId: currentUserId, deletedBySender: false },
          { recipientUserId: currentUserId, deletedByRecipient: false }
        ]
      },
      _max: {
        createdAt: true
      }
    });

    const lastActivityMap = new Map<number, Date>();
    for (const rm of recentMessages) {
      const otherId = rm.senderUserId === currentUserId ? rm.recipientUserId : rm.senderUserId;
      const createdAt = rm._max.createdAt;
      if (createdAt) {
        const currentMax = lastActivityMap.get(otherId);
        if (!currentMax || createdAt > currentMax) {
          lastActivityMap.set(otherId, createdAt);
        }
      }
    }

    const mappedUsers = users.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      handle: row.handle,
      avatarUrl: row.avatarUrl,
      lastActivityAt: lastActivityMap.get(row.id)?.toISOString() || null,
    }));

    mappedUsers.sort((a, b) => {
      if (a.lastActivityAt && b.lastActivityAt) {
        return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      }
      if (a.lastActivityAt) return -1;
      if (b.lastActivityAt) return 1;

      const nameA = a.displayName || a.handle || 'User';
      const nameB = b.displayName || b.handle || 'User';
      return nameA.localeCompare(nameB);
    });

    return mappedUsers;
  } catch (err) {
    throw err;
  }
}

export async function listDirectMessages(params: {
  userId: number;
  otherUserId: number;
  limit: number;
  cursor?: number;
}) {
  try {
    const { userId, otherUserId, limit, cursor } = params;
    const setLimit = Math.min(Math.max(limit || 50, 1), 200);

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderUserId: userId, recipientUserId: otherUserId, deletedBySender: false },
          { senderUserId: otherUserId, recipientUserId: userId, deletedByRecipient: false }
        ]
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      take: setLimit,
      include: {
        sender: true,
        recipient: true
      }
    });

    // Prisma returns them in desc order, the original code reversed them to asc order
    messages.reverse();

    return messages.map((row) => ({
      id: row.id,
      senderUserId: row.senderUserId,
      recipientUserId: row.recipientUserId,
      body: row.body,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt.toISOString(),
      sender: {
        displayName: row.sender.displayName,
        handle: row.sender.handle,
        avatarUrl: row.sender.avatarUrl,
      },
      recipient: {
        displayName: row.recipient.displayName,
        handle: row.recipient.handle,
        avatarUrl: row.recipient.avatarUrl,
      },
    }));
  } catch (err) {
    throw err;
  }
}

export async function createDirectMessage(params: {
  senderUserId: number;
  recipientUserId: number;
  body?: string | null;
  imageUrl?: string | null;
}) {
  const { senderUserId, recipientUserId } = params;
  const rawBody = params?.body ?? "";
  const trimmedBody = rawBody.trim();
  const setImageUrl = params?.imageUrl ?? null;

  if (!trimmedBody && !setImageUrl) {
    throw new Error("Message body or image is required");
  }

  const message = await prisma.directMessage.create({
    data: {
      senderUserId,
      recipientUserId,
      body: trimmedBody || null,
      imageUrl: setImageUrl
    },
    include: {
      sender: true,
      recipient: true
    }
  });

  return {
    id: message.id,
    senderUserId: message.senderUserId,
    recipientUserId: message.recipientUserId,
    body: message.body,
    imageUrl: message.imageUrl,
    createdAt: message.createdAt.toISOString(),
    sender: {
      displayName: message.sender.displayName,
      handle: message.sender.handle,
      avatarUrl: message.sender.avatarUrl,
    },
    recipient: {
      displayName: message.recipient.displayName,
      handle: message.recipient.handle,
      avatarUrl: message.recipient.avatarUrl,
    },
  };
}

export async function clearDirectMessages(params: {
  userId: number;
  otherUserId: number;
}) {
  const { userId, otherUserId } = params;

  // Mark messages sent by the user as deleted by sender
  await prisma.directMessage.updateMany({
    where: {
      senderUserId: userId,
      recipientUserId: otherUserId,
    },
    data: {
      deletedBySender: true,
    },
  });

  // Mark messages received by the user as deleted by recipient
  await prisma.directMessage.updateMany({
    where: {
      senderUserId: otherUserId,
      recipientUserId: userId,
    },
    data: {
      deletedByRecipient: true,
    },
  });

  return { success: true };
}
