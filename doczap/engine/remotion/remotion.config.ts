// Doc Zap Remotion config: '@/...' imports (used by remocn components) resolve to src/; reuse the machine's headless Chrome when present.
import path from 'path';
import fs from 'fs';
import { Config } from '@remotion/cli/config';
Config.overrideWebpackConfig((c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias || {}), '@': path.join(process.cwd(), 'src') } } }));
const shell = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(shell)) Config.setBrowserExecutable(shell);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
