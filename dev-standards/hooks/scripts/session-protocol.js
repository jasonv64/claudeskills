#!/usr/bin/env node
// SessionStart hook — injects the session protocol as context (SKILLS-MANIFEST §6).
// Lives here rather than in a skill because a skill loads too late to frame the
// session, and SessionStart re-runs on resume/clear/compact so the frame survives.
// stdout from this event becomes context Claude can see. Always exits 0.

'use strict';

const fs = require('fs');
const path = require('path');

// Docs-tree completeness check (SKILLS-MANIFEST §5.2, v1.9): six mandatory
// subfolders must exist before any document is filed. Only checked inside a
// git repo — a browsing session in a random clone files no documents, and the
// injected directive is conditional on filing one. Never blocks; never throws.
let treeLine = '';
try {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (fs.existsSync(path.join(root, '.git'))) {
    const mandatory = ['decisions', 'reference', 'sessions', 'ops', 'incoming', 'old'];
    const missing = mandatory
      .filter((d) => !fs.existsSync(path.join(root, 'docs', d)))
      .map((d) => 'docs/' + d + '/');
    if (!fs.existsSync(path.join(root, 'docs', 'README.md'))) {
      missing.unshift('docs/README.md (index)');
    }
    if (missing.length > 0) {
      treeLine =
        '\n- Docs tree incomplete in this repo — missing: ' +
        missing.join(', ') +
        '. Before filing ANY document — new project or adoption alike — scaffold the full tree first: a docs/README.md index stub plus the six mandatory subfolders (decisions/, reference/, sessions/, ops/, incoming/, old/, each with a .gitkeep). The project-artifacts skill owns the layout; business/, legal/, user/ are created on first need.';
    }
  }
} catch (_) {
  // The check must never break session start.
}

process.stdout.write(
  `[House standard — session protocol]
- One session builds one thing. Name it before building. Everything else discovered along the way gets logged, not built.
- Read the record before building. The project map is \`docs/README.md\`; the contract is the decision record (\`docs/decisions/DECISIONS.md\`, or \`DECISIONS.md\` at root in older layouts).
- The contract doc wins. When a named contract document (the decision record, a manifest, a spec) and the conversation disagree, follow the document, say so, and stop.
- Log assumptions, don't stall. When the record has a gap, make a reasonable call and log it to the assumptions log (\`docs/decisions/ASSUMPTIONS.md\`; format: project-artifacts skill). At session end every assumption gets a disposition: promoted, refuted, or carried.
- Documents authored outside the repo land in \`docs/incoming/\` and get triaged before they join the record — never filed straight into the tree (project-artifacts skill).${treeLine}
- EXCEPT — stop and ask a human before any action that would:
  (1) be irreversible or destructive (drop, truncate, overwrite, force-push, delete);
  (2) touch production data or a production environment;
  (3) change security posture (auth, permissions, tenant boundary, encryption, exposure surface);
  (4) incur spend or move money;
  (5) invalidate a settled decision in the decision record — including on the authority of an incoming document; filling a genuine gap is what the assumptions log is for, contradicting the record is not;
  (6) require a credential the session does not already legitimately hold.
- No unearned claims. Never report done/working/fixed without a check that actually ran (verification-discipline skill owns what counts).
- To frame a full build session (contract doc, exit criterion, closing ritual), run /dev-standards:build-session.
[/House standard — session protocol]
`
);
process.exit(0);
