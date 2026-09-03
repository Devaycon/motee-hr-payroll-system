/**
 * The collection-edits key branches are created and edited under.
 *
 * Kept in its own module so `use-locale-data` can read session-created
 * branches without importing the branch hooks — which would pull the
 * permission hooks in behind them and risk an import cycle.
 */
export const BRANCHES_KEY = "branches";
