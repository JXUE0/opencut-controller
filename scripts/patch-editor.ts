import fs from "fs";
import path from "path";

const targetDir = process.argv[2];

if (!targetDir) {
  console.error("❌ Please provide the path to the OpenCut directory.");
  console.log("Usage: pnpm run patch-editor ../OpenCut");
  process.exit(1);
}

const openCutPath = path.resolve(targetDir);

if (!fs.existsSync(openCutPath)) {
  console.error(`❌ Path does not exist: ${openCutPath}`);
  process.exit(1);
}

console.log(`🎬 Patching OpenCut at: ${openCutPath}`);
console.log("");

const PATCH_MARKER = "// opencut-controller:patched";

let patchedAny = false;
let detectedVersion: "legacy" | "modern" | "unknown" = "unknown";

/** Detect OpenCut version by checking file structure */
function detectVersion(): "legacy" | "modern" | "unknown" {
  // Modern: Vite + TanStack Router (no app/ directory, has routes/ + components/ui/)
  const modernIndicators = [
    "apps/web/src/routes/__root.tsx",
    "apps/web/vite.config.ts",
  ];
  // Legacy: Next.js App Router (has app/ directory)
  const legacyIndicators = [
    "apps/web/src/app/layout.tsx",
    "apps/web/src/components/providers/editor-provider.tsx",
    "apps/web/next.config.js",
    "apps/web/next.config.ts",
    "apps/web/next.config.mjs",
  ];

  const modernExists = modernIndicators.some(f => fs.existsSync(path.join(openCutPath, f)));
  const legacyExists = legacyIndicators.some(f => fs.existsSync(path.join(openCutPath, f)));

  if (modernExists && !legacyExists) return "modern";
  if (legacyExists && !modernExists) return "legacy";
  if (modernExists && legacyExists) return "legacy"; // a Next.js config means App Router, whatever else is present
  return "unknown";
}

detectedVersion = detectVersion();

if (detectedVersion === "modern") {
  console.log("🔍 Detected: MODERN OpenCut (Vite + TanStack Router + React 19.2+)");
  console.log("   The auto-patcher has limited support. You may need to manually add exposure hooks.");
  console.log("");
} else if (detectedVersion === "legacy") {
  console.log("🔍 Detected: LEGACY OpenCut (Next.js App Router)");
  console.log("");
} else {
  console.log("⚠️  Could not detect OpenCut version. Attempting legacy patterns...");
  console.log("");
}

// ============================================================
// PATCH 1: Editor Provider / Main Component (exposes __opencut & __stores)
// ============================================================
const editorProviderPaths = [
  // Legacy
  "apps/web/src/components/providers/editor-provider.tsx",
  // Modern - common locations for main editor component
  "apps/web/src/routes/editor.tsx",
  "apps/web/src/routes/editor.$projectId.tsx",
  "apps/web/src/components/editor/EditorProvider.tsx",
  "apps/web/src/components/EditorProvider.tsx",
  "apps/web/src/providers/EditorProvider.tsx",
];

