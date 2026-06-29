// Company-branch (physical venue) configuration & active-branch resolution.
//
// NOTE: "branch" here means a MatchPoint location (main / dedaena / saburtalo),
// NOT a git branch. The main branch keeps its exact original behaviour; the new
// branches are additive.

export const DEFAULT_BRANCH = "main";

export const BRANCHES = {
  main: { slug: "main", label: "MatchPoint", tableCount: 14, pingPongOnly: false },
  dedaena: { slug: "dedaena", label: "Dedaena", tableCount: 4, pingPongOnly: true },
  saburtalo: { slug: "saburtalo", label: "Saburtalo", tableCount: 4, pingPongOnly: true },
};

// Branch slugs that can appear as a leading URL segment (everything except main).
export const BRANCH_SLUGS = Object.keys(BRANCHES).filter((s) => s !== DEFAULT_BRANCH);

export function isValidBranch(slug) {
  return Object.prototype.hasOwnProperty.call(BRANCHES, slug);
}

export function getBranchConfig(branch) {
  return BRANCHES[branch] || BRANCHES[DEFAULT_BRANCH];
}

// Parse the leading path segment as a branch slug; default to "main".
export function resolveBranchFromPath(pathname = "") {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && BRANCH_SLUGS.includes(seg) ? seg : DEFAULT_BRANCH;
}

// URL prefix for a branch ("" for main, "/dedaena" otherwise).
export function branchPrefix(branch) {
  return branch && branch !== DEFAULT_BRANCH ? `/${branch}` : "";
}

// ─── Active-branch singleton ─────────────────────────────────────────────
// Set once from the URL at the top of render so any data-layer call that is
// not explicitly threaded still targets the right branch.
let activeBranch = DEFAULT_BRANCH;

export function setActiveBranch(branch) {
  activeBranch = isValidBranch(branch) ? branch : DEFAULT_BRANCH;
}

export function getActiveBranch() {
  return activeBranch;
}

// Branch-scoped localStorage key. Main keeps the original (unsuffixed) key so
// existing main data is preserved untouched.
export function branchStorageKey(baseKey, branch = getActiveBranch()) {
  return branch && branch !== DEFAULT_BRANCH ? `${baseKey}__${branch}` : baseKey;
}
