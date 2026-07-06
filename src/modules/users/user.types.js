// schema DB vs that we r going to expose to api
export function toUserProfileResponse(profile) {
    const { user, clerkEmail, clerkFullName } = profile;
    return {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: clerkEmail ?? null,
        displayName: user.displayName ?? clerkFullName ?? null,
        handle: user.handle ?? null,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
    };
}
