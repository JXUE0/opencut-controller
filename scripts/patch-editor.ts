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
console.log("⚠️  IMPORTANT: This patch script is designed for the LEGACY Next.js version of OpenCut.");
console.log("   The current OpenCut repo (github.com/OpenCut-app/OpenCut) is a complete rewrite");
console.log("   using Vite + TanStack Router + React 19.2.0, and is NOT compatible with this MCP server.");
console.log("   You need the legacy OpenCut version that uses Next.js App Router.");
console.log("");

let patchedAny = false;

// 1. Patch apps/web/src/components/providers/editor-provider.tsx
const editorProviderPath = path.join(openCutPath, "apps/web/src/components/providers/editor-provider.tsx");
if (fs.existsSync(editorProviderPath)) {
  let content = fs.readFileSync(editorProviderPath, "utf-8");

  if (!content.includes("window.__opencut")) {
    console.log("📦 Injecting control hooks into editor-provider.tsx...");

    // Add imports
    const imports = `import { usePanelStore } from "@/editor/panel-store";
import { usePreviewStore } from "@/preview/preview-store";
import { useSoundsStore } from "@/sounds/sounds-store";
import { useStickersStore } from "@/stickers/stickers-store";
import { useAssetsPanelStore } from "@/components/editor/panels/assets/assets-panel-store";
import { usePropertiesStore } from "@/components/editor/panels/properties/stores/properties-store";
import { useKeybindingsStore } from "@/keybindings/keybindings-store";
import { useTimelineStore } from "@/timeline/timeline-store";
`;
    content = content.replace('} from "@/services/renderer/gpu-renderer";', `} from "@/services/renderer/gpu-renderer";\n${imports}`);

    // Add exposure logic
    const exposureLogic = `
	const panel = usePanelStore();
	const preview = usePreviewStore();
	const sounds = useSoundsStore();
	const stickers = useStickersStore();
	const assets = useAssetsPanelStore();
	const properties = usePropertiesStore();
	const keybindings = useKeybindingsStore();
	const timeline = useTimelineStore();

	useEffect(() => {
		const w = window as any;
		w.__opencut = editor;
		w.__stores = {
			panel,
			preview,
			sounds,
			stickers,
			assets,
			properties,
			keybindings,
			timeline,
		};
	}, [
		editor,
		panel,
		preview,
		sounds,
		stickers,
		assets,
		properties,
		keybindings,
		timeline,
	]);
`;
    content = content.replace("useEditorActions();\n\tuseKeybindingsListener();", `useEditorActions();\n\tuseKeybindingsListener();\n${exposureLogic}`);

    fs.writeFileSync(editorProviderPath, content);
    console.log("✅ editor-provider.tsx patched.");
    patchedAny = true;
  } else {
    console.log("ℹ️ editor-provider.tsx already patched.");
  }
} else {
  console.log("⚠️ editor-provider.tsx not found — skipping (wrong OpenCut version?)");
}

// 2. Patch apps/web/src/app/projects/page.tsx (Next.js App Router)
const projectsPagePath = path.join(openCutPath, "apps/web/src/app/projects/page.tsx");
if (fs.existsSync(projectsPagePath)) {
  let content = fs.readFileSync(projectsPagePath, "utf-8");
  if (!content.includes("window.__opencut")) {
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
} else {
  console.log("⚠️ projects/page.tsx not found — skipping (wrong OpenCut version?)");
}

// 3. Fix env validation in apps/web/src/env/web.ts
const envWebPath = path.join(openCutPath, "apps/web/src/env/web.ts");
if (fs.existsSync(envWebPath)) {
  let content = fs.readFileSync(envWebPath, "utf-8");
  if (content.includes("z.url()")) {
    console.log("🛡️ Relaxing environment validation...");
    content = content.replace(/z\.url\(\)/g, "z.string().url().optional()");
    content = content.replace(/DATABASE_URL: z\.string\(\)\.refine\([\s\S]*?\),/g, "DATABASE_URL: z.string().optional(),");
    content = content.replace(/BETTER_AUTH_SECRET: z\.string\(\),/g, "BETTER_AUTH_SECRET: z.string().optional(),");
    content = content.replace(/UPSTASH_REDIS_REST_TOKEN: z\.string\(\),/g, "UPSTASH_REDIS_REST_TOKEN: z.string().optional(),");
    content = content.replace(/MARBLE_WORKSPACE_KEY: z\.string\(\),/g, "MARBLE_WORKSPACE_KEY: z.string().optional(),");
    content = content.replace(/FREESOUND_CLIENT_ID: z\.string\(\),/g, "FREESOUND_CLIENT_ID: z.string().optional(),");
    content = content.replace(/FREESOUND_API_KEY: z\.string\(\),/g, "FREESOUND_API_KEY: z.string().optional(),");
    fs.writeFileSync(envWebPath, content);
    console.log("✅ env/web.ts relaxed.");
    patchedAny = true;
  }
} else {
  console.log("⚠️ env/web.ts not found — skipping");
}

// 4. Force React versions in apps/web/package.json to 19.2.0 (matching current OpenCut)
const webPackageJsonPath = path.join(openCutPath, "apps/web/package.json");
if (fs.existsSync(webPackageJsonPath)) {
  console.log("⚛️ Setting compatible React versions...");
  const pkg = JSON.parse(fs.readFileSync(webPackageJsonPath, "utf-8"));
  pkg.dependencies.react = "19.2.0";
  pkg.dependencies["react-dom"] = "19.2.0";
  fs.writeFileSync(webPackageJsonPath, JSON.stringify(pkg, null, 2));
  console.log("✅ React versions set to 19.2.0.");
  patchedAny = true;
} else {
  console.log("⚠️ apps/web/package.json not found");
}

// 5. Create default .env if missing
const envPath = path.join(openCutPath, "apps/web/.env");
if (!fs.existsSync(envPath)) {
  console.log("📝 Creating default .env file...");
  const envContent = `
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL="postgresql://opencut:opencut@localhost:5432/opencut"
BETTER_AUTH_SECRET=dummy_secret
`;
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("✅ .env created.");
  patchedAny = true;
}

if (patchedAny) {
  console.log("\n🎉 OpenCut patched successfully!");
  console.log("Now run 'pnpm install' and 'pnpm dev:web' in the OpenCut directory.");
} else {
  console.log("\n⚠️ No files were patched. This likely means you have the NEW OpenCut rewrite");
  console.log("   (Vite + TanStack Router), which is NOT compatible with this MCP server.");
  console.log("   You need the LEGACY Next.js version of OpenCut for this controller to work.");
  process.exit(1);
}
