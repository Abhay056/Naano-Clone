const fs = require('fs');
const path = require('path');

function readStdinWithTimeout(timeoutMs = 150) {
  return new Promise((resolve) => {
    let data = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        process.stdin.pause();
        resolve(data.trim() ? data : null);
      }
    }, timeoutMs);

    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(data.trim() ? data : null);
      }
    });

    process.stdin.on('error', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    });

    process.stdin.resume();
  });
}

function findLatestSession(userHome) {
  const brainDir = path.join(userHome, '.gemini', 'antigravity-ide', 'brain');
  if (!fs.existsSync(brainDir)) return null;

  const entries = fs.readdirSync(brainDir, { withFileTypes: true });
  let latestDir = null;
  let latestMtime = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const logsDir = path.join(brainDir, entry.name, '.system_generated', 'logs');
      const transcriptFile = path.join(logsDir, 'transcript_full.jsonl');
      if (fs.existsSync(transcriptFile)) {
        const stat = fs.statSync(transcriptFile);
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestDir = {
            conversationId: entry.name,
            transcriptPath: transcriptFile
          };
        }
      }
    }
  }
  return latestDir;
}

async function main() {
  let payload = null;
  try {
    const raw = await readStdinWithTimeout(150);
    if (raw) {
      payload = JSON.parse(raw);
    }
  } catch (e) {}

  try {
    const userHome = process.env.USERPROFILE || process.env.HOME || '';
    let conversationId = payload?.conversationId;
    let transcriptPath = payload?.transcriptPath;
    let modelName = payload?.modelName || 'Gemini 3.7 Flash';

    if (!modelName || modelName === 'auto') {
      modelName = 'Gemini 3.7 Flash';
    }

    if (!conversationId || !transcriptPath) {
      const latest = findLatestSession(userHome);
      if (latest) {
        if (!conversationId) conversationId = latest.conversationId;
        if (!transcriptPath) transcriptPath = latest.transcriptPath;
      }
    }

    const workspaceRoot = (payload?.workspacePaths && payload.workspacePaths[0]) || path.resolve(__dirname, '..', '..');
    const agentLogsDir = path.join(workspaceRoot, '.agent-logs');

    if (!fs.existsSync(agentLogsDir)) {
      fs.mkdirSync(agentLogsDir, { recursive: true });
    }

    if (transcriptPath && transcriptPath.endsWith('transcript.jsonl')) {
      const fullPath = transcriptPath.replace('transcript.jsonl', 'transcript_full.jsonl');
      if (fs.existsSync(fullPath)) {
        transcriptPath = fullPath;
      }
    }

    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      console.log(JSON.stringify({}));
      return;
    }

    const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n').filter(Boolean);
    const entries = [];
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch (e) {}
    }

    const exchanges = [];
    let currentPrompt = null;
    let lastResponseContent = null;
    let lastResponseTimestamp = null;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.type === 'USER_INPUT' && entry.source === 'USER_EXPLICIT') {
        if (currentPrompt) {
          exchanges.push({
            prompt: currentPrompt.content,
            promptTime: currentPrompt.created_at,
            response: lastResponseContent || '',
            responseTime: lastResponseTimestamp || currentPrompt.created_at
          });
        }

        let promptText = entry.content || '';
        const match = promptText.match(/^<USER_REQUEST>\n?([\s\S]*?)\n?<\/USER_REQUEST>/);
        if (match) {
          promptText = match[1];
        }

        currentPrompt = {
          content: promptText,
          created_at: entry.created_at
        };
        lastResponseContent = null;
        lastResponseTimestamp = null;
      } else if (entry.type === 'PLANNER_RESPONSE' && entry.source === 'MODEL') {
        if (entry.content) {
          lastResponseContent = entry.content;
          lastResponseTimestamp = entry.created_at;
        }
      }
    }

    if (currentPrompt) {
      exchanges.push({
        prompt: currentPrompt.content,
        promptTime: currentPrompt.created_at,
        response: lastResponseContent || '',
        responseTime: lastResponseTimestamp || currentPrompt.created_at
      });
    }

    if (exchanges.length === 0) {
      console.log(JSON.stringify({}));
      return;
    }

    const shortSessionId = conversationId ? conversationId.substring(0, 8) : 'session';
    const firstPromptTime = exchanges[0].promptTime;
    const lastPromptTime = exchanges[exchanges.length - 1].promptTime;
    const startDate = firstPromptTime ? firstPromptTime.split('T')[0] : new Date().toISOString().split('T')[0];

    const fileList = fs.readdirSync(agentLogsDir);
    let targetFileName = fileList.find(f => f.includes(conversationId) && f.endsWith('.md'));

    if (!targetFileName) {
      const d = new Date(firstPromptTime || Date.now());
      const pad = n => String(n).padStart(2, '0');
      const timeStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}_${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`;
      targetFileName = `${timeStr}_${conversationId}.md`;
    }

    const targetFilePath = path.join(agentLogsDir, targetFileName);

    let doc = `---
session_id: ${conversationId}
date: ${startDate}
author: Abhay056
model: ${modelName}
tool: antigravity
project: naano-clone
total_exchanges: ${exchanges.length}
first_prompt_time: ${firstPromptTime}
last_prompt_time: ${lastPromptTime}
---

# Session Log - ${startDate}

Session: \`${shortSessionId}\` | Project: \`naano-clone\` | Author: \`Abhay056\`

---
`;

    exchanges.forEach((ex, idx) => {
      const num = idx + 1;
      doc += `\n[LOG_ENTRY type=PROMPT num=${num} session=${shortSessionId}]\ntimestamp: ${ex.promptTime}\nmodel: ${modelName}\n\n${ex.prompt}\n\n`;
      if (ex.response) {
        doc += `\n[LOG_ENTRY type=RESPONSE num=${num} session=${shortSessionId}]\ntimestamp: ${ex.responseTime}\nmodel: ${modelName}\n\n${ex.response}\n\n`;
      }
    });

    fs.writeFileSync(targetFilePath, doc, 'utf-8');
  } catch (err) {}

  console.log(JSON.stringify({}));
  process.exit(0);
}

main();
