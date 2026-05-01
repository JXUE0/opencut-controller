
import fs from "fs";
import path from "path";

const targetDir = process.argv[2];

if (!targetDir) {
  console.error("❌ Por favor, proporciona la ruta a la carpeta de OpenCut.");
  console.log("Uso: bun run scripts/patch-editor.ts ../OpenCut");
  process.exit(1);
}

const openCutPath = path.resolve(targetDir);

if (!fs.existsSync(openCutPath)) {
  console.error(`❌ La ruta no existe: ${openCutPath}`);
  process.exit(1);
}

console.log(`🎬 Iniciando parcheo de OpenCut en: ${openCutPath}`);

// 1. Parchear apps/web/src/components/providers/editor-provider.tsx
const editorProviderPath = path.join(openCutPath, "apps/web/src/components/providers/editor-provider.tsx");
if (fs.existsSync(editorProviderPath)) {
  let content = fs.readFileSync(editorProviderPath, "utf-8");
  
  if (!content.includes("window.__opencut")) {
    console.log("📦 Inyectando ganchos de control en editor-provider.tsx...");
    
    // Añadir imports
    const imports = `import { usePanelStore } from "@/editor/panel-store";
import { usePreviewStore } from "@/preview/preview-store";
import { useSoundsStore } from "@/sounds/sounds-store";
import { useStickersStore } from "@/stickers/stickers-store";
import { useAssetsPanelStore } from "@/components/editor/panels/assets/assets-panel-store";
import { usePropertiesStore } from "@/components/editor/panels/properties/stores/properties-store";
`;
    content = content.replace('} from "@/services/renderer/gpu-renderer";', `} from "@/services/renderer/gpu-renderer";\n${imports}`);
    
    // Añadir lógica de exposición
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
    console.log("✅ editor-provider.tsx parcheado.");
  } else {
    console.log("ℹ️ editor-provider.tsx ya estaba parcheado.");
  }
}

// 2. Parchear apps/web/src/app/projects/page.tsx
const projectsPagePath = path.join(openCutPath, "apps/web/src/app/projects/page.tsx");
if (fs.existsSync(projectsPagePath)) {
  let content = fs.readFileSync(projectsPagePath, "utf-8");
  if (!content.includes("window.__opencut")) {
    console.log("📦 Inyectando ganchos en projects/page.tsx...");
    const projectExposure = `
	useEffect(() => {
		(window as any).__opencut = editor;
	}, [editor]);
`;
    content = content.replace("}, [editor.project]);", `}, [editor.project]);\n${projectExposure}`);
    fs.writeFileSync(projectsPagePath, content);
    console.log("✅ projects/page.tsx parcheado.");
  }
}

// 3. Arreglar env validation en apps/web/src/env/web.ts
const envWebPath = path.join(openCutPath, "apps/web/src/env/web.ts");
if (fs.existsSync(envWebPath)) {
  let content = fs.readFileSync(envWebPath, "utf-8");
  if (content.includes("z.url()")) {
    console.log("🛡️ Flexibilizando validación de variables de entorno...");
    content = content.replace(/z\.url\(\)/g, "z.string().url().optional()");
    content = content.replace(/DATABASE_URL: z\.string\(\)\.refine\([\s\S]*?\),/g, "DATABASE_URL: z.string().optional(),");
    content = content.replace(/BETTER_AUTH_SECRET: z\.string\(\),/g, "BETTER_AUTH_SECRET: z.string().optional(),");
    content = content.replace(/UPSTASH_REDIS_REST_TOKEN: z\.string\(\),/g, "UPSTASH_REDIS_REST_TOKEN: z.string().optional(),");
    content = content.replace(/MARBLE_WORKSPACE_KEY: z\.string\(\),/g, "MARBLE_WORKSPACE_KEY: z.string().optional(),");
    content = content.replace(/FREESOUND_CLIENT_ID: z\.string\(\),/g, "FREESOUND_CLIENT_ID: z.string().optional(),");
    content = content.replace(/FREESOUND_API_KEY: z\.string\(\),/g, "FREESOUND_API_KEY: z.string().optional(),");
    fs.writeFileSync(envWebPath, content);
    console.log("✅ env/web.ts flexibilizado.");
  }
}

// 4. Forzar versiones de React en apps/web/package.json
const webPackageJsonPath = path.join(openCutPath, "apps/web/package.json");
if (fs.existsSync(webPackageJsonPath)) {
  console.log("⚛️ Asegurando versiones compatibles de React...");
  const pkg = JSON.parse(fs.readFileSync(webPackageJsonPath, "utf-8"));
  pkg.dependencies.react = "19.0.0";
  pkg.dependencies["react-dom"] = "19.0.0";
  fs.writeFileSync(webPackageJsonPath, JSON.stringify(pkg, null, 2));
  console.log("✅ Versiones de React fijadas a 19.0.0.");
}

// 5. Crear .env por defecto
const envPath = path.join(openCutPath, "apps/web/.env");
if (!fs.existsSync(envPath)) {
  console.log("📝 Creando archivo .env por defecto...");
  const envContent = `
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL="postgresql://opencut:opencut@localhost:5432/opencut"
BETTER_AUTH_SECRET=dummy_secret
`;
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env creado.");
}

console.log("\n🎉 ¡OpenCut ha sido parcheado con éxito!");
console.log("Ahora ejecuta 'bun install' y 'bun dev:web' en la carpeta de OpenCut.");
