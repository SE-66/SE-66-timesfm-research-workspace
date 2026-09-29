# GitHub Repository

The current repository is:

`SE-66/SE-66-timesfm-research-workspace`

The repository name is historical from the discarded prototype. The application itself is now **Open Source App Builder**. Rename the repository later if desired; no application code depends on the current repository name except documentation/source links.

## Branch workflow

- `main` is the Cloudflare production branch.
- Use feature branches and pull requests for substantial future changes.
- `.github/workflows/ci.yml` runs the repository verification/test/build commands on pushes and PRs.

## Generated projects

The current builder downloads source bundles as ZIP/JSON. It does not yet create arbitrary new GitHub repositories from inside the deployed application because that requires a separate authenticated GitHub write integration and repository-creation permission boundary.

Do not expose a personal access token in browser code. A future GitHub export adapter should use OAuth/GitHub App credentials stored server-side and scope permissions narrowly.
