const { execFile } = require('node:child_process');
const { readFile, rename, rm, writeFile } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { join } = require('node:path');
const { promisify } = require('node:util');

const calendarUrl = 'https://github.com/users/yuexihuanchen/contributions';
const repoUrl = 'https://api.github.com/users/yuexihuanchen/repos';
const gardenUrl = 'https://my-site-pink-iota.vercel.app/static/contentIndex.json';
const calendarPath = join(hexo.base_dir, 'github-contributions.json');
const skillsPath = join(hexo.base_dir, 'blog-skills.json');
const refreshInterval = 5 * 60 * 1000;
const dayMs = 86_400_000;
let calendar = null;
let skills = null;
let lastAttempt = 0;
let pendingRefresh;

async function download(url) {
    try {
        const response = await fetch(url, {
            headers: { 'Accept-Language': 'en-US', 'User-Agent': 'Hexo public blog data' },
            signal: AbortSignal.timeout(8000)
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.text();
    } catch (error) {
        if (process.platform !== 'win32') throw error;
        // Invoke-WebRequest can use the Windows system proxy.
        const { stdout } = await promisify(execFile)('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-Command',
            "$ErrorActionPreference = 'Stop'; [Console]::OutputEncoding = [Text.UTF8Encoding]::new(); " +
                "(Invoke-WebRequest -UseBasicParsing -TimeoutSec 8 -Headers @{'Accept-Language'='en-US'} -Uri '" + url + "').Content"
        ], { timeout: 12000, maxBuffer: 2_000_000, windowsHide: true });
        return stdout;
    }
}

function validDays(days) {
    return Array.isArray(days) && days.length >= 365 && days.length <= 372 &&
        days.every(({ date, level, count }, index) => {
            const time = Date.parse(date);
            return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(time) &&
                Number.isInteger(level) && level >= 0 && level <= 4 &&
                Number.isInteger(count) && count >= 0 && (count === 0) === (level === 0) &&
                (index === 0 || time - Date.parse(days[index - 1].date) === dayMs);
        });
}

function parseCalendar(html) {
    const counts = new Map();
    for (const match of html.matchAll(/<tool-tip\b[^>]*\bfor="(contribution-day-component-[^"]+)"[^>]*>\s*(No|\d[\d,]*)\s+contributions?\b/gi)) {
        counts.set(match[1], match[2] === 'No' ? 0 : Number(match[2].replaceAll(',', '')));
    }

    const days = [];
    for (const [cell] of html.matchAll(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/gi)) {
        const date = cell.match(/\bdata-date="([^"]+)"/)?.[1];
        const id = cell.match(/\bid="([^"]+)"/)?.[1];
        const level = cell.match(/\bdata-level="([0-4])"/)?.[1];
        days.push({ date, level: Number(level), count: counts.get(id) });
    }
    days.sort((left, right) => (left.date || '').localeCompare(right.date || ''));
    if (!validDays(days)) throw new Error('贡献日历格式不完整');
    return days;
}

async function readSnapshot(path) {
    try {
        return JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
        if (error.code !== 'ENOENT') hexo.log.warn('读取博客数据快照失败：%s', error.message);
        return null;
    }
}

