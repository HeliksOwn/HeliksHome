let cachedPayload = null;
let cachedPayloadAt = 0;

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

function stripTags(value) {
  return decodeEntities(String(value || "").replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function uniq(array) {
  return [...new Set(array)];
}

function extractRoundBlock(html, startMarker, endMarker) {
  const startIndex = html.indexOf(startMarker);
  if (startIndex === -1) return "";

  const endIndex = endMarker ? html.indexOf(endMarker, startIndex) : -1;
  return endIndex === -1 ? html.slice(startIndex) : html.slice(startIndex, endIndex);
}

function parseGameIds(html) {
  return uniq((html.match(/showgame\.php\?game_id=(\d+)/g) || [])
    .map(match => Number(match.match(/(\d+)$/)?.[1]))
    .filter(Boolean));
}

function parseRoundSets(html, gameId) {
  const roundDefs = [
    { code: "J", name: "Jeopardy", startMarker: '<div id="jeopardy_round">', endMarker: '<div id="double_jeopardy_round">' },
    { code: "DJ", name: "Double Jeopardy", startMarker: '<div id="double_jeopardy_round">', endMarker: '<div id="final_jeopardy_round">' },
  ];

  const sets = [];

  for (const roundDef of roundDefs) {
    const block = extractRoundBlock(html, roundDef.startMarker, roundDef.endMarker);
    if (!block) continue;

    const categories = [...block.matchAll(/<td class="category_name">([\s\S]*?)<\/td>/g)].map(match => stripTags(match[1]));
    if (categories.length < 5) continue;

    const cluesByColumn = new Map();
    const clueRegex = new RegExp(
      `<td id="clue_${roundDef.code}_(\\d+)_(\\d+)" class="clue_text">([\\s\\S]*?)<\/td>\\s*<td id="clue_${roundDef.code}_\\1_\\2_r" class="clue_text" style="display:none;">([\\s\\S]*?)<\/td>`,
      "g"
    );

    let match;
    while ((match = clueRegex.exec(block)) !== null) {
      const [, columnStr, rowStr, questionHtml, answerHtml] = match;
      const column = Number(columnStr);
      const row = Number(rowStr);
      const clueId = `clue_${roundDef.code}_${column}_${row}`;
      const clueIndex = block.indexOf(`id="${clueId}" class="clue_text"`);
      const cluePrefix = clueIndex === -1 ? "" : block.slice(Math.max(0, clueIndex - 900), clueIndex);
      const valueMatch = cluePrefix.match(/<td class="clue_value">([\s\S]*?)<\/td>[\s\S]*$/);
      const answerMatch = answerHtml.match(/<em class="correct_response">([\s\S]*?)<\/em>/);

      if (!cluesByColumn.has(column)) {
        cluesByColumn.set(column, []);
      }

      cluesByColumn.get(column).push({
        id: `game-${gameId}-${roundDef.code}-${column}-${row}`,
        gameId,
        round: roundDef.name,
        category: categories[column - 1] || `Category ${column}`,
        column,
        row,
        value: stripTags(valueMatch ? valueMatch[1] : ""),
        question: stripTags(questionHtml),
        answer: stripTags(answerMatch ? answerMatch[1] : answerHtml),
      });
    }

    for (const [column, clues] of cluesByColumn.entries()) {
      const ordered = clues
        .filter(clue => clue.question && clue.answer)
        .sort((a, b) => a.row - b.row);

      if (ordered.length === 5) {
        sets.push({
          id: `game-${gameId}-${roundDef.code}-${column}`,
          gameId,
          round: roundDef.name,
          category: categories[column - 1] || `Category ${column}`,
          clues: ordered,
        });
      }
    }
  }

  return sets;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "HeliksHome Jeopardy ticker",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url} with status ${response.status}`);
  }

  return response.text();
}

async function fetchSetFromSeason(season) {
  const seasonHtml = await fetchText(`https://j-archive.com/showseason.php?season=${season}`);
  const gameIds = parseGameIds(seasonHtml);

  if (gameIds.length === 0) {
    throw new Error(`No J! Archive games found for season ${season}`);
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const gameId = pickRandom(gameIds);
    const html = await fetchText(`https://j-archive.com/showgame.php?game_id=${gameId}`);
    const sets = parseRoundSets(html, gameId);

    if (sets.length > 0) {
      return pickRandom(sets);
    }
  }

  throw new Error("No complete five-clue sets could be parsed from J! Archive");
}

export default async function handler(req, res) {
  try {
    const season = Math.min(Math.max(parseInt(req.query.season || "42", 10) || 42, 1), 42);
    const excludeIds = new Set(
      String(req.query.exclude || "")
        .split(",")
        .map(value => value.trim())
        .filter(Boolean)
    );

    if (cachedPayload && Date.now() - cachedPayloadAt < 5 * 60 * 1000 && cachedPayload.season === season && !excludeIds.has(cachedPayload.set.id)) {
      return res.status(200).json({
        source: "j-archive.com",
        season,
        set: cachedPayload.set,
        cached: true,
      });
    }

    const set = await fetchSetFromSeason(season);

    cachedPayload = { season, set };
    cachedPayloadAt = Date.now();

    res.status(200).json({
      source: "j-archive.com",
      season,
      set,
      cached: false,
    });
  } catch (error) {
    console.error("Jeopardy API error:", error);
    res.status(500).json({ error: "Unable to load Jeopardy clues" });
  }
}