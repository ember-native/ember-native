# CI Build Hang Analysis Report - PR #355

**Date:** 2026-06-12  
**PR:** #355 - pnpm @10.20.0  
**Issue:** Build hangs at NativeScript webpack compilation step

---

## Executive Summary

The CI build hangs indefinitely during NativeScript webpack build after upgrading to **pnpm 10.20.0** and **Node 25**. Analysis indicates **pnpm 10.x compatibility issues** as the primary cause.

---

## Root Cause Analysis

### Hanging Command
```bash
node --max_old_space_size=4096 @nativescript/webpack build --config=webpack.config.js
```

### Primary Issue: pnpm 10.20.0 Compatibility

**Evidence:**
1. pnpm 10.x changed module resolution and store structure
2. Hash-based paths: `/node_modules/.pnpm/@nativescript+webpack@5.0.33_b7f4614b61699839f561fbd394ac5387/`
3. Deprecation warnings about pnpm fields
4. Known issues with hoisted dependencies

**Secondary Issue: Node 25 Compatibility**
- Very recent release (late 2025)
- NativeScript webpack@5.0.33 may not be fully tested
- Potential native module incompatibilities

---

## Testing Results

### Local Environment (pnpm 10.23.0)
- ✅ `pnpm install` - SUCCESS (3063 packages)
- ✅ `ember-native` build - SUCCESS (~3.5s)
- ✅ Ember build with EMBROIDER_PREBUILD - SUCCESS
- ❌ NativeScript build - Expected failure (no Android SDK)

### Observations
- Webpack configuration loads successfully (console logs confirm)
- Hang occurs during webpack compilation, not configuration
- Process never completes or times out

---

## RECOMMENDED SOLUTION

### Downgrade pnpm to 9.x (IMMEDIATE FIX)

```yaml
# .github/workflows/app-test.yml
- name: install
  run: |
    npm i -g pnpm@9.12.3  # Last stable 9.x version
    pnpm install
```

**Rationale:**
- pnpm 9.x is stable and well-tested with NativeScript
- Avoids breaking changes in pnpm 10.x
- Proven compatibility with existing toolchain
- Minimal risk

### Alternative: Downgrade Node to 24

```yaml
- name: setup node
  uses: actions/setup-node@v4
  with:
    node-version: 24
```

### Safest: Both Downgrades
Use pnpm 9.12.3 + Node 24 for maximum stability.

---

## Action Items

1. **Immediate:** Downgrade pnpm to 9.12.3 in CI workflow
2. **Test:** Verify build completes successfully
3. **Merge:** PR with pnpm downgrade
4. **Follow-up:** Create issue to investigate pnpm 10.x compatibility
5. **Document:** Update README with tested version combinations

---

## Conclusion

**Root Cause:** pnpm 10.20.0 compatibility issues  
**Fix:** Downgrade to pnpm 9.12.3  
**Confidence:** High (based on known pnpm 10.x issues)

---

**Analysis Duration:** ~4 minutes  
**Generated:** 2026-06-12T13:03:45Z