async function saveSnapshot(path, value) {
    const tempPath = path + '.' + randomUUID() + '.tmp';
    try {
        await writeFile(tempPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
        await rename(tempPath, path);
    } finally {
        await rm(tempPath, { force: true }).catch(() => {});
    }
}

function parseNotes(index) {
    if (!index?.index || !Object.keys(index).some(path => path.startsWith('notes/learning/'))) {
        throw new Error('数字花园索引格式不完整');
    }
    return Object.entries(index)
        .filter(([, page]) => typeof page.title === 'string' && page.content?.trim().length >= 40)
        .map(([path, page]) => ({ path, title: page.title }));
}

async function downloadRepoLanguages() {
    const languages = Object.create(null);
    const cutoff = Date.now() - 180 * dayMs;
    for (let page = 1; ; page++) {
        const repos = JSON.parse(await download(repoUrl + '?sort=pushed&direction=desc&per_page=100&page=' + page));
        if (!Array.isArray(repos) || repos.some(repo => typeof repo.pushed_at !== 'string' || typeof repo.fork !== 'boolean')) {
            throw new Error('GitHub 仓库数据格式不完整');
        }
        for (const repo of repos) {
            if (repo.fork || repo.archived || !repo.language || Date.parse(repo.pushed_at) < cutoff) continue;
            languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
        if (repos.length < 100 || Date.parse(repos.at(-1).pushed_at) < cutoff) return languages;
    }
}

async function refreshSkills(updatedOn) {
    skills ??= await readSnapshot(skillsPath) || {};
    const results = await Promise.allSettled([
        download(gardenUrl).then(JSON.parse).then(parseNotes),
        downloadRepoLanguages()
    ]);
    const next = { ...skills };
    ['notes', 'repos'].forEach((source, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
            next[source] = { updatedOn, data: result.value };
        } else {
            hexo.log.warn('更新技能雷达 %s 数据失败：%s', source, result.reason.message);
        }
    });
    if (JSON.stringify(next) !== JSON.stringify(skills)) await saveSnapshot(skillsPath, next);
    skills = next;
}

async function refreshCalendar(updatedOn) {
    if (!calendar) {
        const cached = await readSnapshot(calendarPath);
        if (cached && validDays(cached.days)) calendar = cached;
    }
    const days = parseCalendar(await download(calendarUrl));
    const next = { updatedOn, days };
    if (JSON.stringify(next) !== JSON.stringify(calendar)) await saveSnapshot(calendarPath, next);
    calendar = next;
}

function refreshBlogData() {
    if (pendingRefresh) return pendingRefresh;
    if (Date.now() - lastAttempt < refreshInterval) return Promise.resolve();
    lastAttempt = Date.now();
    const updatedOn = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'short'
    }).format(lastAttempt);
    pendingRefresh = Promise.allSettled([refreshCalendar(updatedOn), refreshSkills(updatedOn)])
        .then(results => results.forEach(result => {
            if (result.status === 'rejected') hexo.log.warn('刷新博客数据失败：%s', result.reason.message);
        }))
        .finally(() => { pendingRefresh = null; });
    return pendingRefresh;
}

hexo.extend.filter.register('before_generate', refreshBlogData);

hexo.extend.filter.register('server_middleware', function (app) {
    app.use(this.config.root + '__blog-data', (request, response, next) => {
        if (request.method !== 'GET') return next();
        refreshBlogData().then(() => {
            const sections = ['github-contributions', 'skill-radar'];
            const locals = { config: this.config, site: { data: this.locals.get('data') } };
            const html = Object.fromEntries(sections.map(section => [
                section, this.theme.getView('_partial/' + section).renderSync(locals)
            ]));
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.setHeader('Cache-Control', 'no-store');
            response.end(JSON.stringify(html));
        }).catch(next);
    });
}, 1);

hexo.extend.helper.register('skill_radar_data', topics => {
    const notes = skills?.notes?.data;
    const repos = skills?.repos?.data;
    const knownLanguages = new Set(topics.flatMap(topic => topic.languages || []));
    const otherLanguages = Object.entries(repos || {}).filter(([language]) => !knownLanguages.has(language));
    const radarTopics = topics.map(topic => ({
        name: topic.name,
        notes: notes?.filter(note => topic.paths?.some(path => note.path.startsWith(path)) &&
            !topic.exclude?.some(path => note.path.startsWith(path))).map(note => note.title) || [],
        repos: repos ? (topic.languages || []).reduce((sum, language) => sum + (repos[language] || 0), 0) : null
    }));
    if (otherLanguages.length) {
        radarTopics.push({
            name: '其他语言',
            notes: [],
            repos: otherLanguages.reduce((sum, [, count]) => sum + count, 0),
            examples: otherLanguages.map(([language]) => language)
        });
    }
    return {
        reposUpdatedOn: skills?.repos?.updatedOn,
        notesUpdatedOn: skills?.notes?.updatedOn,
        topics: radarTopics
    };
});

hexo.extend.helper.register('github_contribution_calendar', () => {
    if (!calendar) return null;

    const first = new Date(calendar.days[0].date);
    const firstSunday = first.getTime() - first.getUTCDay() * dayMs;
    const months = [];
    let previousMonth = -1;
    let previousColumn = -3;
    const days = calendar.days.map(day => {
        const date = new Date(day.date);
        const column = Math.floor((date.getTime() - firstSunday) / (7 * dayMs));
        const month = date.getUTCMonth();
        if (month !== previousMonth && column - previousColumn >= 3) {
            months.push({ column, month: month + 1 });
            previousColumn = column;
        }
        previousMonth = month;
        return { ...day, column, row: date.getUTCDay() };
    });

    return {
        updatedOn: calendar.updatedOn,
        total: days.reduce((sum, day) => sum + day.count, 0),
        columns: days.at(-1).column + 1,
        months,
        days
    };
});