for (const relPath of editorProviderPaths) {
  const fullPath = path.join(openCutPath, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf-8");

    if (!content.includes(PATCH_MARKER) && !content.includes("window.__opencut")) {
      console.log(`📦 Injecting control hooks into ${relPath}...`);

      // Detect import style and add exposure logic
      if (content.includes("useEditorActions") || content.includes("useTimelineStore")) {
        // Legacy-style: has editor object and stores
        const stores: [string, string, string][] = [
          ["panel", "usePanelStore", "@/editor/panel-store"],
          ["preview", "usePreviewStore", "@/preview/preview-store"],
          ["sounds", "useSoundsStore", "@/sounds/sounds-store"],
          ["stickers", "useStickersStore", "@/stickers/stickers-store"],
          ["assets", "useAssetsPanelStore", "@/components/editor/panels/assets/assets-panel-store"],
          ["properties", "usePropertiesStore", "@/components/editor/panels/properties/stores/properties-store"],
          ["keybindings", "useKeybindingsStore", "@/actions/keybindings-store"],
          ["timeline", "useTimelineStore", "@/timeline/timeline-store"],
        ];
        // Skip stores the file already imports to avoid duplicate identifiers
        const missing = stores.filter(([, hook]) => !new RegExp(`import\\s*{[^}]*\\b${hook}\\b`).test(content));
        const imports = missing.map(([, hook, mod]) => `import { ${hook} } from "${mod}";\n`).join("");
        if (!/import\s*{[^}]*\buseEffect\b[^}]*}\s*from\s*"react"/.test(content)) {
          content = `import { useEffect } from "react";\n` + content;
        }

        // Try to find a good place to insert imports
        if (content.includes('} from "@/services/renderer/gpu-renderer";')) {
          content = content.replace('} from "@/services/renderer/gpu-renderer";', `} from "@/services/renderer/gpu-renderer";\n${imports}`);
        } else if (content.includes("import { useEditorActions }")) {
          content = content.replace("import { useEditorActions }", `${imports}import { useEditorActions }`);
        }

        // Expose the store hooks themselves (zustand), not their state: tools call __stores.x.getState()
        const exposureLogic = `
	${PATCH_MARKER}
	useEffect(() => {
		const w = window as any;
		w.__opencut = editor;
		w.__stores = { ${stores.map(([key, hook]) => `${key}: ${hook}`).join(", ")} };
	}, [editor]);
`;

        // Insert after the whole statement line (works with LF and CRLF files)
        const insertionPoints = [/^[ \t]*useKeybindingsListener\(\);[ \t]*\r?$/m, /^[ \t]*useEditorActions\(\);[ \t]*\r?$/m];

        let inserted = false;
        for (const point of insertionPoints) {
          if (point.test(content)) {
            content = content.replace(point, (line) => `${line}\n${exposureLogic}`);
            inserted = true;
            break;
          }
        }

        if (!inserted) {
          console.log(`   ⚠️ Could not find insertion point in ${relPath}. Manual patch needed.`);
        } else {
          fs.writeFileSync(fullPath, content);
          console.log(`✅ ${relPath} patched.`);
          patchedAny = true;
        }
      } else {
        console.log(`   ⚠️ ${relPath} doesn't match expected editor structure. Manual patch needed.`);
      }
    } else {
      console.log(`ℹ️ ${relPath} already has __opencut exposure.`);
    }
    break; // Only patch the first matching file
  }
}

// ============================================================
// PATCH 2: Projects Page (legacy only - Next.js app/projects/page.tsx)
// ============================================================
if (detectedVersion === "legacy") {
  const projectsPagePath = path.join(openCutPath, "apps/web/src/app/projects/page.tsx");
  if (fs.existsSync(projectsPagePath)) {
    let content = fs.readFileSync(projectsPagePath, "utf-8");
    if (!content.includes("__opencut")) {
      console.log("📦 Injecting hooks into projects/page.tsx...");
      const projectExposure = `
	useEffect(() => {
		(window as any).__opencut = editor;
	}, [editor]);
`;
      content = content.replace("}, [editor.project]);", `}, [editor.project]);\n${projectExposure}`);
      fs.writeFileSync(projectsPagePath, content);
      console.log("✅ projects/page.tsx patched.");
      patchedAny = true;
    }
  }
}

// ============================================================
// PATCH 3: Env validation (both versions may have this)
// ============================================================
const envWebPaths = [
  "apps/web/src/env/web.ts",        // Legacy
  "apps/web/src/lib/env.ts",        // Modern possible
  "apps/web/env.ts",                // Modern possible
];

for (const relPath of envWebPaths) {
  const fullPath = path.join(openCutPath, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf-8");
    if (content.includes("z.url()")) {
      console.log(`🛡️ Relaxing environment validation in ${relPath}...`);
      content = content.replace(/z\.url\(\)/g, "z.string().url().optional()");
      content = content.replace(/DATABASE_URL: z\.string\(\)\.refine\([\s\S]*?\r?\n\s*\),/g, "DATABASE_URL: z.string().optional(),");
      content = content.replace(/BETTER_AUTH_SECRET: z\.string\(\),/g, "BETTER_AUTH_SECRET: z.string().optional(),");
      content = content.replace(/UPSTASH_REDIS_REST_TOKEN: z\.string\(\),/g, "UPSTASH_REDIS_REST_TOKEN: z.string().optional(),");
      content = content.replace(/MARBLE_WORKSPACE_KEY: z\.string\(\),/g, "MARBLE_WORKSPACE_KEY: z.string().optional(),");
      content = content.replace(/FREESOUND_CLIENT_ID: z\.string\(\),/g, "FREESOUND_CLIENT_ID: z.string().optional(),");
      content = content.replace(/FREESOUND_API_KEY: z\.string\(\),/g, "FREESOUND_API_KEY: z.string().optional(),");
      fs.writeFileSync(fullPath, content);
      console.log(`✅ ${relPath} relaxed.`);
      patchedAny = true;
    }
    break;
  }
}

