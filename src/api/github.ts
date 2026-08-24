import { api, unwrap } from '@/lib/api'
import type { GitHubProfile } from '@/types'

/**
 * Resolves the linked GitHub account from its stable numeric user ID. The backend answers with the
 * login and profile URL GitHub currently reports, so the reference survives a username change.
 */
export const getGitHubProfile = () => unwrap(api.get<GitHubProfile>('/github/profile'))
