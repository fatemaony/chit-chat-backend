import { prisma } from "../../db/db.js";
import { NotFoundError } from "../../lib/errors.js";
export function parseThreadListFilter(queryObj) {
    const page = Number(queryObj.page) || 1;
    const rawPageSize = Number(queryObj.pageSize) || 20;
    const pageSize = Math.min(Math.max(rawPageSize, 1), 50);
    const authorHandle = typeof queryObj.author === "string" && queryObj.author.trim()
        ? queryObj.author.trim()
        : undefined;
    const search = typeof queryObj.q === "string" && queryObj.q.trim()
        ? queryObj.q.trim()
        : undefined;
    const sort = queryObj.sort === "old" ? "old" : "new";
    return {
        page,
        pageSize,
        search,
        sort,
        authorHandle,
    };
}
export async function createdThread(params) {
    const { authorUserId, title, body, imageUrl } = params;
    let placeholderCategory = await prisma.category.findFirst({
        orderBy: { id: "asc" }
    });
    if (!placeholderCategory) {
        placeholderCategory = await prisma.category.create({
            data: {
                slug: "general",
                name: "General",
                description: "General category"
            }
        });
    }
    const thread = await prisma.thread.create({
        data: {
            categoryId: placeholderCategory.id,
            authorUserId,
            title,
            body,
            imageUrl: imageUrl ?? null,
        }
    });
    return getThreadById(thread.id);
}
export async function getThreadById(id) {
    const thread = await prisma.thread.findUnique({
        where: { id },
        include: { author: true }
    });
    if (!thread) {
        throw new NotFoundError("Thread not found");
    }
    return {
        id: thread.id,
        title: thread.title,
        body: thread.body,
        imageUrl: thread.imageUrl,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        author: {
            displayName: thread.author.displayName,
            handle: thread.author.handle,
        },
    };
}
export async function findThreadAuthor(threadId) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        select: { authorUserId: true }
    });
    if (!thread) {
        throw new NotFoundError("Thread not found");
    }
    return thread.authorUserId;
}
export async function deleteThreadById(threadId) {
    await prisma.thread.delete({
        where: { id: threadId }
    });
}
export async function updateThreadById(params) {
    const { threadId, title, body, imageUrl } = params;
    await prisma.thread.update({
        where: { id: threadId },
        data: {
            title,
            body,
            imageUrl: imageUrl ?? null,
            updatedAt: new Date()
        }
    });
    return getThreadById(threadId);
}
export async function listThreads(filter) {
    const { page, pageSize, authorHandle, sort, search } = filter;
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const where = {};
    if (authorHandle) {
        where.author = {
            handle: {
                contains: authorHandle,
                mode: "insensitive"
            }
        };
    }
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { body: { contains: search, mode: "insensitive" } }
        ];
    }
    const threads = await prisma.thread.findMany({
        where,
        skip,
        take,
        orderBy: {
            createdAt: sort === "old" ? "asc" : "desc"
        },
        include: {
            author: true
        }
    });
    return threads.map((t) => ({
        id: t.id,
        title: t.title,
        excerpt: t.body.substring(0, 200),
        imageUrl: t.imageUrl,
        createdAt: t.createdAt,
        author: {
            displayName: t.author.displayName,
            handle: t.author.handle,
        }
    }));
}