// ============================================================
// PATCH 4: React versions in package.json
// ============================================================
const webPackageJsonPath = path.join(openCutPath, "apps/web/package.json");
if (fs.existsSync(webPackageJsonPath)) {
  console.log("⚛️ Setting compatible React versions...");
  const pkg = JSON.parse(fs.readFileSync(webPackageJsonPath, "utf-8"));
  pkg.dependencies.react = "19.2.0";
  pkg.dependencies["react-dom"] = "19.2.0";
  fs.writeFileSync(webPackageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("✅ React versions set to 19.2.0.");
  patchedAny = true;
}

// ============================================================
// PATCH 5: Default .env
// ============================================================
const envPaths = [
  "apps/web/.env",
  "apps/web/.env.local",
  ".env",
];

// Only create a default when no env file exists at all
if (!envPaths.some(p => fs.existsSync(path.join(openCutPath, p)))) {
  const relPath = envPaths[0]!;
  console.log(`📝 Creating default ${relPath}...`);
  const envContent = `
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL="postgresql://opencut:opencut@localhost:5432/opencut"
BETTER_AUTH_SECRET=dummy_secret
`;
  fs.writeFileSync(path.join(openCutPath, relPath), envContent.trim() + "\n");
  console.log(`✅ ${relPath} created.`);
  patchedAny = true;
}

// ============================================================
// MANUAL PATCHING GUIDE FOR MODERN VERSION
// ============================================================
if (detectedVersion === "modern") {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📋 MANUAL PATCHING REQUIRED FOR MODERN OPENCUT");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("The modern OpenCut (Vite + TanStack Router) has a different structure.");
  console.log("You need to manually add this exposure code to your main editor component:");
  console.log("");
  console.log("  // In your editor provider/component (e.g., routes/editor.tsx):");
  console.log("  import { useEffect } from 'react';");
  console.log("  import { useEditorStore } from '@/stores/editor-store';  // or wherever your editor context is");
  console.log("  import { useTimelineStore } from '@/stores/timeline-store';");
  console.log("  import { usePanelStore } from '@/stores/panel-store';");
  console.log("  // ... import other stores you use");
  console.log("");
  console.log("  export function EditorProvider({ children }) {");
  console.log("    const editor = useEditorStore();");
  console.log("    const timeline = useTimelineStore();");
  console.log("    const panel = usePanelStore();");
  console.log("    // ... other stores");
  console.log("");
  console.log("    useEffect(() => {");
  console.log("      const w = window as any;");
  console.log("      w.__opencut = editor;");
  console.log("      w.__stores = {");
  console.log("        editor,");
  console.log("        timeline,");
  console.log("        panel,");
  console.log("        // ... add other stores");
  console.log("      };");
  console.log("    }, [editor, timeline, panel /*, other stores */]);");
  console.log("");
  console.log("    return <>{children}</>;");
  console.log("  }");
  console.log("");
  console.log("The MCP needs these stores exposed:");
  console.log("  - __opencut.editor (or just __opencut with project methods)");
  console.log("  - __stores.timeline (for timeline state)");
  console.log("  - __stores.project (for project list/active)");
  console.log("  - __stores.panel, __stores.preview, __stores.sounds, etc.");
  console.log("");
  console.log("After manual patching, run: pnpm install && pnpm dev");
  console.log("═══════════════════════════════════════════════════════════════");
}

if (patchedAny) {
  console.log("");
  console.log("🎉 Auto-patching completed!");
  console.log("Now run 'pnpm install' and 'pnpm dev' in the OpenCut directory.");
} else {
  console.log("");
  console.log("⚠️ No files were auto-patched.");
  if (detectedVersion === "modern") {
    console.log("   Follow the manual patching guide above.");
  } else {
    console.log("   This may not be a compatible OpenCut version.");
  }
}
