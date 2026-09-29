# Contributing

For substantial functionality, use this sequence:

**Inspect → Research → Verify license → Understand → Integrate → Build → Test → Verify**

Before adding custom code for a generic problem:

1. define exactly what the feature must do;
2. search official repositories/package registries/documentation for established solutions;
3. verify maintenance, compatibility, security considerations, dependency burden, and license;
4. decide whether the project should be a dependency, API, adapter, component, fork, or architectural reference;
5. integrate the smallest necessary boundary;
6. record significant reuse in `OPEN_SOURCE_COMPONENTS.md`;
7. run `npm run check`.

Do not copy public source merely because it is visible. Do not weaken RLS, type checking, validation, or security controls to make a build pass.

Generated application bundles are not considered verified until their own verification commands run in an isolated execution environment.
